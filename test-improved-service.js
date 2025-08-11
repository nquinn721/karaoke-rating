// Test the improved Puppeteer service with better dynamic content waiting

const puppeteer = require("puppeteer");

async function testImprovedService() {
  console.log(
    "🧪 Testing improved Puppeteer service with better content waiting...\n"
  );

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
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("📄 Loading page...");
    await page.goto(testUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Check if nickname is needed
    const needsNickname = await page.evaluate(() => {
      return document.body.innerText.includes("What is your Nickname?");
    });

    console.log(`🔍 Nickname required: ${needsNickname ? "Yes" : "No"}`);

    if (needsNickname) {
      console.log("📝 Joining session...");
      const nicknameInput = await page.$('#userName, input[type="text"]');

      if (nicknameInput) {
        await nicknameInput.type("karafun_user_1");
        const button = await page.$("button");
        if (button) {
          await button.click();
          await new Promise((resolve) => setTimeout(resolve, 5000));
          console.log("⏳ Waited after joining...");
        }
      }
    }

    // Wait for draggable elements first
    console.log("⏳ Waiting for draggable elements...");
    try {
      await page.waitForSelector('[data-draggable="true"]', { timeout: 15000 });
      const draggableCount = await page.$$eval(
        '[data-draggable="true"]',
        (els) => els.length
      );
      console.log(`✅ Found ${draggableCount} draggable elements`);

      // Now wait for actual content to populate (not template variables)
      console.log("⏳ Waiting for actual singer names to populate...");

      await page.waitForFunction(
        () => {
          // Look for actual "Sung by" text that's not a template variable
          const textContent = document.body.textContent || "";
          const hasSungBy = textContent.includes("Sung by ");
          const hasTemplate = textContent.includes("${ item.options.singer }");

          // We want "Sung by" text but NOT template variables
          return hasSungBy && !textContent.match(/Sung by\s*\$\{/);
        },
        { timeout: 25000 }
      );

      console.log("✅ Singer names populated!");
    } catch (timeoutError) {
      console.log("⚠️ Timeout waiting for content - checking current state...");
    }

    // Get the final HTML and test the parsing
    const html = await page.content();
    console.log(`📄 Got ${html.length} characters of HTML`);

    // Test the parsing logic
    const sungByMatches = html.match(/Sung by\s+([^<\n$]+)/gi);
    const actualSungByEntries = sungByMatches
      ? sungByMatches.filter(
          (match) => !match.includes("${ item.options.singer }")
        )
      : [];

    console.log(`\n🎵 Analysis:`);
    console.log(
      `  Total "Sung by" matches: ${sungByMatches ? sungByMatches.length : 0}`
    );
    console.log(
      `  Actual (non-template) entries: ${actualSungByEntries.length}`
    );

    if (actualSungByEntries.length > 0) {
      console.log(`  First few actual entries:`);
      actualSungByEntries.slice(0, 5).forEach((entry, i) => {
        const singerMatch = entry.match(/Sung by\s+([^<\n$]+)/i);
        if (singerMatch) {
          console.log(`    ${i + 1}. "${singerMatch[1].trim()}"`);
        }
      });

      // Count unique singers
      const uniqueSingers = new Set();
      actualSungByEntries.forEach((entry) => {
        const singerMatch = entry.match(/Sung by\s+([^<\n$]+)/i);
        if (singerMatch) {
          uniqueSingers.add(singerMatch[1].trim());
        }
      });

      console.log(`\n🎉 SUCCESS!`);
      console.log(`✅ Found ${actualSungByEntries.length} queue entries`);
      console.log(`✅ Found ${uniqueSingers.size} unique singers`);
      console.log(`✅ Dynamic content successfully loaded`);
      console.log(`✅ Service should now return proper singer count!`);
    } else {
      console.log(
        "\n⚠️ No actual singer names found - still template variables"
      );

      // Check what we actually got
      if (sungByMatches && sungByMatches.length > 0) {
        console.log(
          `  Template entries found: ${sungByMatches.slice(0, 3).join(", ")}`
        );
      }
    }

    await browser.close();
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testImprovedService();
