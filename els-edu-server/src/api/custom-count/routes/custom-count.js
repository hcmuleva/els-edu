module.exports = {
  routes: [
    {
      method: "GET",
      path: "/custom-counts/subscription-counts/:userDocumentId",
      handler: "custom-count.getSubscriptionCounts",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/custom-counts/course-counts/:courseDocumentId",
      handler: "custom-count.getCourseCounts",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/custom-counts/subject-counts/:subjectDocumentId",
      handler: "custom-count.getSubjectCounts",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
