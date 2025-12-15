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
   * Find duplicate kitlevels by documentId
   */
  async findDuplicateKitlevels(strapi) {
    try {
      console.log("🔍 Checking for duplicate kitlevels...");

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

      // Find duplicates
      const duplicates = Object.entries(grouped).filter(
        ([_, levels]) => levels.length > 1
      );

      if (duplicates.length === 0) {
        console.log("✅ No duplicate kitlevels found!");
        return { duplicates: [], count: 0 };
      }

      console.log(`⚠️ Found ${duplicates.length} duplicate documentIds:`);
      duplicates.forEach(([documentId, levels]) => {
        console.log(
          `  - ${documentId}: ${levels.length} copies (${levels[0].title})`
        );
        console.log(`    IDs: ${levels.map((l) => l.id).join(", ")}`);
      });

      return {
        duplicates: duplicates.map(([documentId, levels]) => ({
          documentId,
          title: levels[0].title,
          count: levels.length,
          ids: levels.map((l) => l.id),
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
    const kitlevelDuplicates = await this.findDuplicateKitlevels(strapi);

    return {
      lessons: lessonDuplicates,
      kitlevels: kitlevelDuplicates,
      totalIssues: lessonDuplicates.count + kitlevelDuplicates.count,
    };
  },
};
