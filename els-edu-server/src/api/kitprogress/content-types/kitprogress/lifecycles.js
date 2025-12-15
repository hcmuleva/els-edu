const { publishToAbly } = require("../../../../../config/ably");

module.exports = {
  async afterUpdate(event) {
    const { result } = event;

    const userId = result.user?.documentId || result.user;
    const kitId = result.kit?.documentId || result.kit;

    if (!userId) {
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "kit:updated", {
      type: "kit:updated",
      userId: userId,
      kitId: kitId,
      kitProgressDocumentId: result.documentId,
      progress: result.progress,
      kit_status: result.kit_status,
      timestamp: new Date().toISOString(),
    });
  },
};
