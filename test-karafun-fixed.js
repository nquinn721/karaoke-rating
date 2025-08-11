// Simple test script for Karafun service
const axios = require("axios");

class TestKarafunService {
  constructor() {
    this.nickName = "karafun_user_1";
  }

  extractSessionId(url) {
    const match = url.match(/karafun\.com\/(?:session\/)?(\w+)/);
    return match ? match[1] : null;
  }

  async testJoinSession(url) {
    const sessionId = this.extractSessionId(url);
    if (!sessionId) {
      throw new Error("Invalid Karafun URL format");
    }

    const cleanNickname = this.nickName.trim().substring(0, 16);

    console.log(`🎯 Testing session: ${sessionId}`);
    console.log(`🔗 URL: ${url}`);
    console.log(`👤 Nickname: ${cleanNickname}`);

    try {
      // Step 1: Get initial page
      console.log("\n📄 Step 1: Getting initial page...");
      const initialResponse = await axios.get(url, {
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

      console.log(`✅ Initial response status: ${initialResponse.status}`);
      console.log(
        `📄 Content length: ${initialResponse.data.length} characters`
      );

      // Check for key indicators
      const hasNicknameForm = initialResponse.data.includes(
        "What is your Nickname?"
      );
      const hasQueue = initialResponse.data.includes("Queue");
      const hasRemoteControl = initialResponse.data.includes("Remote Control");
      const hasConnectionLost = initialResponse.data.includes(
        "connection to the application has been lost"
      );

      console.log(`\n🔍 Page Analysis:`);
      console.log(`  Has nickname form: ${hasNicknameForm}`);
      console.log(`  Has queue: ${hasQueue}`);
      console.log(`  Has remote control: ${hasRemoteControl}`);
      console.log(`  Has connection lost: ${hasConnectionLost}`);

      if (hasNicknameForm) {
        console.log("\n📝 Nickname form detected - attempting to submit...");

        // Extract cookies
        const cookies = initialResponse.headers["set-cookie"] || [];
        const cookieHeader = cookies
          .map((cookie) => cookie.split(";")[0])
          .join("; ");
        console.log(
          `🍪 Cookies: ${cookieHeader ? "Found " + cookies.length + " cookies" : "None"}`
        );

        // Try form submission with different field names found in the HTML
        const possibleEndpoints = [`${url}?type=queueData`, `${url}`];

        for (const endpoint of possibleEndpoints) {
          console.log(`\n📤 Trying endpoint: ${endpoint}`);

          // Try different field names based on the form analysis
          const payloads = [
            `customize-session=${encodeURIComponent(cleanNickname)}`,
            `request-username-template=${encodeURIComponent(cleanNickname)}`,
            `nickname=${encodeURIComponent(cleanNickname)}`,
          ];

          for (const payload of payloads) {
            try {
              console.log(`📦 Trying payload: ${payload}`);

              const joinResponse = await axios.post(endpoint, payload, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                  "Accept-Language": "en-US,en;q=0.5",
                  "Content-Type": "application/x-www-form-urlencoded",
                  DNT: "1",
                  Connection: "keep-alive",
                  "Upgrade-Insecure-Requests": "1",
                  Referer: url,
                  Cookie: cookieHeader,
                },
                maxRedirects: 5,
                timeout: 15000,
                validateStatus: function (status) {
                  return status < 400;
                },
              });

              console.log(`✅ Response status: ${joinResponse.status}`);
              console.log(
                `📄 Response length: ${joinResponse.data.length} characters`
              );

              if (joinResponse.data.length > 0) {
                console.log(
                  `📄 Response preview: ${joinResponse.data.slice(0, 300)}...`
                );

                const afterHasNickname = joinResponse.data.includes(
                  "What is your Nickname?"
                );
                const afterHasQueue = joinResponse.data.includes("Queue");
                const afterHasRemoteControl =
                  joinResponse.data.includes("Remote Control");

                console.log(`🔍 After submission:`);
                console.log(`  Still has nickname form: ${afterHasNickname}`);
                console.log(`  Now has queue: ${afterHasQueue}`);
                console.log(`  Has remote control: ${afterHasRemoteControl}`);

                if (!afterHasNickname && afterHasQueue) {
                  console.log(
                    "✅ SUCCESS! Successfully joined and now showing queue!"
                  );
                  return; // Exit on success
                }
              } else {
                console.log(
                  "📄 Got empty response - checking session state..."
                );

                // Check if session state changed by making a GET request
                const recheckResponse = await axios.get(url, {
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Accept:
                      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    DNT: "1",
                    Connection: "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                    Cookie: cookieHeader,
                  },
                  timeout: 10000,
                });

                const recheckHasNickname = recheckResponse.data.includes(
                  "What is your Nickname?"
                );
                const recheckHasQueue = recheckResponse.data.includes("Queue");

                console.log(`🔍 After recheck:`);
                console.log(`  Still has nickname form: ${recheckHasNickname}`);
                console.log(`  Now has queue: ${recheckHasQueue}`);

                if (!recheckHasNickname && recheckHasQueue) {
                  console.log(
                    "✅ SUCCESS! Session state changed - now showing queue!"
                  );
                  return;
                }
              }
            } catch (payloadError) {
              console.log(`❌ Payload failed: ${payloadError.message}`);
              continue;
            }
          }
        }

        console.log("⚠️ All form submission attempts failed");
      } else if (hasQueue) {
        console.log("✅ Queue already visible - no nickname needed!");
      } else if (hasRemoteControl) {
        console.log("⚠️ Remote Control page - session may not be active.");
      } else {
        console.log("❓ Unknown page state.");
      }
    } catch (error) {
      console.error(`❌ Error testing session: ${error.message}`);
      if (error.response) {
        console.error(`   Response status: ${error.response.status}`);
      }
    }
  }
}

// Usage
async function main() {
  const service = new TestKarafunService();

  const testUrl =
    process.argv[2] || "https://www.karafun.com/session/example123";

  if (testUrl === "https://www.karafun.com/session/example123") {
    console.log("⚠️ Using example URL. To test with a real session, run:");
    console.log(
      "   node test-karafun.js https://www.karafun.com/session/YOUR_SESSION_ID"
    );
    console.log("");
  }

  await service.testJoinSession(testUrl);
}

main().catch(console.error);
