// import-content.js
const axios = require("axios");
const fs = require("fs");

async function importContentData() {
  try {
    const contentData = JSON.parse(fs.readFileSync("content-data.json"));

    console.log(`Starting import of ${contentData.length} records...`);

    let successCount = 0;
    let errorCount = 0;

    for (const item of contentData) {
      try {
        const updateData = {
          data: {
            title: item.title,
            type: item.type,
            json_description: item.json_description,
            youtubeurl: item.youtubeurl,
            // Add relations
            topic: item.topic || null,
            subjects: item.subjects || [],
            // Add multimedia (only IDs will work if the files already exist in local DB)
            multimedia: item.multimedia?.map((m) => m.id) || [],
          },
        };

        await axios.put(
          `http://localhost:1337/api/contents/${item.id}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer 2cbb2f98d4ffe8d63ba70f6f69c86a368cebcc8cd59ba3fcc0adb8ce79d5b7d08bea8da36c34088ffae0b7b0b181e65bc3a8020a9ddfc90585e81b5cd41de3cd6a656544af9a4d2e43e5dce20bce2e40470872c4a8c404cf543bd9fa883dca58174316662313b9b05792605cb24cd0491889656ffccef894671edf876d866ec3`,
            },
          }
        );

        successCount++;
        console.log(
          `✓ Updated content ID: ${item.id} - ${item.title || "Untitled"}`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `✗ Failed to update ID ${item.id}:`,
          error.response?.data?.error?.message || error.message
        );
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  } catch (error) {
    console.error("❌ Import failed:", error.message);
  }
}

importContentData();
