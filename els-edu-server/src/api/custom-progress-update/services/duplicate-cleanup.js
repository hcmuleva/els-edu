/**
 * Cleanup script to remove duplicate lessons and kitlevels
 * Keeps the record with the lower ID (original) and deletes higher IDs (duplicates)
 */

module.exports = {
  /**
   * Delete duplicate lessons, keeping only the one with lowest ID
   */
  async cleanupDuplicateLessons(strapi) {
    try {
      console.log("🧹 Starting lesson cleanup...");

      // Get all lessons
      const allLessons = await strapi.db.query("api::lesson.lesson").findMany({
        select: ["id", "documentId", "title"],
      });

      // Group by documentId
      const grouped = {};
      allLessons.forEach((lesson) => {
        if (!grouped[lesson.documentId]) {
          grouped[lesson.documentId] = [];
        }
        grouped[lesson.documentId].push(lesson);
      });

      // Find and delete duplicates
      let deletedCount = 0;
      for (const [documentId, lessons] of Object.entries(grouped)) {
        if (lessons.length > 1) {
          // Sort by ID, keep the first (lowest ID), delete the rest
          lessons.sort((a, b) => a.id - b.id);
          const toKeep = lessons[0];
          const toDelete = lessons.slice(1);

          console.log(`  Duplicate found: "${toKeep.title}" (${documentId})`);
          console.log(`    Keeping ID: ${toKeep.id}`);
          console.log(
            `    Deleting IDs: ${toDelete.map((l) => l.id).join(", ")}`
          );

          // Delete the duplicates
          for (const lesson of toDelete) {
            await strapi.db.query("api::lesson.lesson").delete({
              where: { id: lesson.id },
            });
            deletedCount++;
          }
        }
      }

      console.log(`✅ Deleted ${deletedCount} duplicate lessons`);
      return { deleted: deletedCount };
    } catch (error) {
      console.error("❌ Error cleaning up lessons:", error);
      throw error;
    }
  },

  /**
   * Delete duplicate kitlevels, keeping only the one with lowest ID
   */
  async cleanupDuplicateKitlevels(strapi) {
    try {
      console.log("🧹 Starting kitlevel cleanup...");

      // Get all kitlevels
      const allLevels = await strapi.db
        .query("api::kitlevel.kitlevel")
        .findMany({
          select: ["id", "documentId", "title"],
        });

      // Group by documentId
      const grouped = {};
      allLevels.forEach((level) => {
        if (!grouped[level.documentId]) {
          grouped[level.documentId] = [];
        }
        grouped[level.documentId].push(level);
      });

      // Find and delete duplicates
      let deletedCount = 0;
      for (const [documentId, levels] of Object.entries(grouped)) {
        if (levels.length > 1) {
          // Sort by ID, keep the first (lowest ID), delete the rest
          levels.sort((a, b) => a.id - b.id);
          const toKeep = levels[0];
          const toDelete = levels.slice(1);

          console.log(`  Duplicate found: "${toKeep.title}" (${documentId})`);
          console.log(`    Keeping ID: ${toKeep.id}`);
          console.log(
            `    Deleting IDs: ${toDelete.map((l) => l.id).join(", ")}`
          );

          // Delete the duplicates
          for (const level of toDelete) {
            await strapi.db.query("api::kitlevel.kitlevel").delete({
              where: { id: level.id },
            });
            deletedCount++;
          }
        }
      }

      console.log(`✅ Deleted ${deletedCount} duplicate kitlevels`);
      return { deleted: deletedCount };
    } catch (error) {
      console.error("❌ Error cleaning up kitlevels:", error);
      throw error;
    }
  },

  /**
   * Clean up all duplicates
   */
  async cleanupAllDuplicates(strapi) {
    const lessonResult = await this.cleanupDuplicateLessons(strapi);
    const kitlevelResult = await this.cleanupDuplicateKitlevels(strapi);

    return {
      lessons: lessonResult,
      kitlevels: kitlevelResult,
      total: lessonResult.deleted + kitlevelResult.deleted,
    };
  },
};
