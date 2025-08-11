// Test multiple session URLs to find one with active queue content

const puppeteer = require("puppeteer");

async function testMultipleSessions() {
  console.log(
    "🧪 Testing multiple Karafun sessions to find active content...\n"
  );

  // Try multiple session URLs
  const testUrls = [
    "https://www.karafun.com/080601/",
    "https://www.karafun.com/kdQ0D5",
    "https://www.karafun.com/kPHDnXt",
    "https://www.karafun.com/session/kPHDnXt",
  ];

  for (const testUrl of testUrls) {
    console.log(`\n📝 Testing URL: ${testUrl}`);

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security",
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

      console.log(`  🔍 Nickname required: ${needsNickname ? "Yes" : "No"}`);

      if (needsNickname) {
        console.log("  📝 Joining session...");
        const nicknameInput = await page.$('#userName, input[type="text"]');

        if (nicknameInput) {
          await nicknameInput.type("karafun_user_1");
          const button = await page.$("button");
          if (button) {
            await button.click();
            console.log("  🖱️ Clicked join button");

            // Wait longer and check for different states
            for (let i = 0; i < 10; i++) {
              await new Promise((resolve) => setTimeout(resolve, 2000));

              const currentState = await page.evaluate(() => {
                const text = document.body.textContent || "";
                return {
                  hasQueue: text.includes("Queue"),
                  hasConnectionLost: text.includes(
                    "connection to the application has been lost"
                  ),
                  hasSungBy:
                    text.includes("Sung by") &&
                    !text.includes("${ item.options.singer }"),
                  hasTemplate: text.includes("${ item.options.singer }"),
                  hasDraggable: !!document.querySelector(
                    '[data-draggable="true"]'
                  ),
                };
              });

              console.log(
                `  ⏳ Wait ${i + 1}/10: Queue=${currentState.hasQueue}, SungBy=${currentState.hasSungBy}, Draggable=${currentState.hasDraggable}`
              );

              if (currentState.hasSungBy) {
                console.log("  ✅ Found actual singer content!");
                break;
              }
            }
          }
        }
      }

      // Final check
      const html = await page.content();
      const sungByMatches = html.match(/Sung by\s+([^<\n$]+)/gi);
      const actualEntries = sungByMatches
        ? sungByMatches.filter(
            (match) => !match.includes("${ item.options.singer }")
          )
        : [];

      console.log(`  📊 Results: ${actualEntries.length} actual singers found`);

      if (actualEntries.length > 0) {
        console.log(`  🎉 SUCCESS! Found active session with content:`);
        actualEntries.slice(0, 3).forEach((entry, i) => {
          const singer = entry.match(/Sung by\s+([^<\n$]+)/i);
          console.log(`    ${i + 1}. ${singer ? singer[1].trim() : entry}`);
        });

        await browser.close();
        console.log(`\n✅ WINNER: ${testUrl} has active queue content!`);
        return testUrl;
      }

      await browser.close();
    } catch (error) {
      console.log(`  ❌ Error with ${testUrl}: ${error.message}`);
    }
  }

  console.log("\n⚠️ No active sessions found in the test URLs");
  return null;
}

testMultipleSessions();
