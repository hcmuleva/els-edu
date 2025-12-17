// export-content.js
const axios = require("axios");
const fs = require("fs");

async function exportContentData() {
  try {
    let allContent = [];
    let page = 1;
    let hasMore = true;

    // Fetch all pages
    while (hasMore) {
      console.log(`Fetching page ${page}...`);

      const response = await axios.get(
        "https://emeelan.com/els-kidsserver/api/contents",
        {
          params: {
            pagination: {
              pageSize: 100,
              page: page,
            },
            populate: {
              multimedia: true,
              topic: {
                fields: ["id", "name"],
              },
              subjects: {
                fields: ["id", "name"],
              },
            },
          },
          headers: {
            Authorization: `Bearer 2cbb2f98d4ffe8d63ba70f6f69c86a368cebcc8cd59ba3fcc0adb8ce79d5b7d08bea8da36c34088ffae0b7b0b181e65bc3a8020a9ddfc90585e81b5cd41de3cd6a656544af9a4d2e43e5dce20bce2e40470872c4a8c404cf543bd9fa883dca58174316662313b9b05792605cb24cd0491889656ffccef894671edf876d866ec3`,
          },
        }
      );

      // Debug: Check if we got data
      if (!response.data || !response.data.data) {
        console.log(
          "❌ No data in response. Response structure:",
          JSON.stringify(response.data, null, 2).substring(0, 500)
        );
        break;
      }

      console.log(`✓ Found ${response.data.data.length} items on page ${page}`);

      const pageData = response.data.data
        .map((item, index) => {
          try {
            // Check if data exists directly on item (Strapi v5 flat format)
            if (
              !item.title &&
              !item.type &&
              !item.json_description &&
              !item.youtubeurl
            ) {
              console.warn(`⚠️  Item ${index} (ID: ${item.id}) has no data`);
              return null;
            }

            return {
              id: item.id,
              title: item.title || null,
              type: item.type || null,
              json_description: item.json_description || null,
              youtubeurl: item.youtubeurl || null,
            };
          } catch (error) {
            console.error(`❌ Error processing item ${index}:`, error.message);
            return null;
          }
        })
        .filter((item) => item !== null);

      allContent = allContent.concat(pageData);

      // Check if there are more pages
      if (response.data.meta && response.data.meta.pagination) {
        hasMore =
          response.data.meta.pagination.page <
          response.data.meta.pagination.pageCount;
        page++;
      } else {
        hasMore = false;
      }
    }

    fs.writeFileSync("content-data.json", JSON.stringify(allContent, null, 2));
    console.log(
      `\n✅ Exported ${allContent.length} content records to content-data.json`
    );
  } catch (error) {
    console.error("❌ Export failed:");
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
}

exportContentData();
