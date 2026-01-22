const strapi = require("@strapi/strapi");
require("dotenv").config();

const PARENT_ID = "vwydec5pp22oxjfmqhkavgi1";
const CHILD_ID = "qi1fzo7wzqxd57jsr8mk3ekf";

async function linkUsers() {
  // Initialize Strapi
  const app = await strapi.createStrapi({ distDir: "./dist" }).load();

  try {
    console.log(`🔗 Linking Child (${CHILD_ID}) to Parent (${PARENT_ID})...`);

    // 1. Fetch Parent to check existence
    const parent = await app.entityService.findOne(
      "plugin::users-permissions.user",
      PARENT_ID,
      {
        populate: ["children"],
      },
    );

    if (!parent) {
      console.error("❌ Parent user not found!");
      process.exit(1);
    }

    // 2. Fetch Child to check existence
    const child = await app.entityService.findOne(
      "plugin::users-permissions.user",
      CHILD_ID,
    );

    if (!child) {
      console.error("❌ Child user not found!");
      process.exit(1);
    }

    console.log(`   Found Parent: ${parent.username}`);
    console.log(`   Found Child: ${child.username}`);

    // 3. Update Parent's children
    // We append the new child to existing ones to avoid overwriting
    const existingChildrenIds = parent.children
      ? parent.children.map((c) => c.documentId)
      : [];

    if (existingChildrenIds.includes(CHILD_ID)) {
      console.log("⚠️  Child is already linked to this parent.");
    } else {
      await app.entityService.update(
        "plugin::users-permissions.user",
        PARENT_ID,
        {
          data: {
            children: {
              connect: [CHILD_ID],
            },
          },
        },
      );
      console.log("✅ Successfully linked Child to Parent!");
    }
  } catch (error) {
    console.error("❌ Error linking users:", error);
  } finally {
    // app.server.close(); // Not needed for script execution usually, but good practice
    process.exit(0);
  }
}

linkUsers();
