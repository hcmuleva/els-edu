"use strict";

// Diagnostic service to inspect level and lesson integrity
// Reports: raw lesson count, unique count, published unique count, completed lessons, duplicates, unpublished ids

module.exports = ({ strapi }) => ({
  async getLevelDiagnostics(userDocumentId) {
    try {
      // Fetch all kits (limits scope; could filter later)
      const kits = await strapi.documents("api::kit.kit").findMany({
        fields: ["documentId", "name"],
      });

      const levels = await strapi.documents("api::kitlevel.kitlevel").findMany({
        filters: {
          kit: { documentId: { $in: kits.map((k) => k.documentId) } },
        },
        fields: ["documentId", "title"],
        populate: { kit: { fields: ["documentId", "name"] } },
      });

      const levelDiagnostics = [];

      for (const level of levels) {
        // Fetch lessons for level
        const lessons = await strapi.documents("api::lesson.lesson").findMany({
          filters: { kitlevel: { documentId: level.documentId } },
          fields: ["documentId", "title", "publishedAt"],
        });

        const rawCount = lessons.length;
        const seen = new Set();
        const duplicates = [];
        const unpublished = [];
        lessons.forEach((l) => {
          if (seen.has(l.documentId)) duplicates.push(l.documentId);
          else seen.add(l.documentId);
          if (!l.publishedAt) unpublished.push(l.documentId);
        });
        const uniqueLessons = Array.from(seen);
        const publishedUnique = uniqueLessons.filter((id) =>
          lessons.find((l) => l.documentId === id && l.publishedAt)
        );

        // User lesson completions
        const userLessons = await strapi
          .documents("api::user-lesson.user-lesson")
          .findMany({
            filters: {
              lesson: { documentId: { $in: uniqueLessons } },
              user: { documentId: userDocumentId },
            },
            fields: ["documentId", "is_completed"],
            populate: { lesson: { fields: ["documentId"] } },
          });

        const completedSet = new Set(
          userLessons
            .filter((ul) => ul.is_completed)
            .map((ul) => ul.lesson?.documentId)
        );

        levelDiagnostics.push({
          levelId: level.documentId,
          levelTitle: level.title,
          kitId: level.kit?.documentId,
          kitName: level.kit?.name,
          rawLessonCount: rawCount,
          uniqueLessonCount: uniqueLessons.length,
          publishedUniqueCount: publishedUnique.length,
          completedPublishedCount: publishedUnique.filter((id) =>
            completedSet.has(id)
          ).length,
          duplicateIds: duplicates,
          unpublishedIds: unpublished,
          progressRawPercent:
            rawCount > 0 ? Math.round((completedSet.size / rawCount) * 100) : 0,
          progressPublishedPercent:
            publishedUnique.length > 0
              ? Math.round(
                  (publishedUnique.filter((id) => completedSet.has(id)).length /
                    publishedUnique.length) *
                    100
                )
              : 0,
        });
      }

      return { userDocumentId, levels: levelDiagnostics };
    } catch (err) {
      console.error("❌ [DIAGNOSTIC] Error generating level diagnostics", err);
      throw err;
    }
  },
});
