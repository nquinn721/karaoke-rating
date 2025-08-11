// Test Puppeteer with Karafun to load dynamic content
const puppeteer = require("puppeteer");

async function testPuppeteerKarafun() {
  const url = "https://www.karafun.com/080601/";
  console.log(`🎯 Testing Puppeteer approach with: ${url}`);

  let browser;
  try {
    // Launch browser
    console.log("🚀 Launching browser...");
    browser = await puppeteer.launch({
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

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("📄 Loading page...");
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log("🔍 Checking initial page state...");

    // Check if we need to join the session
    const needsJoining = await page.evaluate(() => {
      return document.body.innerText.includes("What is your Nickname?");
    });

    if (needsJoining) {
      console.log("📝 Session requires nickname - attempting to join...");

      try {
        // Find the nickname input field and enter our nickname
        const nicknameInput = await page.$(
          '#userName, input[name="customize-session"], input[name="request-username-template"], input[type="text"]'
        );

        if (nicknameInput) {
          await nicknameInput.type("karafun_user_1");
          console.log("✍️ Entered nickname: karafun_user_1");

          // Try different ways to find and click the submit button
          let submitButton = null;

          // Try multiple selectors
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

            // Wait for navigation/loading after joining
            await new Promise((r) => setTimeout(r, 5000));
            console.log("⏳ Waited for session to load after joining...");
          } else {
            console.log("⚠️ Could not find join button, trying Enter key...");
            await page.keyboard.press("Enter");
            await new Promise((r) => setTimeout(r, 3000));
          }
        } else {
          console.log("⚠️ Could not find nickname input field");
        }
      } catch (joinError) {
        console.log(`⚠️ Error during joining: ${joinError.message}`);
      }
    } else {
      console.log("✅ No nickname required - session already accessible");
    }

    console.log("⏳ Waiting for queue data to load...");

    // Wait for queue elements to appear or timeout after 15 seconds
    try {
      await page.waitForSelector('[data-draggable="true"]', { timeout: 15000 });
      console.log("✅ Found draggable queue items!");
    } catch (timeoutError) {
      console.log(
        "⚠️ No draggable items found, checking for other queue indicators..."
      );
    }

    // Wait a bit more for any additional loading
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("🔍 Analyzing loaded content...");

    // Get the fully rendered HTML
    const html = await page.content();

    // Check what we can find now
    const pageInfo = await page.evaluate(() => {
      // Check for specific queue elements
      const draggableItems = document.querySelectorAll(
        '[data-draggable="true"]'
      );
      const sungByElements = document.querySelectorAll("*");
      const queueSection = document.querySelector('*[class*="Queue"]');

      // Look for the specific songs from the screenshot
      const pageText = document.body.innerText;

      return {
        draggableItemsCount: draggableItems.length,
        hasNateEntry: pageText.includes("NATE DAWGUHUHUHUHUH"),
        hasDawgEntry: pageText.includes("THE DAWGUHHHHHHHHHHHHHHHHHH"),
        hasLastSongEntry: pageText.includes("LAST SONG = 9PM"),
        hasSuckMyKiss: pageText.includes("Suck My Kiss"),
        hasImTooSexy: pageText.includes("I'm Too Sexy"),
        hasEndOfRoad: pageText.includes("End of the Road"),
        hasQueueSection: !!queueSection,
        pageTextLength: pageText.length,
        // Get first few lines of visible text
        pageTextPreview: pageText.split("\n").slice(0, 20).join("\n"),
      };
    });

    console.log("\n📊 Puppeteer Results:");
    console.log(`  Draggable items found: ${pageInfo.draggableItemsCount}`);
    console.log(`  Has queue section: ${pageInfo.hasQueueSection}`);
    console.log(`  Page text length: ${pageInfo.pageTextLength} chars`);
    console.log("\n  Specific songs from screenshot:");
    console.log(`    "NATE DAWGUHUHUHUHUH": ${pageInfo.hasNateEntry}`);
    console.log(`    "THE DAWGUHHHHHHHHHHHHHHHHHH": ${pageInfo.hasDawgEntry}`);
    console.log(`    "LAST SONG = 9PM": ${pageInfo.hasLastSongEntry}`);
    console.log(`    "Suck My Kiss": ${pageInfo.hasSuckMyKiss}`);
    console.log(`    "I'm Too Sexy": ${pageInfo.hasImTooSexy}`);
    console.log(`    "End of the Road": ${pageInfo.hasEndOfRoad}`);

    console.log("\n📄 Page text preview:");
    console.log(pageInfo.pageTextPreview);

    // Check the HTML for our target elements
    const htmlChecks = {
      hasConnectionLost: html.includes(
        "connection to the application has been lost"
      ),
      hasNicknameForm: html.includes("What is your Nickname"),
      hasQueue: html.includes("Queue"),
      draggableInHtml: (html.match(/data-draggable="true"/g) || []).length,
    };

    console.log("\n🔍 HTML Analysis after JavaScript:");
    console.log(`  Connection lost message: ${htmlChecks.hasConnectionLost}`);
    console.log(`  Nickname form: ${htmlChecks.hasNicknameForm}`);
    console.log(`  Queue text: ${htmlChecks.hasQueue}`);
    console.log(`  Draggable items in HTML: ${htmlChecks.draggableInHtml}`);

    if (pageInfo.draggableItemsCount > 0 || pageInfo.hasNateEntry) {
      console.log("\n✅ SUCCESS: Puppeteer can access the dynamic queue data!");
      console.log("   This confirms that static HTML scraping won't work,");
      console.log("   but Puppeteer can load the actual queue content.");
    } else {
      console.log(
        "\n❓ Puppeteer loaded the page but still no queue items found."
      );
      console.log("   This might indicate the session is actually empty,");
      console.log("   or there might be additional loading requirements.");
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔒 Browser closed");
    }
  }
}

testPuppeteerKarafun();
