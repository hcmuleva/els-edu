const { publishToAbly } = require("../../../../../config/ably");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    const userId = result.user?.documentId || result.user;
    const levelId = result.Kitlevel?.documentId || result.kitlevel;

    if (!userId) {
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "level:created", {
      type: "level:created",
      userId: userId,
      levelId: levelId,
      userLevelDocumentId: result.documentId,
      progress: result.progress,
      is_completed: result.is_completed,
      timestamp: new Date().toISOString(),
    });
  },

  async afterUpdate(event) {
    const { result } = event;

    const userId = result.user?.documentId || result.user;
    const levelId = result.kitlevel?.documentId || result.kitlevel;

    if (!userId) {
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "level:updated", {
      type: "level:updated",
      userId: userId,
      levelId: levelId,
      userLevelDocumentId: result.documentId,
      progress: result.progress,
      is_completed: result.is_completed,
      timestamp: new Date().toISOString(),
    });
  },
};
