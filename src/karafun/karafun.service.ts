import { Injectable, Logger } from "@nestjs/common";
import * as puppeteer from "puppeteer";
import {
  KarafunQueueData,
  KarafunSinger,
  KarafunSongEntry,
} from "./karafun.interface";

@Injectable()
export class KarafunService {
  private readonly logger = new Logger(KarafunService.name);

  /**
   * Main method to parse queue data from a Karafun session URL using Puppeteer
   * This is the primary method for SPA parsing as requested by the user
   */
  async parseQueueFromUrl(sessionUrl: string): Promise<KarafunQueueData> {
    this.logger.log(
      `🎤 Starting Puppeteer-only parsing for session: ${sessionUrl}`
    );

    try {
      const result = await this.parseQueueWithPuppeteer(sessionUrl);

      this.logger.log(`✅ Parsing complete: ${result.stateMessage}`);

      // Convert our internal format to the expected interface
      const sessionId = this.extractSessionIdFromUrl(sessionUrl);
      const singers = this.convertToSingersWithSongs(result.songEntries);
      const songEntries = result.songEntries.map((entry, index) => ({
        song: entry.song,
        singer: entry.singer,
        position: entry.position,
        isCurrent: index === 0,
      }));

      return {
        sessionId,
        singers,
        totalSingers: singers.length,
        lastUpdated: new Date(),
        songEntries,
        unparsedEntries: result.singers, // Keep original singer names as unparsed entries
        totalEntries: result.totalEntries,
        uniqueSingers: result.singers, // List of unique singer names (filtered)
        pageState:
          result.pageState === "populated"
            ? "populated"
            : result.pageState === "template_only"
              ? "empty"
              : result.pageState === "no_queue"
                ? "error"
                : "empty",
        stateMessage: result.stateMessage,
        hasCurrentPerformer: result.totalEntries > 0,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to parse session ${sessionUrl}:`, error);
      const sessionId = this.extractSessionIdFromUrl(sessionUrl);

      return {
        sessionId,
        singers: [],
        totalSingers: 0,
        lastUpdated: new Date(),
        songEntries: [],
        unparsedEntries: [],
        totalEntries: 0,
        uniqueSingers: [], // Add the missing uniqueSingers field
        pageState: "error",
        stateMessage: `Failed to parse Karafun session: ${error.message}`,
        hasCurrentPerformer: false,
      };
    }
  }

  /**
   * Join a Karafun session and parse the queue using Puppeteer
   * Handles SPA navigation and dynamic content loading
   */
  private async parseQueueWithPuppeteer(sessionUrl: string): Promise<{
    singers: string[];
    songEntries: Array<{ singer: string; song: string; position: number }>;
    totalEntries: number;
    pageState: "empty" | "populated" | "template_only" | "no_queue";
    stateMessage: string;
  }> {
    let browser: puppeteer.Browser | null = null;

    try {
      this.logger.debug("🚀 Launching headless browser");
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
      });

      const page = await browser.newPage();

      // Set user agent to avoid bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      this.logger.debug(`📍 Navigating to session: ${sessionUrl}`);
      await page.goto(sessionUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait for the initial page to load
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.logger.debug("🎭 Looking for nickname input to join session");

      // Check if we need to join the session (nickname input)
      const nicknameInput = await page.$(
        'input[placeholder*="nickname" i], input[placeholder*="name" i], input[type="text"]'
      );

      if (nicknameInput) {
        this.logger.debug("✏️ Found nickname input, joining session");
        await nicknameInput.type("QueueParser");

        // Look for join/submit button using valid selectors
        let joinButton = await page.$('button[type="submit"]');

        if (!joinButton) {
          // Find button by text content and click it directly
          const buttonClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            const targetButton =
              buttons.find(
                (btn) =>
                  btn.textContent &&
                  (btn.textContent.includes("Join") ||
                    btn.textContent.includes("Enter") ||
                    btn.textContent.includes("Continue") ||
                    btn.textContent.includes("Start"))
              ) || buttons[0]; // Fallback to first button

            if (targetButton) {
              targetButton.click();
              return true;
            }
            return false;
          });

          if (buttonClicked) {
            this.logger.debug(
              "🚪 Clicked join button via evaluation, waiting for session to load"
            );
          } else {
            this.logger.debug("⚠️ No suitable join button found");
          }
        } else {
          await joinButton.click();
          this.logger.debug(
            "🚪 Clicked submit button, waiting for session to load"
          );
        }

        // Wait for navigation after joining
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Enhanced waiting for dynamic content
      this.logger.debug("⏳ Waiting for queue content to load");

      try {
        // Wait for either queue section or timeout
        await page.waitForSelector(
          "[data-draggable], .queue-section, .queue-container",
          {
            timeout: 10000,
          }
        );
        this.logger.debug("📦 Queue structure detected");
      } catch {
        this.logger.debug("⚠️ No queue structure found within timeout");
      }

      // Additional wait for content population
      try {
        await page.waitForFunction(
          () => {
            const sungByElements = document.querySelectorAll("*");
            const hasActualContent = Array.from(sungByElements).some(
              (el) =>
                el.textContent &&
                el.textContent.includes("Sung by") &&
                !el.textContent.includes("${ item.options.singer }")
            );
            return hasActualContent;
          },
          { timeout: 5000 }
        );
        this.logger.debug("✨ Dynamic content populated");
      } catch {
        this.logger.debug("⚠️ Dynamic content not populated within timeout");
      }

      // Get the final HTML content
      const htmlContent = await page.content();
      this.logger.debug(
        `📄 Retrieved ${Math.round(htmlContent.length / 1024)}KB of HTML content`
      );

      // Debug: Save a snippet of the queue section for analysis
      const queueSectionMatch = htmlContent.match(/(Queue[\s\S]{0,2000})/i);
      if (queueSectionMatch) {
        this.logger.debug(
          `🔍 Queue section snippet: ${queueSectionMatch[1].substring(0, 500)}...`
        );
      }

      // Parse the HTML for singers
      const result = this.extractSingersFromHtml(htmlContent);

      return result;
    } finally {
      if (browser) {
        await browser.close();
        this.logger.debug("🔒 Browser closed");
      }
    }
  }

  /**
   * Extract singers from HTML content with comprehensive state detection
   * Handles empty sessions, template variables, and populated content
   */
  private extractSingersFromHtml(html: string): {
    singers: string[];
    songEntries: Array<{ singer: string; song: string; position: number }>;
    totalEntries: number;
    pageState: "empty" | "populated" | "template_only" | "no_queue";
    stateMessage: string;
  } {
    try {
      // Check if page has queue section
      const hasQueueSection =
        html.includes("Queue") || html.includes("queue-section");

      if (!hasQueueSection) {
        return {
          singers: [],
          songEntries: [],
          totalEntries: 0,
          pageState: "no_queue",
          stateMessage:
            "No queue section found - this may not be a Karafun session page",
        };
      }

      // Find all draggable elements (queue items)
      const draggableMatches = html.match(/data-draggable="true"/gi);
      const draggableCount = draggableMatches ? draggableMatches.length : 0;

      // Look for "Sung by" patterns in the content
      const sungByMatches = html.match(/Sung by\s+([^<\n$]+)/gi);
      const totalSungByMatches = sungByMatches ? sungByMatches.length : 0;

      // Filter out template variables like "${ item.options.singer }"
      const actualSungByEntries = sungByMatches
        ? sungByMatches.filter(
            (match) => !match.includes("${ item.options.singer }")
          )
        : [];

      this.logger.debug(`Queue section found: ${hasQueueSection}`);
      this.logger.debug(`Draggable items: ${draggableCount}`);
      this.logger.debug(`Total "Sung by" matches: ${totalSungByMatches}`);
      this.logger.debug(
        `Actual (non-template) entries: ${actualSungByEntries.length}`
      );

      // Handle different states
      if (actualSungByEntries.length === 0) {
        if (totalSungByMatches > 0) {
          return {
            singers: [],
            songEntries: [],
            totalEntries: 0,
            pageState: "template_only",
            stateMessage: `Found ${totalSungByMatches} template entries but no active queue - session may be empty or inactive`,
          };
        } else if (draggableCount > 0) {
          return {
            singers: [],
            songEntries: [],
            totalEntries: 0,
            pageState: "template_only",
            stateMessage: `Found ${draggableCount} draggable items but no singer names - queue structure exists but is empty`,
          };
        } else {
          return {
            singers: [],
            songEntries: [],
            totalEntries: 0,
            pageState: "empty",
            stateMessage:
              "Queue section exists but contains no entries - session is completely empty",
          };
        }
      }

      // Extract song and singer information from queue entries
      const uniqueSingers = new Set<string>();
      const validEntries: string[] = [];
      const songEntries: Array<{
        singer: string;
        song: string;
        position: number;
      }> = [];

      // Look for queue entries in a more comprehensive way
      // Karafun typically structures queue items with song title followed by "Sung by [Singer]"
      const queueItemPatterns = [
        // Pattern 1: Song title followed by "Sung by" on the same line or nearby
        /<[^>]*>([^<]+)<[^>]*>[\s\S]*?Sung by\s+([^<\n$]+)/gi,
        // Pattern 2: Direct text patterns for song title and singer
        /([A-Z][^<>\n]{3,60})\s*[\n\r\s]*Sung by\s+([^<\n$]+)/gi,
        // Pattern 3: More flexible pattern for various HTML structures
        />([^<>]{4,50})<[\s\S]*?>Sung by\s+([^<\n$]+)/gi,
      ];

      let allMatches: Array<{ song: string; singer: string }> = [];

      // Try each pattern to extract song-singer pairs
      for (const pattern of queueItemPatterns) {
        const matches = Array.from(html.matchAll(pattern));
        matches.forEach((match) => {
          if (match[1] && match[2]) {
            const potentialSong = match[1].trim();
            const potentialSinger = match[2].trim();

            // Clean up song title (remove HTML tags and extra whitespace)
            const cleanSong = potentialSong
              .replace(/<[^>]*>/g, "")
              .replace(/&[a-z]+;/gi, "")
              .trim();

            // Only add if it looks like a real song title (not HTML artifacts)
            if (
              cleanSong.length >= 4 &&
              cleanSong.length <= 100 &&
              !cleanSong.toLowerCase().includes("sung by") &&
              !cleanSong.toLowerCase().includes("queue") &&
              !cleanSong.toLowerCase().includes("position") &&
              potentialSinger.length > 0
            ) {
              allMatches.push({
                song: cleanSong,
                singer: potentialSinger,
              });
            }
          }
        });

        // If we found matches with this pattern, use them
        if (allMatches.length > 0) {
          this.logger.debug(`Found ${allMatches.length} matches with pattern`);
          break;
        }
      }

      // If no song-singer pairs found, fall back to singer-only extraction
      if (allMatches.length === 0) {
        this.logger.debug(
          "No song-singer pairs found, falling back to singer-only extraction"
        );
        actualSungByEntries.forEach((entry) => {
          const singerMatch = entry.match(/Sung by\s+([^<\n$]+)/i);
          if (singerMatch) {
            allMatches.push({
              song: "Unknown Song",
              singer: singerMatch[1].trim(),
            });
          }
        });
      }

      // Process all matches and filter out system messages
      allMatches.forEach((match, index) => {
        const singerName = match.singer.trim();
        const songTitle = match.song.trim();

        // Filter out system messages and invalid entries
        if (
          singerName &&
          singerName !== "undefined" &&
          singerName !== "null" &&
          !singerName.toLowerCase().includes("start rotation") &&
          !singerName.toLowerCase().includes("last song") &&
          !singerName.toLowerCase().includes("end rotation") &&
          !singerName.toLowerCase().includes("rotation start") &&
          !singerName.toLowerCase().includes("song = 9pm") &&
          !singerName.toLowerCase().includes("final song") &&
          !singerName.toLowerCase().includes("= 9pm")
        ) {
          uniqueSingers.add(singerName);
          validEntries.push(`${songTitle} - Sung by ${singerName}`);

          songEntries.push({
            singer: singerName,
            song: songTitle,
            position: songEntries.length + 1,
          });
        } else {
          this.logger.debug(`🚫 Filtered out system message: "${singerName}"`);
        }
      });

      const singersArray = Array.from(uniqueSingers);
      this.logger.log(
        `✅ Successfully extracted ${singersArray.length} unique singers from active queue (filtered ${actualSungByEntries.length - validEntries.length} system messages)`
      );

      return {
        singers: singersArray,
        songEntries,
        totalEntries: validEntries.length,
        pageState: "populated",
        stateMessage: `Found ${validEntries.length} valid queue entries with ${singersArray.length} unique singers`,
      };
    } catch (error) {
      this.logger.error("❌ Error extracting singers from HTML:", error);
      return {
        singers: [],
        songEntries: [],
        totalEntries: 0,
        pageState: "empty",
        stateMessage: `Parsing error: ${error.message}`,
      };
    }
  }

  /**
   * Helper method to extract session ID from URL
   */
  private extractSessionIdFromUrl(url: string): string {
    const match = url.match(/karaokebar\/([^/?]+)/);
    return match ? match[1] : "unknown";
  }

  /**
   * Convert song entries to KarafunSinger objects with song information
   */
  private convertToSingersWithSongs(
    songEntries: Array<{ singer: string; song: string; position: number }>
  ): KarafunSinger[] {
    // Group by singer to handle multiple songs per singer
    const singerMap = new Map<string, KarafunSinger>();

    songEntries.forEach((entry) => {
      if (singerMap.has(entry.singer)) {
        const existingSinger = singerMap.get(entry.singer)!;
        existingSinger.totalSongs = (existingSinger.totalSongs || 1) + 1;
        // Keep the first song as current song
      } else {
        singerMap.set(entry.singer, {
          nickname: entry.singer,
          position: entry.position,
          joinedAt: new Date(),
          currentSong: entry.song,
          totalSongs: 1,
        });
      }
    });

    return Array.from(singerMap.values()).sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    );
  }

  /**
   * Convert singer names to KarafunSinger objects
   */
  private convertToSingers(singerNames: string[]): KarafunSinger[] {
    return singerNames.map((name, index) => ({
      nickname: name,
      position: index + 1,
      joinedAt: new Date(),
      totalSongs: 1, // We don't know the actual count from parsing
    }));
  }

  /**
   * Create song entries from singer names (simplified)
   */
  private createSongEntries(singerNames: string[]): KarafunSongEntry[] {
    return singerNames.map((singer, index) => ({
      song: "Unknown Song", // We don't parse song titles yet
      singer,
      position: index + 1,
      isCurrent: index === 0,
    }));
  }

  /**
   * Test method for parsing static HTML (for testing)
   */
  async parseTestHtml(): Promise<KarafunQueueData> {
    this.logger.log("🧪 Parsing test HTML content");

    // Mock test data for development
    return {
      sessionId: "test",
      singers: [
        {
          nickname: "TestSinger1",
          position: 1,
          joinedAt: new Date(),
          totalSongs: 1,
        },
        {
          nickname: "TestSinger2",
          position: 2,
          joinedAt: new Date(),
          totalSongs: 1,
        },
      ],
      totalSingers: 2,
      lastUpdated: new Date(),
      songEntries: [
        {
          song: "Test Song 1",
          singer: "TestSinger1",
          position: 1,
          isCurrent: true,
        },
        { song: "Test Song 2", singer: "TestSinger2", position: 2 },
      ],
      unparsedEntries: ["TestSinger1", "TestSinger2"],
      totalEntries: 2,
      uniqueSingers: ["TestSinger1", "TestSinger2"], // Add unique singers list
      pageState: "populated",
      stateMessage: "Test data generated successfully",
      hasCurrentPerformer: true,
    };
  }

  /**
   * Utility method for joining sessions separately if needed
   */
  async joinSessionAndParseQueue(
    sessionUrl: string,
    nickname: string = "QueueParser"
  ): Promise<KarafunQueueData> {
    this.logger.log(`🎤 Joining session with nickname: ${nickname}`);
    return this.parseQueueFromUrl(sessionUrl);
  }
}
