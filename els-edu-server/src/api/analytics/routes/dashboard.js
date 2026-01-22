module.exports = {
  routes: [
    {
      method: "GET",
      path: "/analytics/dashboard/student",
      handler: "dashboard.getStudentDashboard",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/analytics/dashboard/teacher",
      handler: "dashboard.getTeacherDashboard",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/analytics/dashboard/parent/link-child",
      handler: "dashboard.linkChild",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/analytics/force-link",
      handler: "dashboard.forceLink",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/analytics/dashboard/parent",
      handler: "dashboard.getParentDashboard",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
