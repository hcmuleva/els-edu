module.exports = {
  routes: [
    {
      method: "POST",
      path: "/custom-progress-update/complete-lesson",
      handler: "custom-progress-update.completeLesson",
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/custom-progress-update/start-kit",
      handler: "custom-progress-update.startKit",
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/custom-progress-update/start-lesson",
      handler: "custom-progress-update.startLesson",
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/custom-progress-update/check-duplicates",
      handler: "custom-progress-update.checkDuplicates",
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/custom-progress-update/cleanup-duplicates",
      handler: "custom-progress-update.cleanupDuplicates",
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/custom-progress-update/diagnostics/levels",
      handler: "custom-progress-update.diagnosticsLevels",
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
