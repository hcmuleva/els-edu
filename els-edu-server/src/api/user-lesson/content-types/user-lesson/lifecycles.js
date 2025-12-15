const { publishToAbly } = require("../../../../../config/ably");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Get user ID from the relation
    const userId = result.user?.documentId || result.user;
    const lessonId = result.lesson?.documentId || result.lesson;

    if (!userId) {
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "lesson:created", {
      type: "lesson:created",
      userId: userId,
      lessonId: lessonId,
      userLessonDocumentId: result.documentId,
      is_completed: result.is_completed,
      progress: result.progress,
      timestamp: new Date().toISOString(),
    });
  },

  async afterUpdate(event) {
    const { result } = event;

    const userId = result.user?.documentId || result.user;
    const lessonId = result.lesson?.documentId || result.lesson;

    if (!userId) {
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "lesson:updated", {
      type: "lesson:updated",
      userId: userId,
      lessonId: lessonId,
      userLessonDocumentId: result.documentId,
      is_completed: result.is_completed,    
      progress: result.progress,
      timestamp: new Date().toISOString(),
    });
  },
};
