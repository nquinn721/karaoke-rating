import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";
// Removed InjectRepository and Repository since persistence isn't used yet
import * as puppeteer from "puppeteer";
import { KarafunQueueData } from "./karafun.interface";
import { ChatGateway } from "../chat/chat.gateway";

interface ActiveSession {
  browser: puppeteer.Browser;
  page: puppeteer.Page;
  sessionId: string;
  showId: string;
  lastUpdate: Date;
  isActive: boolean;
  retryCount: number;
}

@Injectable()
export class KarafunSessionManager {
  private readonly logger = new Logger(KarafunSessionManager.name);
  private activeSessions = new Map<string, ActiveSession>(); // key: showId
  private pollIntervals = new Map<string, NodeJS.Timeout>(); // key: showId
  private readonly MAX_RETRIES = 3;
  private readonly POLL_INTERVAL = 30000; // 30 seconds

  constructor(
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway
  ) {}

  /** Utility: detect Karafun remote-error page */
  private async isRemoteError(page: puppeteer.Page): Promise<boolean> {
    try {
      const url = page.url();
      if (url.includes("/remote-error")) return true;
      // Also check page content for the error message text
      const hasLostText = await page.evaluate(() => {
        const text = document.body.innerText || "";
        return (
          text.includes("The connection to the application has been lost") ||
          text.includes("reactivate the remote control feature") ||
          (text.includes("Remote Control") && text.includes("connection has been lost"))
        );
      });
      return !!hasLostText;
    } catch {
      return false;
    }
  }

  /** Utility: broadcast ended state and stop session */
  private async endSessionForRemoteError(showId: string): Promise<void> {
    const endedData: KarafunQueueData = {
      sessionId: "unknown",
      singers: [],
      totalSingers: 0,
      lastUpdated: new Date(),
      songEntries: [],
      unparsedEntries: [],
      totalEntries: 0,
      uniqueSingers: [],
      pageState: "error",
      stateMessage:
        "Karafun session ended: remote control connection lost (remote-error)",
      hasCurrentPerformer: false,
    };

    // Notify clients
    this.chatGateway.server
      .to(`show_${showId}`)
      .emit("karafunQueueUpdated", { showId: parseInt(showId), karafunData: endedData });

    // Optional: dedicated ended event
    this.chatGateway.server
      .to(`show_${showId}`)
      .emit("karafunSessionEnded", { showId: parseInt(showId) });

    // Stop the Puppeteer session
    await this.stopSession(showId);
  }

  /**
   * Start a persistent session for a show and begin monitoring queue changes
   */
  async startPersistentSession(
    showId: string,
    karafunUrl: string
  ): Promise<KarafunQueueData> {
    this.logger.log(`🚀 Starting persistent session for show ${showId}`);

    // Stop existing session if any
    await this.stopSession(showId);

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-dev-shm-usage",
        ],
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      // Join the session
      await page.goto(karafunUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // If the session already shows remote-error, end immediately
      if (await this.isRemoteError(page)) {
        this.logger.warn(`Karafun session for show ${showId} is already in remote-error; stopping.`);
        await this.endSessionForRemoteError(showId);
        // Return an error-shaped payload so callers have something deterministic
        return {
          sessionId: this.extractSessionIdFromUrl(karafunUrl) || "unknown",
          singers: [],
          totalSingers: 0,
          lastUpdated: new Date(),
          songEntries: [],
          unparsedEntries: [],
          totalEntries: 0,
          uniqueSingers: [],
          pageState: "error",
          stateMessage: "Karafun session ended (remote-error)",
          hasCurrentPerformer: false,
        };
      }

      // Handle nickname input if needed
      const nicknameInput = await page.$(
        'input[placeholder*="nickname" i], input[placeholder*="name" i], input[type="text"]'
      );

      if (nicknameInput) {
        this.logger.debug("✏️ Joining session with nickname");
        await nicknameInput.type("QueueWatcher");

        const joinButton = await page.$('button[type="submit"]');
        if (joinButton) {
          await joinButton.click();
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          // Try to find join button by text
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            const targetButton = buttons.find(
              (btn) =>
                btn.textContent &&
                (btn.textContent.includes("Join") ||
                  btn.textContent.includes("Enter") ||
                  btn.textContent.includes("Continue") ||
                  btn.textContent.includes("Start"))
            );
            if (targetButton) {
              (targetButton as HTMLButtonElement).click();
            }
          });
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      const sessionId = this.extractSessionIdFromUrl(karafunUrl);

      // Store the active session
      const activeSession: ActiveSession = {
        browser,
        page,
        sessionId,
        showId,
        lastUpdate: new Date(),
        isActive: true,
        retryCount: 0,
      };

      this.activeSessions.set(showId, activeSession);

      // Get initial queue data
      const initialData = await this.getQueueFromPage(page, sessionId);

      // Broadcast initial data
      this.chatGateway.server.to(`show_${showId}`).emit("karafunQueueUpdated", {
        showId: parseInt(showId),
        karafunData: initialData,
      });

      // Start polling for changes
      this.startPolling(showId);

      this.logger.log(
        `✅ Persistent session started for show ${showId} with ${initialData.singers.length} singers`
      );

      return initialData;
    } catch (error) {
      this.logger.error(
        `❌ Failed to start persistent session for show ${showId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Start polling for queue changes on an active session
   */
  private startPolling(showId: string): void {
    if (this.pollIntervals.has(showId)) {
      clearInterval(this.pollIntervals.get(showId)!);
    }

    const interval = setInterval(async () => {
      try {
        await this.checkForUpdates(showId);
      } catch (error) {
        this.logger.error(`❌ Polling error for show ${showId}:`, error);

        const session = this.activeSessions.get(showId);
        if (session) {
          session.retryCount++;
          if (session.retryCount >= this.MAX_RETRIES) {
            this.logger.warn(
              `⚠️ Max retries reached for show ${showId}, stopping session`
            );
            await this.stopSession(showId);
          }
        }
      }
    }, this.POLL_INTERVAL);

    this.pollIntervals.set(showId, interval);
    this.logger.debug(`📡 Started polling for show ${showId}`);
  }

  /**
   * Check for queue updates and broadcast changes
   */
  private async checkForUpdates(
    showId: string
  ): Promise<KarafunQueueData | null> {
    const session = this.activeSessions.get(showId);
    if (!session || !session.isActive) {
      return null;
    }

    try {
      // Check if page is still responsive
      await session.page.evaluate(() => document.title);

      // Detect remote-error during polling
      if (await this.isRemoteError(session.page)) {
        this.logger.log(`Detected remote-error for show ${showId}; stopping session.`);
        await this.endSessionForRemoteError(showId);
        return null;
      }

      const queueData = await this.getQueueFromPage(
        session.page,
        session.sessionId
      );

      session.lastUpdate = new Date();
      session.retryCount = 0; // Reset retry count on success

      // Broadcast update to clients via WebSocket
      this.chatGateway.server
        .to(`show_${showId}`)
        .emit("karafunQueueUpdated", {
          showId: parseInt(showId),
          karafunData: queueData,
        });

      this.logger.debug(
        `🔄 Queue update for show ${showId}: ${queueData.singers.length} singers`
      );

      return queueData;
    } catch (error) {
      this.logger.warn(`⚠️ Failed to check updates for show ${showId}:`, error);
      throw error;
    }
  }

  /**
   * Get current queue data from the active page
   */
  private async getQueueFromPage(
    page: puppeteer.Page,
    sessionId: string
  ): Promise<KarafunQueueData> {
    const htmlContent = await page.content();
    const result = this.extractSingersFromHtml(htmlContent);

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
      unparsedEntries: result.singers,
      totalEntries: result.totalEntries,
      uniqueSingers: result.singers,
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
  }

  /**
   * Stop a persistent session and cleanup resources
   */
  async stopSession(showId: string): Promise<void> {
    const session = this.activeSessions.get(showId);
    if (session) {
      this.logger.log(`🛑 Stopping persistent session for show ${showId}`);

      try {
        if (session.browser) {
          await session.browser.close();
        }
      } catch (error) {
        this.logger.warn(`⚠️ Error closing browser for show ${showId}:`, error);
      }

      this.activeSessions.delete(showId);
    }

    const interval = this.pollIntervals.get(showId);
    if (interval) {
      clearInterval(interval);
      this.pollIntervals.delete(showId);
    }
  }

  /**
   * Get current status of all active sessions
   */
  getActiveSessionsStatus(): Array<{
    showId: string;
    sessionId: string;
    lastUpdate: Date;
    isActive: boolean;
    retryCount: number;
  }> {
    return Array.from(this.activeSessions.values()).map((session) => ({
      showId: session.showId,
      sessionId: session.sessionId,
      lastUpdate: session.lastUpdate,
      isActive: session.isActive,
      retryCount: session.retryCount,
    }));
  }

  /**
   * Check if a show has an active session
   */
  hasActiveSession(showId: string): boolean {
    return (
      this.activeSessions.has(showId) &&
      this.activeSessions.get(showId)?.isActive === true
    );
  }

  /**
   * Stop all active sessions (cleanup on service shutdown)
   */
  async stopAllSessions(): Promise<void> {
    this.logger.log("🛑 Stopping all persistent sessions");

    const showIds = Array.from(this.activeSessions.keys());
    await Promise.all(showIds.map((showId) => this.stopSession(showId)));
  }

  /**
   * Extract session ID from Karafun URL
   */
  private extractSessionIdFromUrl(url: string): string {
    const match = url.match(/karaokebar\/([^/?]+)/);
    return match ? match[1] : "unknown";
  }

  /**
   * Extract singers from HTML content (reused from main service)
   */
  private extractSingersFromHtml(html: string): {
    singers: string[];
    songEntries: Array<{ singer: string; song: string; position: number }>;
    totalEntries: number;
    pageState: "empty" | "populated" | "template_only" | "no_queue";
    stateMessage: string;
  } {
    // Implementation would be similar to the main KarafunService
    // For brevity, I'll implement a simplified version
    const sungByMatches = html.match(/Sung by\s+([^<\n$]+)/gi);

    if (!sungByMatches || sungByMatches.length === 0) {
      return {
        singers: [],
        songEntries: [],
        totalEntries: 0,
        pageState: "empty",
        stateMessage: "No queue entries found",
      };
    }

    const songEntries: Array<{
      singer: string;
      song: string;
      position: number;
    }> = [];
    const singers = new Set<string>();

    sungByMatches.forEach((match, index) => {
      const singerMatch = match.match(/Sung by\s+([^<\n$]+)/i);
      if (singerMatch) {
        const singer = singerMatch[1].trim();
        singers.add(singer);
        songEntries.push({
          singer,
          song: "Unknown Song", // Simplified for now
          position: index + 1,
        });
      }
    });

    return {
      singers: Array.from(singers),
      songEntries,
      totalEntries: songEntries.length,
      pageState: "populated",
      stateMessage: `Found ${songEntries.length} queue entries`,
    };
  }

  /**
   * Convert song entries to singer objects
   */
  private convertToSingersWithSongs(
    songEntries: Array<{ singer: string; song: string; position: number }>
  ): any[] {
    const singerMap = new Map();

    songEntries.forEach((entry) => {
      if (singerMap.has(entry.singer)) {
        const existingSinger = singerMap.get(entry.singer);
        existingSinger.totalSongs = (existingSinger.totalSongs || 1) + 1;
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
}
