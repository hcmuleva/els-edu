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
   * Clean up all duplicates
   */
  async cleanupAllDuplicates(strapi) {
    const lessonResult = await this.cleanupDuplicateLessons(strapi);

    return {
      lessons: lessonResult,
      total: lessonResult.deleted,
    };
  },
};
