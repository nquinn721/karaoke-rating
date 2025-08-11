// Test script to directly test the Karafun service parsing with the fixed logic
const axios = require("axios");

async function testParsingOnly() {
  const url = "https://www.karafun.com/080601/";

  console.log(`🎯 Testing parsing logic with: ${url}`);

  try {
    // Get the page content
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 10000,
    });

    console.log(`📄 Response status: ${response.status}`);
    console.log(`📄 Content length: ${response.data.length} characters`);

    const html = response.data;

    // Check what we can detect
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

    console.log(`\n🔍 Page Analysis:`);
    console.log(`  Has nickname form: ${hasNicknameForm}`);
    console.log(`  Has queue data: ${hasQueueData}`);
    console.log(`  Has connection lost: ${hasConnectionLost}`);

    if (hasNicknameForm && hasQueueData) {
      console.log(`\n✅ Both nickname form and queue are present!`);
      console.log(
        `   This means we should be able to parse the queue directly without joining.`
      );

      // Look for draggable items (queue entries)
      const draggableMatches = html.match(/data-draggable="true"/gi);
      console.log(
        `   Found ${draggableMatches ? draggableMatches.length : 0} draggable items (potential queue entries)`
      );

      // Look for queue section
      const queueMatches = html.match(/Queue[\s\S]{0,100}/gi);
      if (queueMatches) {
        console.log(`   Queue section preview: ${queueMatches[0]}`);
      }
    } else if (hasNicknameForm && !hasQueueData) {
      console.log(`\n⚠️ Only nickname form present - would need to join first`);
    } else if (!hasNicknameForm && hasQueueData) {
      console.log(`\n✅ Queue available without nickname - can parse directly`);
    } else {
      console.log(`\n❓ Unknown page state`);
    }

    if (hasConnectionLost) {
      console.log(
        `\n⚠️ Warning: "connection lost" detected - session may not be active`
      );
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testParsingOnly();
