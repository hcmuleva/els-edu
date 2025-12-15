"use strict";

/**
 * Progress Service - Manages progress updates with Ably real-time notifications
 *
 * Features:
 * - Prevents double creation of progress records
 * - Cascades updates from lesson -> level -> kit
 * - Publishes updates to Ably channels for real-time sync
 * - Proper documentId handling for Strapi v5
 * - Per-user locking to avoid race conditions
 */

const { publishToAbly } = require("../../../../config/ably");

// Simple in-memory per-user lock (single node process assumption). For multi-instance, replace with Redis.
const userLocks = new Map();
const acquireUserLock = async (key, timeoutMs = 3000, pollMs = 50) => {
  const start = Date.now();
  let waited = 0;
  while (userLocks.get(key)) {
    if (Date.now() - start >= timeoutMs) {
      return { acquired: false, waitedMs: Date.now() - start };
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  userLocks.set(key, true);
  waited = Date.now() - start;
  return { acquired: true, waitedMs: waited };
};
const releaseUserLock = (key) => {
  if (userLocks.get(key)) userLocks.delete(key);
};

/**
 * Calculate level progress based on completed lessons
 */
const calculateLevelProgress = (lessons) => {
  if (!lessons || lessons.length === 0) {
    return {
      progress: 0,
      isCompleted: false,
      completedCount: 0,
      totalCount: 0,
    };
  }

  const completedLessons = lessons.filter(
    (l) => l.userLesson?.is_completed
  ).length;
  const totalLessons = lessons.length;
  const progress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isCompleted = progress === 100;

  return {
    progress,
    isCompleted,
    completedCount: completedLessons,
    totalCount: totalLessons,
  };
};

/**
 * Calculate kit progress based on completed levels
 */
const calculateKitProgress = (levels) => {
  if (!levels || levels.length === 0) {
    return {
      progress: 0,
      status: "NOT_STARTED",
      completedCount: 0,
      totalCount: 0,
    };
  }

  const totalLevels = levels.length;
  const totalProgress = levels.reduce(
    (sum, lvl) => sum + (lvl.userLevel?.progress || 0),
    0
  );
  const progress =
    totalLevels > 0 ? Math.round(totalProgress / totalLevels) : 0;

  const completedLevels = levels.filter(
    (lvl) => lvl.userLevel?.is_completed
  ).length;
  const status =
    progress === 100
      ? "COMPLETED"
      : progress > 0
        ? "INPROGRESS"
        : "NOT_STARTED";

  return {
    progress,
    status,
    completedCount: completedLevels,
    totalCount: totalLevels,
  };
};

/**
 * Find or create user lesson progress
 */
const findOrCreateUserLesson = async (
  strapi,
  { lessonDocumentId, userDocumentId, orgDocumentId }
) => {
  try {
    // Find existing user lesson
    const existingUserLessons = await strapi
      .documents("api::user-lesson.user-lesson")
      .findMany({
        filters: {
          lesson: { documentId: lessonDocumentId },
          user: { documentId: userDocumentId },
        },
        populate: ["lesson", "user", "org"],
      });

    if (existingUserLessons && existingUserLessons.length > 0) {
      return existingUserLessons[0];
    }

    // Create new user lesson
    const newUserLesson = await strapi
      .documents("api::user-lesson.user-lesson")
      .create({
        data: {
          lesson: lessonDocumentId,
          user: userDocumentId,
          org: orgDocumentId,
          is_completed: false,
          is_active: true,
          progress: 0,
          is_locked: false,
        },
      });

    return newUserLesson;
  } catch (error) {
    console.error("❌ Error in findOrCreateUserLesson:", error);
    throw error;
  }
};

/**
 * Find or create user level progress
 */
const findOrCreateUserLevel = async (
  strapi,
  { levelDocumentId, userDocumentId, orgDocumentId }
) => {
  try {
    // Find existing user level
    const existingUserLevels = await strapi
      .documents("api::user-level.user-level")
      .findMany({
        filters: {
          kitlevel: { documentId: levelDocumentId },
          user: { documentId: userDocumentId },
        },
        populate: ["kitlevel", "user", "org"],
      });

    if (existingUserLevels && existingUserLevels.length > 0) {
      return existingUserLevels[0];
    }

    // Create new user level
    const newUserLevel = await strapi
      .documents("api::user-level.user-level")
      .create({
        data: {
          kitlevel: levelDocumentId,
          user: userDocumentId,
          org: orgDocumentId,
          progress: 0,
          is_completed: false,
          is_active: true,
          is_locked: false,
        },
      });

    return newUserLevel;
  } catch (error) {
    console.error("❌ Error in findOrCreateUserLevel:", error);
    throw error;
  }
};

/**
 * Find or create kit progress
 */
const findOrCreateKitProgress = async (
  strapi,
  { kitDocumentId, userDocumentId, orgDocumentId, levelDocumentId }
) => {
  try {
    // Find existing kit progress
    const existingKitProgress = await strapi
      .documents("api::kitprogress.kitprogress")
      .findMany({
        filters: {
          kit: { documentId: kitDocumentId },
          users: { documentId: userDocumentId },
        },
        populate: ["kit", "users", "org", "kitlevel"],
      });

    if (existingKitProgress && existingKitProgress.length > 0) {
      return existingKitProgress[0];
    }

    // Create new kit progress
    const today = new Date().toISOString().split("T")[0];
    const newKitProgress = await strapi
      .documents("api::kitprogress.kitprogress")
      .create({
        data: {
          kit: kitDocumentId,
          users: userDocumentId,
          org: orgDocumentId,
          kitlevel: levelDocumentId,
          kit_status: "INPROGRESS",
          progress: 0,
          is_active: true,
          started_at: today,
          last_accessed_at: today,
        },
      });

    return newKitProgress;
  } catch (error) {
    console.error("❌ Error in findOrCreateKitProgress:", error);
    throw error;
  }
};

/**
 * Main function: Mark lesson as complete and cascade updates
 */
const markLessonComplete = async (
  strapi,
  { lessonDocumentId, userDocumentId, orgDocumentId }
) => {
  // Acquire per-user lock to serialize progress updates and avoid race conditions
  const lockKey = `user:${userDocumentId}`;
  const { acquired, waitedMs: lockWaitMs } = await acquireUserLock(lockKey);
  if (!acquired) {
    console.warn(
      `🔒 [LOCK] Timeout acquiring lock for ${userDocumentId} (lesson: ${lessonDocumentId.slice(0, 8)})`
    );
    throw new Error(
      `Concurrency lock timeout for user ${userDocumentId}. Please retry shortly.`
    );
  }
  if (lockWaitMs > 500) {
    console.log(
      `🔒 [LOCK] User ${userDocumentId.slice(0, 8)} waited ${lockWaitMs}ms for lock`
    );
  }

  try {
    // 1. Get lesson with level and kit information
    // Using findMany to detect duplicates
    const lessons = await strapi.documents("api::lesson.lesson").findMany({
      filters: { documentId: lessonDocumentId },
      populate: {
        kitlevel: {
          populate: {
            kit: true,
            lessons: true,
          },
        },
      },
    });

    if (!lessons || lessons.length === 0) {
      throw new Error(`Lesson not found: ${lessonDocumentId}`);
    }

    if (lessons.length > 1) {
      console.warn(
        `⚠️ WARNING: Found ${lessons.length} lessons with documentId ${lessonDocumentId}. Using the first one. This indicates duplicate data that should be cleaned up.`
      );
    }

    const lesson = lessons[0];

    if (!lesson.kitlevel) {
      throw new Error("Lesson or level not found");
    }

    const level = lesson.kitlevel;

    if (!level.kit) {
      throw new Error(
        `Level "${level.title}" (${level.documentId}) is not associated with any kit. Please fix the data in Strapi admin.`
      );
    }

    const kit = level.kit;

    // Lesson/level/kit context available for debugging if needed

    // 2. Find or create and update user lesson to completed
    let userLesson = await findOrCreateUserLesson(strapi, {
      lessonDocumentId,
      userDocumentId,
      orgDocumentId,
    });

    // Only update if not already completed (prevent duplicate updates)
    if (!userLesson.is_completed) {
      userLesson = await strapi
        .documents("api::user-lesson.user-lesson")
        .update({
          documentId: userLesson.documentId,
          data: {
            is_completed: true,
            progress: 100,
            is_active: true,
          },
        });
      // Lesson marked complete

      // Publish to Ably
      await publishToAbly(
        `user:${userDocumentId}:progress`,
        "lesson-completed",
        {
          userId: userDocumentId,
          lessonId: lessonDocumentId,
          userLessonId: userLesson.documentId,
          type: "lesson",
          timestamp: new Date().toISOString(),
        }
      );
    } else {
      // Lesson already completed, skipping update
    }

    // 3. Get all lessons in this level with their user progress
    const allLessonsInLevel = await strapi
      .documents("api::lesson.lesson")
      .findMany({
        filters: {
          kitlevel: { documentId: level.documentId },
        },
        // include publishedAt for filtering
        fields: ["documentId", "title", "publishedAt"],
      });

    // Deduplicate lessons by documentId to avoid inflated total counts caused by import duplicates
    const uniqueLessonMap = {};
    const duplicateLessonIds = [];
    allLessonsInLevel.forEach((l) => {
      if (!l.documentId) return;
      if (uniqueLessonMap[l.documentId]) {
        duplicateLessonIds.push(l.id || l.documentId);
      } else {
        uniqueLessonMap[l.documentId] = l;
      }
    });
    let dedupedLessonsInLevel = Object.values(uniqueLessonMap);

    // Capture raw / unique counts before excluding unpublished
    const rawTotalLessons = allLessonsInLevel.length;
    const uniqueTotalLessons = dedupedLessonsInLevel.length;

    // Filter out unpublished lessons (drafts) – they should not count toward progress totals
    const unpublishedExcluded = [];
    dedupedLessonsInLevel = dedupedLessonsInLevel.filter((l) => {
      const include = !!l.publishedAt; // only count published
      if (!include) unpublishedExcluded.push(l.documentId);
      return include;
    });
    const publishedTotalLessons = dedupedLessonsInLevel.length;
    if (unpublishedExcluded.length > 0) {
      console.warn(
        `⚠️ [PROGRESS-SERVICE] Excluding ${unpublishedExcluded.length} unpublished lessons from level ${level.documentId} progress: ${unpublishedExcluded.join(", ")}`
      );
    }
    if (duplicateLessonIds.length > 0) {
      console.warn(
        `⚠️ [PROGRESS-SERVICE] Detected ${duplicateLessonIds.length} duplicate lesson records in level ${level.documentId}. Progress calculation will ignore duplicates. IDs: ${duplicateLessonIds.join(", ")}`
      );
    }

    // Get user-lesson records for all lessons in this level
    // Use all unique lessons (not just published) to allow fallback calculation
    const uniqueLessonDocIds = Object.keys(uniqueLessonMap);
    const userLessons = await strapi
      .documents("api::user-lesson.user-lesson")
      .findMany({
        filters: {
          lesson: {
            documentId: { $in: uniqueLessonDocIds },
          },
          user: { documentId: userDocumentId },
        },
        populate: ["lesson"],
      });

    // Create a map for quick lookup
    const userLessonMap = {};
    userLessons.forEach((ul) => {
      const lessonDocId = ul.lesson?.documentId || ul.lesson;
      if (lessonDocId) {
        userLessonMap[lessonDocId] = ul;
      }
    });

    // Attach user lesson data for calculation
    const lessonsWithProgress = dedupedLessonsInLevel.map((l) => ({
      ...l,
      userLesson: userLessonMap[l.documentId] || null,
    }));

    // 4. Calculate level progress
    const levelProgressData = calculateLevelProgress(lessonsWithProgress);

    // Enrich with diagnostic counts so caller/front-end can choose published totals
    /** @type {any} */ let enrichedLevelProgress = {
      ...levelProgressData,
      rawTotalCount: rawTotalLessons,
      uniqueTotalCount: uniqueTotalLessons,
      publishedTotalCount: publishedTotalLessons,
      duplicateIds: duplicateLessonIds,
      unpublishedIds: unpublishedExcluded,
    };

    // Fallback: if zero published lessons but drafts exist, compute progress on unique lessons
    if (
      enrichedLevelProgress.publishedTotalCount === 0 &&
      enrichedLevelProgress.uniqueTotalCount > 0
    ) {
      console.warn(
        `⚠️ [PROGRESS-SERVICE] Using fallback progress (draft lessons) for level ${level.documentId}`
      );
      const fallbackLessonsWithProgress = Object.values(uniqueLessonMap).map(
        (l) => ({
          ...l,
          userLesson: userLessonMap[l.documentId] || null,
        })
      );
      const fallbackData = calculateLevelProgress(fallbackLessonsWithProgress);
      // @ts-ignore - adding diagnostic fallback fields dynamically
      enrichedLevelProgress = {
        ...enrichedLevelProgress,
        fallbackUsed: true,
        fallbackProgress: fallbackData.progress,
        fallbackCompletedCount: fallbackData.completedCount,
        fallbackTotalCount: fallbackData.totalCount,
      };
      // Override level progress used for user-level storage so UI reflects meaningful progress
      levelProgressData.progress = fallbackData.progress;
      levelProgressData.isCompleted = fallbackData.isCompleted;
    }

    // 5. Find or create and update user level
    let userLevel = await findOrCreateUserLevel(strapi, {
      levelDocumentId: level.documentId,
      userDocumentId,
      orgDocumentId,
    });

    userLevel = await strapi.documents("api::user-level.user-level").update({
      documentId: userLevel.documentId,
      data: {
        progress: levelProgressData.progress,
        is_completed: levelProgressData.isCompleted,
        is_active: true,
      },
    });
    // User-level updated

    // Publish to Ably
    await publishToAbly(`user:${userDocumentId}:progress`, "level-updated", {
      userId: userDocumentId,
      levelId: level.documentId,
      userLevelId: userLevel.documentId,
      progress: levelProgressData.progress,
      isCompleted: levelProgressData.isCompleted,
      type: "level",
      timestamp: new Date().toISOString(),
    });

    // 6. Get all levels in kit with their user progress
    const allLevelsInKit = await strapi
      .documents("api::kitlevel.kitlevel")
      .findMany({
        filters: {
          kit: { documentId: kit.documentId },
        },
      });

    // Get user-level records for all levels in this kit
    const userLevels = await strapi
      .documents("api::user-level.user-level")
      .findMany({
        filters: {
          kitlevel: {
            documentId: { $in: allLevelsInKit.map((l) => l.documentId) },
          },
          user: { documentId: userDocumentId },
        },
        populate: ["kitlevel"],
      });

    // Create a map for quick lookup
    const userLevelMap = {};
    userLevels.forEach((ul) => {
      const levelDocId = ul.kitlevel?.documentId || ul.kitlevel;
      if (levelDocId) {
        userLevelMap[levelDocId] = ul;
      }
    });

    // Attach user level data for calculation
    const levelsWithProgress = allLevelsInKit.map((lvl) => ({
      ...lvl,
      userLevel: userLevelMap[lvl.documentId] || null,
    }));

    // 7. Calculate kit progress
    const kitProgressData = calculateKitProgress(levelsWithProgress);

    // 8. Find or create and update kit progress
    let kitProgress = await findOrCreateKitProgress(strapi, {
      kitDocumentId: kit.documentId,
      userDocumentId,
      orgDocumentId,
      levelDocumentId: level.documentId,
    });

    const today = new Date().toISOString().split("T")[0];
    kitProgress = await strapi
      .documents("api::kitprogress.kitprogress")
      .update({
        documentId: kitProgress.documentId,
        data: {
          progress: kitProgressData.progress,
          kit_status: kitProgressData.status,
          last_accessed_at: today,
          is_active: true,
          ...(kitProgressData.status === "COMPLETED" && {
            completed_at: today,
          }),
        },
      });
    // Kitprogress updated

    // Publish to Ably
    await publishToAbly(`user:${userDocumentId}:progress`, "kit-updated", {
      userId: userDocumentId,
      kitId: kit.documentId,
      kitProgressId: kitProgress.documentId,
      progress: kitProgressData.progress,
      status: kitProgressData.status,
      type: "kit",
      timestamp: new Date().toISOString(),
    });

    console.log(
      `✅ [PROGRESS] Lesson ${lessonDocumentId.slice(0, 8)} complete: level ${levelProgressData.progress}%, kit ${kitProgressData.progress}% (lock:${lockWaitMs}ms)`
    );
    if (enrichedLevelProgress.fallbackUsed) {
      console.warn(`⚠️ [PROGRESS] Fallback used for level (publishedCount=0)`);
    }

    // Release lock before returning success
    releaseUserLock(lockKey);
    return {
      success: true,
      userLesson,
      userLevel,
      kitProgress,
      levelProgress: enrichedLevelProgress,
      kitProgressCalc: kitProgressData,
      lockWaitMs,
    };
  } catch (error) {
    console.error("❌ Error in markLessonComplete:", error);
    // Ensure lock released on error
    releaseUserLock(lockKey);
    throw error;
  }
};

/**
 * Start a kit - initialize kit progress
 */
const startKit = async (
  strapi,
  { kitDocumentId, userDocumentId, orgDocumentId }
) => {
  // Starting kit for user

  try {
    // Get kit with levels
    const kit = await strapi.documents("api::kit.kit").findOne({
      documentId: kitDocumentId,
      populate: {
        kitlevels: {
          populate: ["lessons"],
        },
      },
    });

    if (!kit || !kit.kitlevels || kit.kitlevels.length === 0) {
      throw new Error("Kit not found or has no levels");
    }

    // Get first level
    const firstLevel = kit.kitlevels.sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    )[0];

    // Find or create kit progress
    const kitProgress = await findOrCreateKitProgress(strapi, {
      kitDocumentId,
      userDocumentId,
      orgDocumentId,
      levelDocumentId: firstLevel.documentId,
    });

    // Publish to Ably
    await publishToAbly(`user:${userDocumentId}:progress`, "kit-started", {
      userId: userDocumentId,
      kitId: kitDocumentId,
      kitProgressId: kitProgress.documentId,
      type: "kit-start",
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ [PROGRESS] Kit started: ${kitDocumentId.slice(0, 8)}`);

    return {
      success: true,
      kitProgress,
    };
  } catch (error) {
    console.error("❌ Error in startKit:", error);
    throw error;
  }
};

/**
 * Start a lesson - initialize user lesson progress
 */
const startLesson = async (
  strapi,
  { lessonDocumentId, userDocumentId, orgDocumentId }
) => {
  // Starting lesson for user

  try {
    // Find or create user lesson
    const userLesson = await findOrCreateUserLesson(strapi, {
      lessonDocumentId,
      userDocumentId,
      orgDocumentId,
    });

    // Publish to Ably
    await publishToAbly(`user:${userDocumentId}:progress`, "lesson-started", {
      userId: userDocumentId,
      lessonId: lessonDocumentId,
      userLessonId: userLesson.documentId,
      type: "lesson-start",
      timestamp: new Date().toISOString(),
    });

    // Lesson started

    return {
      success: true,
      userLesson,
    };
  } catch (error) {
    console.error("❌ Error in startLesson:", error);
    throw error;
  }
};

module.exports = {
  markLessonComplete,
  startKit,
  startLesson,
  calculateLevelProgress,
  calculateKitProgress,
};
