window.applyPageConfig({
  autoRole: "admin",
  autoPage: "dashboard"
});

(function initAdminDashboardModule() {
  function renderDashboard(ctx) {
    const yearSubmissions = typeof ctx.getSubmissionsForYear === "function"
      ? ctx.getSubmissionsForYear(ctx.state.selectedAcademicYear)
      : ctx.submissions;

    const totalStudents = (ctx.students || []).length;
    const totalSubmissions = yearSubmissions.length;
    const pendingVerifications = yearSubmissions.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      return status === "pending" || status.indexOf("correction") > -1;
    }).length;
    const submissionStatusClass = ctx.state.submissionOpen ? "status-approved" : "status-rejected";
    const evaluationStatusClass = ctx.state.evaluationOpen ? "status-approved" : "status-rejected";
    const submissionStatusLabel = ctx.state.submissionOpen ? "ON" : "OFF";
    const evaluationStatusLabel = ctx.state.evaluationOpen ? "ON" : "OFF";
    const activeYear = ctx.getActiveAcademicYear();

    const quickTips = [
      "Use Criteria Management to add category, item, marks, and type.",
      "Use User Management to add Student, Teacher, and Evaluator accounts.",
      "Use Department Management to keep the department list updated.",
      "Use Settings to toggle submission/evaluation and choose academic year."
    ];

    const tipRows = quickTips.map((tip) => "<li>" + ctx.escapeHtml(tip) + "</li>").join("");

    return (
      "<section class=\"section-header\"><div><h1>Admin Dashboard</h1><p class=\"muted\">Simple overview for daily admin work.</p></div></section>" +
      "<section class=\"cards-grid stats-grid\">" +
      "<article class=\"stat-card\"><div class=\"stat-head\"><p>Total Students</p></div><h3>" + totalStudents + "</h3></article>" +
      "<article class=\"stat-card\"><div class=\"stat-head\"><p>Total Submissions</p></div><h3>" + totalSubmissions + "</h3><p class=\"muted\">Academic Year " + ctx.escapeHtml(ctx.state.selectedAcademicYear) + "</p></article>" +
      "<article class=\"stat-card\"><div class=\"stat-head\"><p>Pending Verifications</p></div><h3>" + pendingVerifications + "</h3></article>" +
      "<article class=\"stat-card\"><div class=\"stat-head\"><p>Submission Status</p></div><h3><span class=\"status-pill " + submissionStatusClass + "\">" + submissionStatusLabel + "</span></h3></article>" +
      "</section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Quick Actions</h3><div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-page-jump=\"criteria\">Criteria Management</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"manage-users\">User Management</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"manage-departments\">Department Management</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"open-settings\">Settings</button></div></article>" +
      "<article class=\"panel\"><h3>System Status</h3><div class=\"meta-list\"><p><strong>Active Academic Year:</strong> " + ctx.escapeHtml(activeYear || "Not set") + "</p><p><strong>Submission:</strong> <span class=\"status-pill " + submissionStatusClass + "\">" + submissionStatusLabel + "</span></p><p><strong>Evaluation:</strong> <span class=\"status-pill " + evaluationStatusClass + "\">" + evaluationStatusLabel + "</span></p></div></article>" +
      "</section>" +
      "<section class=\"panel\"><h3>Beginner Notes</h3><ul class=\"simple-list\">" + tipRows + "</ul></section>"
    );
  }

  function buildSystemOverviewMetrics(items) {
    const submissions = Array.isArray(items) ? items : [];
    const total = submissions.length;
    const completed = submissions.filter((item) => item.status !== "Pending").length;
    const verified = submissions.filter((item) => item.status === "Approved").length;
    const evaluated = submissions.filter((item) => item.status === "Approved" && item.evaluatorVerified).length;

    const pendingSubmissions = Math.max(0, total - completed);
    const pendingVerification = Math.max(0, completed - verified);
    const pendingEvaluation = Math.max(0, verified - evaluated);

    return {
      total: total,
      completed: completed,
      verified: verified,
      evaluated: evaluated,
      completionPercent: toPercent(completed, total),
      verifiedPercent: toPercent(verified, completed),
      evaluatedPercent: toPercent(evaluated, verified),
      pendingSubmissions: pendingSubmissions,
      pendingVerification: pendingVerification,
      pendingEvaluation: pendingEvaluation
    };
  }

  function renderSystemOverviewSection(metrics, classCount, selectedYear, ctx) {
    const progressRows = [
      {
        label: "% Submissions Completed",
        percent: metrics.completionPercent,
        numerator: metrics.completed,
        denominator: metrics.total,
        className: "progress-pending"
      },
      {
        label: "% Submissions Verified",
        percent: metrics.verifiedPercent,
        numerator: metrics.verified,
        denominator: metrics.completed,
        className: "progress-approved"
      },
      {
        label: "% Submissions Evaluated",
        percent: metrics.evaluatedPercent,
        numerator: metrics.evaluated,
        denominator: metrics.verified,
        className: "progress-score"
      }
    ];

    const progressHtml = progressRows
      .map((row) => {
        return (
          "<div class=\"progress-row\">" +
          "<div class=\"progress-meta\"><span>" + ctx.escapeHtml(row.label) + "</span><span>" + row.percent.toFixed(1) + "% (" + row.numerator + " / " + row.denominator + ")</span></div>" +
          "<div class=\"progress-track\"><div class=\"progress-fill " + row.className + "\" style=\"width:" + row.percent.toFixed(1) + "%\"></div></div>" +
          "</div>"
        );
      })
      .join("");

    return (
      "<article class=\"panel\"><h3>System Progress Overview</h3><p class=\"muted\">Academic Year " + ctx.escapeHtml(selectedYear) + " with stage-specific denominators.</p>" +
      "<div class=\"meta-list\"><p><strong>Total Classes:</strong> " + classCount + "</p><p><strong>Total Submissions:</strong> " + metrics.total + "</p><p><strong>Pending Submissions:</strong> " + metrics.pendingSubmissions + "</p><p><strong>Pending Verification:</strong> " + metrics.pendingVerification + "</p><p><strong>Pending Evaluation:</strong> " + metrics.pendingEvaluation + "</p></div>" +
      "<div class=\"progress-list\">" + progressHtml + "</div>" +
      "</article>"
    );
  }

  function getClassCountForSubmissions(submissions, students) {
    const classSet = new Set();
    const studentById = new Map((students || []).map((item) => [Number(item.id), item]));

    (submissions || []).forEach((submission) => {
      const student = studentById.get(Number(submission.studentId));
      if (student && student.className) {
        classSet.add(String(student.className));
      }
    });

    return classSet.size;
  }

  function toPercent(value, base) {
    if (!Number.isFinite(base) || base <= 0) {
      return 0;
    }
    return (value / base) * 100;
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

    if (action === "toggle-submission") {
      ctx.state.submissionOpen = !ctx.state.submissionOpen;
      ctx.addRecentActivity("Submission status set to " + (ctx.state.submissionOpen ? "ON" : "OFF"));
      ctx.showToast("Submission is now " + (ctx.state.submissionOpen ? "ON" : "OFF") + ".", "info");
      ctx.renderPage();
      return true;
    }

    if (action === "toggle-evaluation") {
      ctx.state.evaluationOpen = !ctx.state.evaluationOpen;
      ctx.addRecentActivity("Evaluation status set to " + (ctx.state.evaluationOpen ? "ON" : "OFF"));
      ctx.showToast("Evaluation is now " + (ctx.state.evaluationOpen ? "ON" : "OFF") + ".", "info");
      ctx.renderPage();
      return true;
    }

    return false;
  }

  function handleChange(event, ctx) {
    return false;
  }

  function getSuggestedAcademicYears(existingYears, count) {
    const safeCount = Number.isFinite(count) && count > 0 ? count : 2;
    const yearNumbers = existingYears
      .map((value) => {
        const parts = String(value || "").split("-");
        const endYear = Number(parts[1]);
        return Number.isFinite(endYear) ? endYear : null;
      })
      .filter((value) => Number.isFinite(value));

    const latestEndYear = yearNumbers.length ? Math.max.apply(null, yearNumbers) : new Date().getFullYear();
    const suggestions = [];

    for (let i = 0; i < safeCount; i += 1) {
      const start = latestEndYear + i;
      const end = start + 1;
      const label = String(start) + "-" + String(end);
      if (existingYears.indexOf(label) === -1) {
        suggestions.push(label);
      }
    }

    return suggestions;
  }

  function getAvailableAcademicYears(ctx, activeYear) {
    const yearsFromState = (ctx.state.academicYearState || []).map((item) => item.year);
    const years = (ctx.academicYears || [])
      .concat(yearsFromState)
      .concat([ctx.state.selectedAcademicYear, activeYear])
      .map((item) => String(item || "").trim())
      .filter((item) => item.length > 0);

    const uniqueYears = [];
    years.forEach((item) => {
      if (uniqueYears.indexOf(item) === -1) {
        uniqueYears.push(item);
      }
    });

    return uniqueYears;
  }

  function initializeCreateYearUiState(state) {
    if (typeof state.showCreateYearField !== "boolean") {
      state.showCreateYearField = false;
    }

    if (typeof state.pendingAcademicYear !== "string") {
      state.pendingAcademicYear = "";
    }
  }

  window.adminDashboardModule = {
    renderDashboard: renderDashboard,
    handleAction: handleAction,
    handleChange: handleChange
  };
})();
