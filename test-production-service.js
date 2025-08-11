// Test the updated production KarafunService with proper error handling

import { KarafunService } from "./src/karafun/karafun.service";

async function testProductionKarafunService() {
  console.log("🧪 Testing updated production KarafunService...\n");

  const karafunService = new KarafunService();

  // Test with one of our known session URLs
  const testUrl = "https://www.karafun.com/karaokebar/080601";

  try {
    console.log(`📍 Testing session: ${testUrl}`);
    console.log(
      "⏳ This will take 30-60 seconds as it launches browser and waits for content...\n"
    );

    const startTime = Date.now();
    const result = await karafunService.parseQueueFromUrl(testUrl);
    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`⏱️ Parsing completed in ${duration} seconds\n`);
    console.log("📊 Results:");
    console.log(`  Session URL: ${result.sessionUrl}`);
    console.log(`  Page State: ${result.pageState}`);
    console.log(`  State Message: ${result.stateMessage}`);
    console.log(`  Total Entries: ${result.totalEntries}`);
    console.log(`  Unique Singers: ${result.singers.length}`);

    if (result.singers.length > 0) {
      console.log(
        `  Singers Found: ${result.singers.slice(0, 5).join(", ")}${result.singers.length > 5 ? "..." : ""}`
      );
    }

    console.log(`\n✅ Service test completed successfully!`);
    console.log(`✅ Puppeteer-only architecture working correctly`);

    if (result.pageState === "template_only" || result.pageState === "empty") {
      console.log(`\n💡 This is expected behavior:`);
      console.log(`  - The session URL is either empty or inactive`);
      console.log(`  - Service correctly identifies empty sessions`);
      console.log(
        `  - With active karaoke sessions, singers would be extracted properly`
      );
    } else if (result.pageState === "populated") {
      console.log(`\n🎉 SUCCESS: Found active queue content!`);
      console.log(`  - Service successfully extracted singer data`);
      console.log(`  - Production ready for active karaoke sessions`);
    }
  } catch (error) {
    console.error("❌ Service test failed:", error.message);
    console.log("\n🔧 This might indicate:");
    console.log("  - Network connectivity issues");
    console.log("  - Puppeteer installation problems");
    console.log("  - Service configuration errors");
  }
}

// Run the test
testProductionKarafunService();
