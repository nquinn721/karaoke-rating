// Simple test script for Karafun service
const { HttpService } = require('@nestjs/axios');
const axios = require('axios');

// Mock the Karafun service parsing logic
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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: 10000,
      });

      console.log(`✅ Initial response status: ${initialResponse.status}`);
      console.log(`📄 Content length: ${initialResponse.data.length} characters`);
      console.log(`📄 Content preview: ${initialResponse.data.slice(0, 300)}...`);

      // Look for form elements in the HTML
      const formMatch = initialResponse.data.match(/<form[^>]*>[\s\S]*?<\/form>/gi);
      if (formMatch) {
        console.log(`\n📝 Found ${formMatch.length} form(s):`);
        formMatch.forEach((form, index) => {
          console.log(`Form ${index + 1}:`);
          console.log(form.slice(0, 500) + (form.length > 500 ? '...' : ''));
        });
      }

      // Look for input fields
      const inputMatches = initialResponse.data.match(/<input[^>]*>/gi);
      if (inputMatches) {
        console.log(`\n🔍 Found ${inputMatches.length} input field(s):`);
        inputMatches.forEach((input, index) => {
          if (input.includes('nickname') || input.includes('name') || input.includes('text')) {
            console.log(`Input ${index + 1}: ${input}`);
          }
        });
      }

      // Check for key indicators
      const hasNicknameForm = initialResponse.data.includes("What is your Nickname?");
      const hasQueue = initialResponse.data.includes("Queue");
      const hasRemoteControl = initialResponse.data.includes("Remote Control");
      const hasConnectionLost = initialResponse.data.includes("connection to the application has been lost");

      console.log(`\n🔍 Page Analysis:`);
      console.log(`  Has nickname form: ${hasNicknameForm}`);
      console.log(`  Has queue: ${hasQueue}`);
      console.log(`  Has remote control: ${hasRemoteControl}`);
      console.log(`  Has connection lost: ${hasConnectionLost}`);

      if (hasNicknameForm) {
        console.log("\n📝 Nickname form detected - attempting to submit...");
        
        // Extract cookies
        const cookies = initialResponse.headers["set-cookie"] || [];
        const cookieHeader = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
        console.log(`🍪 Cookies: ${cookieHeader ? "Found " + cookies.length + " cookies" : "None"}`);

        // Try form submission
        const possibleEndpoints = [
          `${url}?type=queueData`,
          `${url}`,
        ];

        for (const endpoint of possibleEndpoints) {
          try {
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

              for (const payload of payloads) {
                try {
                  console.log(`📦 Trying payload: ${payload}`);

                  const joinResponse = await axios.post(endpoint, payload, {
                    headers: {
                      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
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

                  console.log(`✅ Join response status: ${joinResponse.status}`);
                  console.log(`📄 Join response length: ${joinResponse.data.length} characters`);
                  
                  if (joinResponse.data.length > 0) {
                    console.log(`📄 Join response preview: ${joinResponse.data.slice(0, 300)}...`);

                    const afterHasNickname = joinResponse.data.includes("What is your Nickname?");
                    const afterHasQueue = joinResponse.data.includes("Queue");
                    const afterHasRemoteControl = joinResponse.data.includes("Remote Control");

                    console.log(`\n🔍 After Join Analysis:`);
                    console.log(`  Still has nickname form: ${afterHasNickname}`);
                    console.log(`  Now has queue: ${afterHasQueue}`);
                    console.log(`  Has remote control: ${afterHasRemoteControl}`);

                    if (!afterHasNickname && afterHasQueue) {
                      console.log("✅ SUCCESS! Successfully joined and now showing queue!");
                      return; // Exit the function on success
                    }
                  }

                } catch (payloadError) {
                  console.log(`❌ Payload failed: ${payloadError.message}`);
                  continue;
                }
              }

            } catch (endpointError) {
              console.log(`❌ Endpoint failed: ${endpointError.message}`);
              continue;
            }
          }      } else if (hasQueue) {
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
        console.error(`   Response data: ${error.response.data?.slice(0, 200)}...`);
      }
    }
  }
}

// Usage
async function main() {
  const service = new TestKarafunService();
  
  // You can test with a real session URL here
  const testUrl = process.argv[2] || "https://www.karafun.com/session/example123";
  
  if (testUrl === "https://www.karafun.com/session/example123") {
    console.log("⚠️ Using example URL. To test with a real session, run:");
    console.log("   node test-karafun.js https://www.karafun.com/session/YOUR_SESSION_ID");
    console.log("");
  }
  
  await service.testJoinSession(testUrl);
}

main().catch(console.error);
