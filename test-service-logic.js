// Test the actual service logic (mimicking what the service would do)
const axios = require("axios");

// Mock the service parsing method key parts
async function testServiceLogic() {
  const url = "https://www.karafun.com/080601/";

  console.log(`🎯 Testing service logic with: ${url}`);

  try {
    // Step 1: Get initial page (same as service)
    const initialResponse = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 10000,
    });

    console.log(`📄 Response status: ${initialResponse.status}`);
    console.log(`📄 Content length: ${initialResponse.data.length} characters`);

    const html = initialResponse.data;

    // Apply the same logic as the updated service
    const hasNicknameForm =
      (html.includes("You are about to join") &&
        html.includes("What is your Nickname?")) ||
      html.includes("What is your Nickname") ||
      html.includes("Enter your nickname") ||
      (html.includes("nickname") && html.includes("join"));

    const hasQueueData = html.includes("Queue");
    const hasConnectionLost = html.includes(
      "connection to the application has been lost"
    );

    console.log(`\n🔍 Service Logic Check:`);
    console.log(`  Has nickname form: ${hasNicknameForm}`);
    console.log(`  Has queue data: ${hasQueueData}`);
    console.log(`  Has connection lost: ${hasConnectionLost}`);

    // Check if there are any draggable items regardless of connection lost
    const draggableMatches = html.match(/data-draggable="true"/gi);
    console.log(
      `  Draggable items found: ${draggableMatches ? draggableMatches.length : 0}`
    );

    // Look for queue container and song entries
    const queueSectionPattern =
      /Queue.*?<div[^>]*class="[^"]*bg-background-02[^"]*"[^>]*>(.*?)<\/div>\s*<\/div>/gis;
    const queueSectionMatch = html.match(queueSectionPattern);
    console.log(`  Queue section found: ${queueSectionMatch ? "Yes" : "No"}`);

    // Look for "Sung by" entries which indicate actual queue items
    const sungByMatches = html.match(/Sung by\s+[^<]+/gi);
    console.log(
      `  "Sung by" entries found: ${sungByMatches ? sungByMatches.length : 0}`
    );

    if (sungByMatches && sungByMatches.length > 0) {
      console.log(
        `  First few entries: ${sungByMatches.slice(0, 3).join(", ")}`
      );
    }

    // Look for actual singer names from the screenshot
    const hasNateEntry = html.includes("NATE DAWGUHUHUHUHUH");
    const hasDawgEntry = html.includes("THE DAWGUHHHHHHHHHHHHHHHHHH");
    const hasLastSongEntry = html.includes("LAST SONG = 9PM");
    const hasSuckMyKiss = html.includes("Suck My Kiss");
    const hasImTooSexy = html.includes("I'm Too Sexy");
    const hasEndOfRoad = html.includes("End of the Road");

    console.log(`  Specific entries from screenshot:`);
    console.log(`    "NATE DAWGUHUHUHUHUH": ${hasNateEntry}`);
    console.log(`    "THE DAWGUHHHHHHHHHHHHHHHHHH": ${hasDawgEntry}`);
    console.log(`    "LAST SONG = 9PM": ${hasLastSongEntry}`);
    console.log(`    "Suck My Kiss": ${hasSuckMyKiss}`);
    console.log(`    "I'm Too Sexy": ${hasImTooSexy}`);
    console.log(`    "End of the Road": ${hasEndOfRoad}`);

    // Check if queue data is dynamically loaded
    const hasQueueDataStructures =
      html.includes("queueData") ||
      html.includes("queue-data") ||
      html.includes("Queue") ||
      html.includes("singers") ||
      html.includes("queue");

    console.log(
      `  Has queue-related data structures: ${hasQueueDataStructures}`
    );

    // Apply the service logic with the updated approach
    const hasSungByEntries =
      html.includes("Sung by") &&
      !html.includes("Sung by ${ item.options.singer }");
    const hasQueueStructure =
      html.includes("Queue") &&
      (html.includes("data-draggable") || html.includes("bg-background-02"));

    console.log(`  Has actual sung by entries: ${hasSungByEntries}`);
    console.log(`  Has queue structure: ${hasQueueStructure}`);

    if (
      hasConnectionLost &&
      !hasSungByEntries &&
      (!draggableMatches || draggableMatches.length === 0)
    ) {
      console.log(`\n⚠️ Service would return ERROR state:`);
      console.log(`   pageState: "error"`);
      console.log(
        `   stateMessage: "Session connection lost. The karaoke application needs to be running with remote control enabled."`
      );
      console.log(
        `   Reason: Connection lost message present AND no actual queue entries found`
      );
      return;
    } else if (
      hasConnectionLost &&
      (hasSungByEntries || (draggableMatches && draggableMatches.length > 0))
    ) {
      console.log(`\n✅ Service would IGNORE connection lost message:`);
      console.log(
        `   Reason: Queue entries are present despite connection lost message`
      );
      console.log(
        `   Actual queue entries detected: ${hasSungByEntries ? "Yes" : "No"}`
      );
      console.log(
        `   Draggable items: ${draggableMatches ? draggableMatches.length : 0}`
      );
    }

    if (hasNicknameForm && !hasQueueData) {
      console.log(`\n📝 Service would return NICKNAME-REQUIRED state:`);
      console.log(`   pageState: "nickname-required"`);
      console.log(`   stateMessage: "Session requires automatic joining"`);
      console.log(`   This would trigger automatic joining logic.`);
      return;
    }

    if (hasNicknameForm && hasQueueData) {
      console.log(`\n✅ Service would proceed to PARSE QUEUE:`);
      console.log(
        `   Both nickname form and queue present - parsing queue directly`
      );
      console.log(
        `   This means the automatic joining logic would be BYPASSED.`
      );

      // Check if there are any draggable items to parse
      const draggableMatches = html.match(/data-draggable="true"/gi);
      console.log(
        `   Draggable items found: ${draggableMatches ? draggableMatches.length : 0}`
      );

      if (draggableMatches && draggableMatches.length > 0) {
        console.log(`   pageState: "populated"`);
        console.log(`   Would parse ${draggableMatches.length} queue entries`);
      } else {
        console.log(`   pageState: "empty"`);
        console.log(`   stateMessage: "Queue found but no songs in queue"`);
      }
      return;
    }

    if (!hasNicknameForm && hasQueueData) {
      console.log(`\n✅ Service would proceed to PARSE QUEUE DIRECTLY:`);
      console.log(`   No nickname needed - can parse queue immediately`);
      return;
    }

    console.log(`\n🔍 CONCLUSION:`);
    console.log(
      `  The queue structure is present in HTML: ${hasQueueStructure}`
    );
    console.log(`  The actual queue entries are NOT in initial HTML`);
    console.log(`  This means queue data is loaded dynamically by JavaScript`);
    console.log(`  Static HTML scraping will NOT work for this session type`);

    console.log(`\n💡 RECOMMENDED SOLUTIONS:`);
    console.log(
      `  1. Use Puppeteer/Playwright to wait for JavaScript to load queue data`
    );
    console.log(
      `  2. Find and call the actual API endpoints that load queue data`
    );
    console.log(
      `  3. Use WebSocket connections if available for real-time data`
    );

    return;

    console.log(`\n❓ Unknown state - would likely return error`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testServiceLogic();
