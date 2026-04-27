(function initPageBootstrap() {
  const bootstrapScript = document.currentScript;
  const bootstrapBaseUrl = new URL(
    bootstrapScript && bootstrapScript.src ? bootstrapScript.src : window.location.href,
    window.location.href
  );
  const appBaseUrl = new URL("./", bootstrapBaseUrl);

  function getAppRoute(path) {
    return new URL(path, appBaseUrl).toString();
  }

  window.rolePageRoutes = {
    student: {
      dashboard: getAppRoute("roles/student/student-dashboard.html"),
      submit: getAppRoute("roles/student/student-submission.html"),
      submissions: getAppRoute("roles/student/student-dashboard.html")
    },
    teacher: {
      dashboard: getAppRoute("roles/teacher/teacher-dashboard.html"),
      verification: getAppRoute("roles/teacher/teacher-verification.html")
    },
    evaluator: {
      dashboard: getAppRoute("roles/evaluator/evaluation-dashboard.html"),
      evaluation: getAppRoute("roles/evaluator/evaluation.html")
    },
    admin: {
      dashboard: getAppRoute("roles/admin/admin-dashboard.html"),
      criteria: getAppRoute("roles/admin/criteria-management.html"),
      users: getAppRoute("roles/admin/user-management.html"),
      departments: getAppRoute("roles/admin/department-management.html"),
      settings: getAppRoute("roles/admin/settings.html")
    },
    hod: {
      dashboard: getAppRoute("roles/hod/hod-dashboard.html"),
      reports: getAppRoute("roles/hod/reports.html")
    }
  };

  window.applyPageConfig = function applyPageConfig(config) {
    const safeConfig = config && typeof config === "object" ? config : {};

    window.appPageConfig = {
      rolePageRoutes: window.rolePageRoutes,
      logoutRedirect: getAppRoute("index.html"),
      ...safeConfig
    };
  };
})();
