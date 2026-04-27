window.applyPageConfig({
  autoRole: "admin",
  autoPage: "dashboard"
});

(function initAdminDashboardModule() {
  function renderDashboard(ctx) {
    initializeCreateYearUiState(ctx.state);

    const yearSubmissions = typeof ctx.getSubmissionsForYear === "function"
      ? ctx.getSubmissionsForYear(ctx.state.selectedAcademicYear)
      : ctx.submissions;
    const metrics = ctx.buildSummaryMetrics(yearSubmissions);
    const activeYear = ctx.getActiveAcademicYear();
    const criteriaItems = ctx.getAllCriteriaItems();
    const selectedYearClassCount = getClassCountForSubmissions(yearSubmissions, ctx.students);
    const totalUsers = ctx.students.length;
    const usersByRole = ["Student", "Class Teacher", "Evaluator", "Admin", "HOD / IQAC"];

    const roleSummary = usersByRole
      .map((role) => "<p><strong>" + role + ":</strong> " + (role === "Student" ? totalUsers : 1) + "</p>")
      .join("");

    const missingMarksConfigs = criteriaItems.filter((item) => {
      if (item.type === "range") {
        return !(item.rules || []).length;
      }
      return !Number.isFinite(item.marks);
    }).length;

    const systemOverview = buildSystemOverviewMetrics(yearSubmissions);

    const classPerformance = ctx.buildClassPerformance().sort((a, b) => b.totalScore - a.totalScore);
    const topClass = classPerformance[0];
    const averageScore = classPerformance.length
      ? classPerformance.reduce((sum, item) => sum + item.totalScore, 0) / classPerformance.length
      : 0;

    const statusChipClass = ctx.getSystemModeStatusClass(ctx.state.systemMode);
    const statusLabel = ctx.getSystemModeLabel(ctx.state.systemMode);
    const lockActionLabel = ctx.state.systemMode === "locked" ? "Unlock System" : "Lock System";
    const yearActionLabel = activeYear && activeYear === ctx.state.selectedAcademicYear
      ? "Deactivate Selected Year"
      : "Activate Selected Year";
    const criteriaLastUpdatedText = ctx.state.criteriaLastUpdatedAt
      ? new Date(ctx.state.criteriaLastUpdatedAt).toLocaleString()
      : "Seed data";

    const availableYears = getAvailableAcademicYears(ctx, activeYear);

    const selectedYearOptions = availableYears
      .map((year) => {
        const selected = year === ctx.state.selectedAcademicYear ? " selected" : "";
        return "<option value=\"" + year + "\"" + selected + ">" + ctx.escapeHtml(year) + "</option>";
      })
      .join("");

    const nextYearOptions = getSuggestedAcademicYears(availableYears, 3)
      .map((year) => {
        const selected = year === ctx.state.pendingAcademicYear ? " selected" : "";
        return "<option value=\"" + year + "\"" + selected + ">" + ctx.escapeHtml(year) + "</option>";
      })
      .join("");

    const createYearPanelHtml = ctx.state.showCreateYearField
      ? "<div class=\"field\"><label for=\"admin-new-year-select\">Select New Academic Year</label><select id=\"admin-new-year-select\"><option value=\"\">Select year</option>" + nextYearOptions + "</select></div>" +
        (ctx.state.pendingAcademicYear
          ? "<div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-admin-action=\"confirm-create-year\">Confirm New Year</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"cancel-create-year\">Cancel</button></div>"
          : "<div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-admin-action=\"cancel-create-year\">Cancel</button></div>")
      : "";

    const alerts = [];
    if (!activeYear) {
      alerts.push("No academic year is currently active. Data updates are blocked.");
    }
    if (missingMarksConfigs > 0) {
      alerts.push(missingMarksConfigs + " criteria items need marks/rule configuration.");
    }
    if (metrics.pending > 0) {
      alerts.push(metrics.pending + " submissions are still pending verification.");
    }
    if (ctx.state.systemMode === "locked") {
      alerts.push("System is locked. Criteria and workflow edits are restricted.");
    }

    const alertsHtml = alerts.length
      ? alerts.map((item) => "<p>⚠ " + ctx.escapeHtml(item) + "</p>").join("")
      : "<p>All core checks look healthy right now.</p>";

    const activityHtml = ctx.state.recentActivity.length
      ? ctx.state.recentActivity.slice(0, 5)
          .map((item) => "<p><strong>" + ctx.escapeHtml(item.time) + "</strong> - " + ctx.escapeHtml(item.message) + "</p>")
          .join("")
      : "<p>No recent admin activity.</p>";

    return (
      "<section class=\"section-header\"><div><h1>Admin Dashboard</h1><p class=\"muted\">Control panel for live system state and instant admin actions.</p></div></section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Academic Year Control</h3><div class=\"meta-list\"><p><strong>Active Year:</strong> " + ctx.escapeHtml(activeYear || "None") + "</p></div><div class=\"field\"><label for=\"academic-year-select\">Select Existing Year</label><select id=\"academic-year-select\">" + selectedYearOptions + "</select></div><div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-admin-action=\"create-year\">Create New Year</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"toggle-year-active\">" + ctx.escapeHtml(yearActionLabel) + "</button></div>" + createYearPanelHtml + "</article>" +
      "<article class=\"panel\"><h3>System State Control</h3><div class=\"meta-list\"><p><strong>Status:</strong> <span class=\"status-pill " + statusChipClass + "\">" + ctx.escapeHtml(statusLabel) + "</span></p><p><strong>Rules:</strong> Only active year is editable.</p></div><div class=\"button-row\"><button type=\"button\" class=\"btn danger\" data-admin-action=\"toggle-lock\">" + ctx.escapeHtml(lockActionLabel) + "</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"set-evaluation-mode\">Set Evaluation Ongoing</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"set-setup-mode\">Set Setup Mode</button></div></article>" +
      "</section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Quick Actions</h3><div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-page-jump=\"criteria\">Manage Criteria</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"manage-users\">Manage Users</button><button type=\"button\" class=\"btn ghost\" data-admin-action=\"open-reports\">Reports</button></div></article>" +
      "<article class=\"panel\"><h3>Criteria Snapshot</h3><div class=\"meta-list\"><p><strong>Total Criteria:</strong> " + criteriaItems.length + "</p><p><strong>Missing Configurations:</strong> " + missingMarksConfigs + "</p><p><strong>Last Updated:</strong> " + ctx.escapeHtml(criteriaLastUpdatedText) + "</p></div></article>" +
      "</section>" +
      ctx.renderDashboardCards(metrics) +
      "<section class=\"cards-grid two-panel-grid\">" +
      renderSystemOverviewSection(systemOverview, selectedYearClassCount, ctx.state.selectedAcademicYear, ctx) +
      "<article class=\"panel\"><h3>User Management Snapshot</h3><div class=\"meta-list\"><p><strong>Total Users:</strong> " + totalUsers + "</p>" + roleSummary + "</div></article>" +
      "</section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Pending Actions / Alerts</h3><div class=\"meta-list\">" + alertsHtml + "</div></article>" +
      "<article class=\"panel\"><h3>Quick Analytics Snapshot</h3><div class=\"meta-list\"><p><strong>Top Performing Class:</strong> " + ctx.escapeHtml(topClass ? topClass.className : "N/A") + "</p><p><strong>Average Class Score:</strong> " + averageScore.toFixed(1) + "</p><p><strong>Evaluation Progress:</strong> " + systemOverview.evaluatedPercent.toFixed(1) + "%</p></div></article>" +
      "</section>" +
      "<section class=\"panel\"><h3>Recent Activity</h3><div class=\"meta-list\">" + activityHtml + "</div></section>" +
      ctx.renderStatusProgress("Workflow Status", metrics) +
      "<section class=\"chart-card\"><h3>System Snapshot</h3><div class=\"meta-list\"><p><strong>Total Categories:</strong> " + ctx.criteriaCatalog.length + "</p><p><strong>Total Criteria Items:</strong> " + ctx.getAllCriteriaItems().length + "</p><p><strong>Active Academic Year:</strong> " + ctx.escapeHtml(activeYear || "None") + "</p></div></section>"
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
    if (action === "create-year") {
      ctx.state.showCreateYearField = true;
      ctx.state.pendingAcademicYear = "";
      ctx.renderPage();
      return true;
    }

    if (action === "confirm-create-year") {
      const yearInput = String(ctx.state.pendingAcademicYear || "").trim();
      if (!yearInput) {
        ctx.showToast("Please select a year to continue.", "warning");
        return true;
      }
      ctx.createAcademicYearEntry(yearInput);
      ctx.state.showCreateYearField = false;
      ctx.state.pendingAcademicYear = "";
      return true;
    }

    if (action === "cancel-create-year") {
      ctx.state.showCreateYearField = false;
      ctx.state.pendingAcademicYear = "";
      ctx.renderPage();
      return true;
    }

    if (action === "toggle-year-active") {
      const activeYear = ctx.getActiveAcademicYear();
      if (activeYear && activeYear === ctx.state.selectedAcademicYear) {
        ctx.deactivateActiveAcademicYear();
        ctx.addRecentActivity("Deactivated academic year: " + activeYear);
        ctx.showToast("Academic year " + activeYear + " is now inactive.", "info");
      } else {
        ctx.setActiveAcademicYear(ctx.state.selectedAcademicYear);
        ctx.addRecentActivity("Activated academic year: " + ctx.state.selectedAcademicYear);
        ctx.showToast("Academic year " + ctx.state.selectedAcademicYear + " is now active.", "success");
      }
      ctx.renderTopbar();
      ctx.renderPage();
      return true;
    }

    if (action === "toggle-lock") {
      const nextMode = ctx.state.systemMode === "locked" ? "setup" : "locked";
      const dialogTitle = nextMode === "locked" ? "Confirm Lock System" : "Confirm Unlock System";
      const dialogMessage = nextMode === "locked"
        ? "Lock system updates now? This will block add/edit/delete operations until you unlock."
        : "Unlock system updates now? This will allow add/edit/delete operations again.";

      if (typeof ctx.openConfirmModal === "function") {
        ctx.openConfirmModal(dialogTitle, dialogMessage, function () {
          ctx.state.systemMode = nextMode;
          ctx.addRecentActivity("System state changed to " + ctx.getSystemModeLabel(nextMode));
          ctx.showToast("System state is now " + ctx.getSystemModeLabel(nextMode) + ".", "info");
          ctx.renderPage();
        });
      } else {
        ctx.state.systemMode = nextMode;
        ctx.addRecentActivity("System state changed to " + ctx.getSystemModeLabel(nextMode));
        ctx.showToast("System state is now " + ctx.getSystemModeLabel(nextMode) + ".", "info");
        ctx.renderPage();
      }
      return true;
    }

    if (action === "set-evaluation-mode") {
      ctx.state.systemMode = "evaluation";
      ctx.addRecentActivity("System state changed to Evaluation Ongoing");
      ctx.showToast("System state set to Evaluation Ongoing.", "info");
      ctx.renderPage();
      return true;
    }

    if (action === "set-setup-mode") {
      ctx.state.systemMode = "setup";
      ctx.addRecentActivity("System state changed to Setup Mode");
      ctx.showToast("System state set to Setup Mode.", "info");
      ctx.renderPage();
      return true;
    }

    if (action === "manage-users") {
      ctx.navigateToPage("users");
      return true;
    }

    if (action === "open-reports") {
      ctx.showToast("Reports shortcut registered. Wire to export and ranking module next.", "info");
      return true;
    }

    return false;
  }

  function handleChange(event, ctx) {
    const target = event.target;
    if (target.id !== "admin-new-year-select") {
      return false;
    }

    ctx.state.pendingAcademicYear = String(target.value || "").trim();
    ctx.renderPage();
    return true;
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
