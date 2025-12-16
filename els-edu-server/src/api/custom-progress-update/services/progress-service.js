"use strict";

/**
 * Progress Service - Manages lesson progress updates with Ably real-time notifications
 *
 * Features:
 * - Prevents double creation of lesson progress records
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
 * Mark lesson as complete and update progress
 */
const markLessonComplete = async (
  strapi,
  { lessonDocumentId, userDocumentId, orgDocumentId, progress = 100 }
) => {
  const lockKey = `lesson:${userDocumentId}:${lessonDocumentId}`;
  const lockResult = await acquireUserLock(lockKey);

  if (!lockResult.acquired) {
    throw new Error(
      `Failed to acquire lock for user ${userDocumentId.slice(0, 8)} lesson ${lessonDocumentId.slice(0, 8)} after timeout`
    );
  }

  try {
    // Find or create user lesson
    const userLesson = await findOrCreateUserLesson(strapi, {
      lessonDocumentId,
      userDocumentId,
      orgDocumentId,
    });

    // Update lesson progress
    const updatedUserLesson = await strapi
      .documents("api::user-lesson.user-lesson")
      .update({
        documentId: userLesson.documentId,
        data: {
          is_completed: progress >= 100,
          progress,
          is_active: true,
        },
      });

    // Publish to Ably
    await publishToAbly(`user:${userDocumentId}:progress`, "lesson-complete", {
      userId: userDocumentId,
      lessonId: lessonDocumentId,
      userLessonId: updatedUserLesson.documentId,
      progress,
      type: "lesson-complete",
      timestamp: new Date().toISOString(),
    });

    console.log(
      `✅ [PROGRESS] Lesson completed: ${lessonDocumentId.slice(0, 8)} (${progress}%)`
    );

    return {
      success: true,
      userLesson: updatedUserLesson,
    };
  } catch (error) {
    console.error("❌ Error in markLessonComplete:", error);
    throw error;
  } finally {
    releaseUserLock(lockKey);
  }
};

/**
 * Start a lesson - initialize lesson progress
 */
const startLesson = async (
  strapi,
  { lessonDocumentId, userDocumentId, orgDocumentId }
) => {
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

    console.log(`✅ [PROGRESS] Lesson started: ${lessonDocumentId.slice(0, 8)}`);

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
  startLesson,
};
