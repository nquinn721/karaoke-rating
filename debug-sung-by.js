// Test to see what the "Sung by" entries actually look like in the HTML

const puppeteer = require("puppeteer");

async function debugSungByEntries() {
  console.log('🔍 Debugging "Sung by" entries in HTML...\n');

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

    if (needsNickname) {
      console.log("📝 Joining session...");
      const nicknameInput = await page.$('#userName, input[type="text"]');

      if (nicknameInput) {
        await nicknameInput.type("karafun_user_1");

        // Find and click button using page evaluation to avoid invalid CSS selectors
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
          console.log("🚪 Clicked join button");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else {
          console.log("⚠️ No suitable button found");
        }
      }
    }

    // Wait for content
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const html = await page.content();
    console.log(`📄 Got ${html.length} characters of HTML`);

    // Find all "Sung by" entries and their surrounding context
    const sungByMatches = html.match(/Sung by\s+[^<\n]+/gi);
    console.log(
      `\n🎵 Found ${sungByMatches ? sungByMatches.length : 0} "Sung by" entries:`
    );

    if (sungByMatches) {
      sungByMatches.slice(0, 5).forEach((match, i) => {
        console.log(`  ${i + 1}. "${match}"`);

        // Find the context around this match
        const matchIndex = html.indexOf(match);
        const contextStart = Math.max(0, matchIndex - 200);
        const contextEnd = Math.min(
          html.length,
          matchIndex + match.length + 200
        );
        const context = html.substring(contextStart, contextEnd);

        console.log(
          `     Context: ${context.replace(/\n/g, " ").replace(/\s+/g, " ").substring(0, 150)}...`
        );
      });
    }

    // Also check draggable items
    const draggableItems = await page.$$('[data-draggable="true"]');
    console.log(`\n📦 Found ${draggableItems.length} draggable items`);

    if (draggableItems.length > 0) {
      console.log("\n🔍 First draggable item HTML:");
      const firstItemHTML = await draggableItems[0].evaluate(
        (el) => el.outerHTML
      );
      console.log(firstItemHTML.substring(0, 500) + "...");

      console.log("\n📝 First draggable item text content:");
      const firstItemText = await draggableItems[0].evaluate(
        (el) => el.textContent
      );
      console.log(`"${firstItemText}"`);
    }

    await browser.close();
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

debugSungByEntries();
