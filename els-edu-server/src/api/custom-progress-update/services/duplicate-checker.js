/**
 * Utility script to find and report duplicate lessons
 * Run this from Strapi admin or via custom route
 *
 * Usage: Add a custom admin route or run from Strapi console
 */

module.exports = {
  /**
   * Find duplicate lessons by documentId
   */
  async findDuplicateLessons(strapi) {
    try {
      console.log("🔍 Checking for duplicate lessons...");

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

      // Find duplicates
      const duplicates = Object.entries(grouped).filter(
        ([_, lessons]) => lessons.length > 1
      );

      if (duplicates.length === 0) {
        console.log("✅ No duplicate lessons found!");
        return { duplicates: [], count: 0 };
      }

      console.log(`⚠️ Found ${duplicates.length} duplicate documentIds:`);
      duplicates.forEach(([documentId, lessons]) => {
        console.log(
          `  - ${documentId}: ${lessons.length} copies (${lessons[0].title})`
        );
        console.log(`    IDs: ${lessons.map((l) => l.id).join(", ")}`);
      });

      return {
        duplicates: duplicates.map(([documentId, lessons]) => ({
          documentId,
          title: lessons[0].title,
          count: lessons.length,
          ids: lessons.map((l) => l.id),
        })),
        count: duplicates.length,
      };
    } catch (error) {
      console.error("❌ Error finding duplicates:", error);
      throw error;
    }
  },

  /**
   * Report on all duplicates
   */
  async reportDuplicates(strapi) {
    const lessonDuplicates = await this.findDuplicateLessons(strapi);

    return {
      lessons: lessonDuplicates,
      totalIssues: lessonDuplicates.count,
    };
  },
};
