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
        // Create payload with only the 4 fields we extracted
        const postData = {
          data: {
            title: item.title,
            type: item.type,
            json_description: item.json_description,
            youtubeurl: item.youtubeurl,
          },
        };

        // PUT to update existing content records in local database
        const response = await axios.put(
          `http://localhost:1337/api/contents/${item.id}`,
          postData,
          {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc`,
              "Content-Type": "application/json",
            },
          }
        );

        successCount++;
        console.log(
          `✓ Updated content: ${item.id} - ${item.title || "Untitled"}`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `✗ Failed to update ID ${item.id} "${item.title || "Untitled"}":`,
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
