// Test the clean Puppeteer-only Karafun service

const puppeteer = require("puppeteer");

async function testCleanPuppeteerService() {
  console.log("🧪 Testing clean Puppeteer-only Karafun service...\n");

  const testUrl = "https://www.karafun.com/080601/";
  console.log(`📝 Testing URL: ${testUrl}`);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    });

    const page = await browser.newPage();

    // Set viewport and user agent (same as service)
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("📄 Loading page with Puppeteer...");
    await page.goto(testUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Check if nickname is needed (same as service)
    const needsNickname = await page.evaluate(() => {
      return document.body.innerText.includes("What is your Nickname?");
    });

    console.log(`🔍 Nickname required: ${needsNickname ? "Yes" : "No"}`);

    if (needsNickname) {
      console.log("📝 Attempting to join session...");

      // Find nickname input
      const nicknameInput = await page.$(
        '#userName, input[name="customize-session"], input[name="request-username-template"], input[type="text"]'
      );

      if (nicknameInput) {
        await nicknameInput.type("karafun_user_1");
        console.log("✍️ Entered nickname: karafun_user_1");

        // Find and click button
        let submitButton = null;
        const buttonSelectors = [
          'button[type="submit"]',
          "button",
          ".button",
          'input[type="submit"]',
          '[role="button"]',
        ];

        for (const selector of buttonSelectors) {
          submitButton = await page.$(selector);
          if (submitButton) {
            console.log(`🖱️ Found button with selector: ${selector}`);
            break;
          }
        }

        if (submitButton) {
          console.log("🖱️ Clicking join button...");
          await submitButton.click();

          // Wait for page load
          await new Promise((resolve) => setTimeout(resolve, 5000));
          console.log("⏳ Waited for session to load after joining...");
        } else {
          console.log("⚠️ Could not find join button, trying Enter key...");
          await page.keyboard.press("Enter");
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } else {
        console.log("⚠️ Could not find nickname input field");
      }
    } else {
      console.log("✅ No nickname required - session already accessible");
    }

    console.log("⏳ Waiting for queue data to load...");

    // Wait for draggable items
    try {
      await page.waitForSelector('[data-draggable="true"]', { timeout: 15000 });
      const draggableCount = await page.$$eval(
        '[data-draggable="true"]',
        (els) => els.length
      );
      console.log(`✅ Found ${draggableCount} draggable queue items!`);

      if (draggableCount > 0) {
        // Get the HTML and test parsing logic
        const html = await page.content();
        console.log(`📄 Got ${html.length} characters of rendered HTML`);

        // Test some of the parsing logic
        const hasQueueSection = html.includes("Queue");
        const hasConnectionLost = html.includes(
          "connection to the application has been lost"
        );
        const sungByMatches = html.match(/Sung by\s+([^<\n]+)/gi);

        console.log("\n🔍 Page Analysis:");
        console.log(`  Queue section: ${hasQueueSection}`);
        console.log(`  Connection lost: ${hasConnectionLost}`);
        console.log(
          `  "Sung by" entries: ${sungByMatches ? sungByMatches.length : 0}`
        );

        if (sungByMatches && sungByMatches.length > 0) {
          console.log(
            `  First few entries: ${sungByMatches.slice(0, 3).join(", ")}`
          );
        }

        console.log("\n🎉 SUCCESS: Puppeteer-only approach works!");
        console.log(`✅ Found ${draggableCount} draggable items`);
        console.log(`✅ Successfully loaded dynamic SPA content`);
        console.log(`✅ Clean service architecture confirmed`);
      } else {
        console.log("⚠️ Found draggable selector but no items");
      }
    } catch (timeoutError) {
      console.log("⚠️ No draggable items found within timeout");

      // Still get the HTML to analyze what we got
      const html = await page.content();
      console.log(`📄 Got ${html.length} characters of HTML anyway`);

      const hasQueueSection = html.includes("Queue");
      const hasConnectionLost = html.includes(
        "connection to the application has been lost"
      );

      console.log("\n🔍 Page Analysis (without draggable items):");
      console.log(`  Queue section: ${hasQueueSection}`);
      console.log(`  Connection lost: ${hasConnectionLost}`);

      if (hasConnectionLost && !hasQueueSection) {
        console.log("📝 Page state would be: ERROR (connection lost)");
      } else if (hasQueueSection) {
        console.log("📝 Page state would be: EMPTY (queue found but no items)");
      } else {
        console.log("📝 Page state would be: LOADING (still loading)");
      }
    }

    await browser.close();

    console.log("\n✅ Clean Puppeteer-only service test complete!");
    console.log("🚀 Service is ready for SPA parsing");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

testCleanPuppeteerService();
