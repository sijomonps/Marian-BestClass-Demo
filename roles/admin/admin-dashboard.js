window.applyPageConfig({
  autoRole: "admin",
  autoPage: "dashboard"
});

(function initAdminDashboardModule() {
  let pendingChartPayload = null;
  const chartInstances = {
    submission: null,
    category: null,
    classPerformance: null
  };

  function renderDashboard(ctx) {
    const selectedYear = String(ctx.state.selectedAcademicYear || "");
    const yearSubmissions = typeof ctx.getSubmissionsForYear === "function"
      ? ctx.getSubmissionsForYear(selectedYear)
      : (ctx.submissions || []);

    const totalStudents = (ctx.students || []).length;
    const totalSubmissions = yearSubmissions.length;
    const pendingVerifications = yearSubmissions.filter((item) => isPendingStatus(item.status)).length;
    const submissionStatusClass = ctx.state.submissionOpen ? "status-approved" : "status-rejected";
    const submissionStatusLabel = ctx.state.submissionOpen ? "ON" : "OFF";
    const activeYear = typeof ctx.getActiveAcademicYear === "function"
      ? ctx.getActiveAcademicYear()
      : selectedYear;

    const statusMetrics = buildSubmissionStatusMetrics(yearSubmissions);
    const categoryMetrics = buildCategoryContributionMetrics(yearSubmissions, ctx.criteriaCatalog);
    const classMetrics = buildClassPerformanceMetrics(yearSubmissions, ctx.students);

    pendingChartPayload = {
      status: statusMetrics,
      category: categoryMetrics,
      classPerformance: classMetrics
    };

    return (
      "<section class=\"section-header\"><div><h1>Admin Dashboard</h1><p class=\"muted\">Simple cards with class-level dashboard graphs.</p></div></section>" +
      "<section class=\"cards-grid stats-grid\">" +
      "<article class=\"stat-card\"><div class=\"stat-head\"><p>Total Students</p></div><h3>" + totalStudents + "</h3></article>" +
      "<article class=\"stat-card\"><div class=\"stat-head\"><p>Total Submissions</p></div><h3>" + totalSubmissions + "</h3><p class=\"muted\">Academic Year " + escapeUnsafe(selectedYear) + "</p></article>" +
      "<article class=\"stat-card\"><div class=\"stat-head\"><p>Pending Verifications</p></div><h3>" + pendingVerifications + "</h3></article>" +
      "<article class=\"stat-card\"><div class=\"stat-head\"><p>Submission Status</p></div><h3><span class=\"status-pill " + submissionStatusClass + "\">" + submissionStatusLabel + "</span></h3></article>" +
      "</section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Quick Actions</h3><div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-page-jump=\"criteria\">Criteria Management</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"manage-users\">User Management</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"manage-departments\">Department Management</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"open-settings\">Settings</button></div></article>" +
      "<article class=\"panel\"><h3>System Status</h3><div class=\"meta-list\"><p><strong>Active Academic Year:</strong> " + escapeUnsafe(activeYear || "Not set") + "</p><p><strong>Viewing Year:</strong> " + escapeUnsafe(selectedYear || "-") + "</p><p><strong>Submission:</strong> <span class=\"status-pill " + submissionStatusClass + "\">" + submissionStatusLabel + "</span></p></div></article>" +
      "</section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel chart-panel\"><div class=\"panel-head\"><h3>Submission Status</h3></div><p class=\"muted\">Approved, Pending, Rejected</p><div class=\"chart-canvas-wrap\"><canvas id=\"admin-chart-submission-status\" aria-label=\"Submission Status Chart\"></canvas></div></article>" +
      "<article class=\"panel chart-panel\"><div class=\"panel-head\"><h3>Category Contribution</h3></div><p class=\"muted\">Academics, Courses, Internship, Others</p><div class=\"chart-canvas-wrap\"><canvas id=\"admin-chart-category-contribution\" aria-label=\"Category Contribution Chart\"></canvas></div></article>" +
      "</section>" +
      "<section class=\"panel chart-panel\"><div class=\"panel-head\"><h3>Class Performance</h3></div><p class=\"muted\">Class name vs score</p><div class=\"chart-canvas-wrap\"><canvas id=\"admin-chart-class-performance\" aria-label=\"Class Performance Chart\"></canvas></div></section>"
    );
  }

  function afterRender() {
    renderCharts();
  }

  function renderCharts() {
    if (!window.Chart || !pendingChartPayload) {
      return;
    }

    destroyExistingCharts();

    const statusCanvas = document.getElementById("admin-chart-submission-status");
    const categoryCanvas = document.getElementById("admin-chart-category-contribution");
    const classCanvas = document.getElementById("admin-chart-class-performance");

    if (!statusCanvas || !categoryCanvas || !classCanvas) {
      return;
    }

    chartInstances.submission = new Chart(statusCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Approved", "Pending", "Rejected"],
        datasets: [
          {
            label: "Submissions",
            data: [
              pendingChartPayload.status.approved,
              pendingChartPayload.status.pending,
              pendingChartPayload.status.rejected
            ],
            backgroundColor: ["#16a34a", "#f59e0b", "#dc2626"],
            borderRadius: 8
          }
        ]
      },
      options: createChartOptions("Count")
    });

    chartInstances.category = new Chart(categoryCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Academics", "Courses", "Internship", "Others"],
        datasets: [
          {
            label: "Marks",
            data: [
              pendingChartPayload.category.academics,
              pendingChartPayload.category.courses,
              pendingChartPayload.category.internship,
              pendingChartPayload.category.others
            ],
            backgroundColor: ["#2563eb", "#0ea5e9", "#14b8a6", "#64748b"],
            borderRadius: 8
          }
        ]
      },
      options: createChartOptions("Marks", true)
    });

    chartInstances.classPerformance = new Chart(classCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: pendingChartPayload.classPerformance.labels,
        datasets: [
          {
            label: "Score",
            data: pendingChartPayload.classPerformance.values,
            backgroundColor: "#2563eb",
            borderRadius: 8
          }
        ]
      },
      options: createChartOptions("Score")
    });
  }

  function destroyExistingCharts() {
    Object.keys(chartInstances).forEach((key) => {
      if (chartInstances[key] && typeof chartInstances[key].destroy === "function") {
        chartInstances[key].destroy();
      }
      chartInstances[key] = null;
    });
  }

  function createChartOptions(yAxisTitle, horizontal) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? "y" : "x",
      plugins: {
        legend: {
          display: false
        }
      },
      scales: horizontal
        ? {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: yAxisTitle
              }
            }
          }
        : {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: yAxisTitle
              }
            }
          }
    };
  }

  function buildSubmissionStatusMetrics(submissions) {
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    (submissions || []).forEach((item) => {
      if (isApprovedStatus(item.status)) {
        approved += 1;
        return;
      }

      if (isRejectedStatus(item.status)) {
        rejected += 1;
        return;
      }

      pending += 1;
    });

    return {
      approved: approved,
      pending: pending,
      rejected: rejected
    };
  }

  function buildCategoryContributionMetrics(submissions, criteriaCatalog) {
    const contribution = {
      academics: 0,
      courses: 0,
      internship: 0,
      others: 0
    };

    const categoryByItemId = new Map();
    (criteriaCatalog || []).forEach((category) => {
      (category.items || []).forEach((item) => {
        categoryByItemId.set(Number(item.id), String(category.category || ""));
      });
    });

    (submissions || []).forEach((submission) => {
      if (!isApprovedStatus(submission.status)) {
        return;
      }

      const marks = getSafeMarks(submission);
      const categoryName = String(categoryByItemId.get(Number(submission.criteriaId)) || "").toLowerCase();

      if (categoryName.indexOf("academic") > -1) {
        contribution.academics += marks;
      } else if (categoryName.indexOf("course") > -1) {
        contribution.courses += marks;
      } else if (categoryName.indexOf("internship") > -1) {
        contribution.internship += marks;
      } else {
        contribution.others += marks;
      }
    });

    contribution.academics = roundValue(contribution.academics);
    contribution.courses = roundValue(contribution.courses);
    contribution.internship = roundValue(contribution.internship);
    contribution.others = roundValue(contribution.others);

    return contribution;
  }

  function buildClassPerformanceMetrics(submissions, students) {
    const studentById = new Map((students || []).map((student) => [Number(student.id), student]));
    const classScores = new Map();

    (submissions || []).forEach((submission) => {
      if (!isApprovedStatus(submission.status)) {
        return;
      }

      const student = studentById.get(Number(submission.studentId));
      if (!student) {
        return;
      }

      const className = String(student.className || "General");
      const current = classScores.get(className) || 0;
      classScores.set(className, current + getSafeMarks(submission));
    });

    const sorted = Array.from(classScores.entries())
      .map((entry) => ({
        label: entry[0],
        value: roundValue(entry[1])
      }))
      .sort((a, b) => b.value - a.value);

    return {
      labels: sorted.map((item) => item.label),
      values: sorted.map((item) => item.value)
    };
  }

  function isPendingStatus(status) {
    return !isApprovedStatus(status) && !isRejectedStatus(status);
  }

  function isApprovedStatus(status) {
    const normalized = String(status || "").trim().toLowerCase();
    return normalized === "approved" || normalized === "locked" || normalized === "evaluated";
  }

  function isRejectedStatus(status) {
    const normalized = String(status || "").trim().toLowerCase();
    return normalized === "rejected";
  }

  function getSafeMarks(submission) {
    if (submission && Number.isFinite(submission.marks)) {
      return Number(submission.marks);
    }
    if (submission && Number.isFinite(submission.suggestedMarks)) {
      return Number(submission.suggestedMarks);
    }
    return 0;
  }

  function roundValue(value) {
    return Math.round((Number(value) || 0) * 10) / 10;
  }

  function escapeUnsafe(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function handleAction(action, ctx) {
    if (action === "manage-users") {
      ctx.navigateToPage("users");
      return true;
    }

    if (action === "manage-departments") {
      ctx.navigateToPage("departments");
      return true;
    }

    if (action === "open-settings") {
      ctx.navigateToPage("settings");
      return true;
    }

    return false;
  }

  function handleChange() {
    return false;
  }

  window.adminDashboardModule = {
    renderDashboard: renderDashboard,
    handleAction: handleAction,
    handleChange: handleChange,
    afterRender: afterRender
  };
})();
