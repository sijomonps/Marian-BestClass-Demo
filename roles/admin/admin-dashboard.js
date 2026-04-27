window.applyPageConfig({
  autoRole: "admin",
  autoPage: "dashboard"
});

(function initAdminDashboardModule() {
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

    const statusInsightLabel = statusMetrics.approved >= (statusMetrics.pending + statusMetrics.rejected)
      ? "Good"
      : "Needs improvement";
    const categoryInsightLabel = categoryMetrics.totalMarks > 0 ? "Good" : "Needs improvement";
    const classInsightLabel = classMetrics.totalScore > 0 ? "Good" : "Needs improvement";

    const submissionChart = renderVerticalChart([
      { label: "Approved", value: statusMetrics.approved, tone: "approved" },
      { label: "Pending", value: statusMetrics.pending, tone: "pending" },
      { label: "Rejected", value: statusMetrics.rejected, tone: "rejected" }
    ]);

    const categoryChart = renderHorizontalChart([
      { label: "Academics", value: categoryMetrics.academics, tone: "approved" },
      { label: "Courses", value: categoryMetrics.courses, tone: "score" },
      { label: "Internship", value: categoryMetrics.internship, tone: "pending" },
      { label: "Others", value: categoryMetrics.others, tone: "neutral" }
    ]);

    const classChart = renderVerticalChart(classMetrics.rows);

    return (
      "<section class=\"section-header\"><div><h1>Admin Dashboard</h1><p class=\"muted\">Key numbers and simple charts for quick decisions.</p></div></section>" +
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
      "<article class=\"panel chart-panel\"><div class=\"panel-head\"><h3>Submission Status</h3><span class=\"insight-chip " + getInsightClass(statusInsightLabel) + "\">" + statusInsightLabel + "</span></div><p class=\"muted\">Approved, Pending, Rejected</p>" + submissionChart + "</article>" +
      "<article class=\"panel chart-panel\"><div class=\"panel-head\"><h3>Category Contribution</h3><span class=\"insight-chip " + getInsightClass(categoryInsightLabel) + "\">" + categoryInsightLabel + "</span></div><p class=\"muted\">Academics, Courses, Internship, Others</p>" + categoryChart + "</article>" +
      "</section>" +
      "<section class=\"panel chart-panel\"><div class=\"panel-head\"><h3>Class Performance</h3><span class=\"insight-chip " + getInsightClass(classInsightLabel) + "\">" + classInsightLabel + "</span></div><p class=\"muted\">Class-wise total approved score</p>" + classChart + "</section>"
    );
  }

  function buildSubmissionStatusMetrics(submissions) {
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    (submissions || []).forEach((item) => {
      const status = String(item.status || "").toLowerCase();
      if (status === "approved") {
        approved += 1;
      } else if (status === "rejected") {
        rejected += 1;
      } else if (isPendingStatus(status)) {
        pending += 1;
      }
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
      others: 0,
      totalMarks: 0
    };

    const categoryByItemId = new Map();
    (criteriaCatalog || []).forEach((category) => {
      (category.items || []).forEach((item) => {
        categoryByItemId.set(Number(item.id), String(category.category || ""));
      });
    });

    (submissions || []).forEach((submission) => {
      if (String(submission.status || "").toLowerCase() !== "approved") {
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

      contribution.totalMarks += marks;
    });

    contribution.academics = roundValue(contribution.academics);
    contribution.courses = roundValue(contribution.courses);
    contribution.internship = roundValue(contribution.internship);
    contribution.others = roundValue(contribution.others);
    contribution.totalMarks = roundValue(contribution.totalMarks);

    return contribution;
  }

  function buildClassPerformanceMetrics(submissions, students) {
    const studentById = new Map((students || []).map((student) => [Number(student.id), student]));
    const classScores = new Map();

    (submissions || []).forEach((submission) => {
      if (String(submission.status || "").toLowerCase() !== "approved") {
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

    const rows = Array.from(classScores.entries())
      .map((entry) => ({
        label: entry[0],
        value: roundValue(entry[1]),
        tone: "score"
      }))
      .sort((a, b) => b.value - a.value);

    return {
      rows: rows,
      totalScore: roundValue(rows.reduce((sum, row) => sum + row.value, 0))
    };
  }

  function renderVerticalChart(rows) {
    const safeRows = Array.isArray(rows) ? rows : [];
    if (!safeRows.length) {
      return "<p class=\"empty-state\">No data available.</p>";
    }

    const maxValue = Math.max.apply(null, safeRows.map((row) => Number(row.value) || 0).concat([1]));

    const chartRows = safeRows
      .map((row) => {
        const height = toPercent(row.value, maxValue);
        return (
          "<div class=\"simple-vbar-col\">" +
          "<p class=\"simple-vbar-value\">" + formatValue(row.value) + "</p>" +
          "<div class=\"simple-vbar-track\"><div class=\"simple-vbar-fill " + mapToneClass(row.tone) + "\" style=\"height:" + height.toFixed(1) + "%\"></div></div>" +
          "<p class=\"simple-vbar-label\">" + escapeUnsafe(row.label) + "</p>" +
          "</div>"
        );
      })
      .join("");

    return "<div class=\"simple-vbar-chart\">" + chartRows + "</div>";
  }

  function renderHorizontalChart(rows) {
    const safeRows = Array.isArray(rows) ? rows : [];
    if (!safeRows.length) {
      return "<p class=\"empty-state\">No data available.</p>";
    }

    const maxValue = Math.max.apply(null, safeRows.map((row) => Number(row.value) || 0).concat([1]));

    const chartRows = safeRows
      .map((row) => {
        const width = toPercent(row.value, maxValue);
        return (
          "<div class=\"simple-hbar-row\">" +
          "<div class=\"simple-hbar-meta\"><span>" + escapeUnsafe(row.label) + "</span><span>" + formatValue(row.value) + "</span></div>" +
          "<div class=\"simple-hbar-track\"><div class=\"simple-hbar-fill " + mapToneClass(row.tone) + "\" style=\"width:" + width.toFixed(1) + "%\"></div></div>" +
          "</div>"
        );
      })
      .join("");

    return "<div class=\"simple-hbar-chart\">" + chartRows + "</div>";
  }

  function getInsightClass(label) {
    return label === "Good" ? "good" : "warn";
  }

  function isPendingStatus(status) {
    const normalized = String(status || "").toLowerCase();
    return normalized === "pending" || normalized.indexOf("correction") > -1;
  }

  function mapToneClass(tone) {
    if (tone === "approved") {
      return "tone-approved";
    }
    if (tone === "pending") {
      return "tone-pending";
    }
    if (tone === "rejected") {
      return "tone-rejected";
    }
    if (tone === "score") {
      return "tone-score";
    }
    return "tone-neutral";
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

  function formatValue(value) {
    const number = Number(value) || 0;
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
  }

  function toPercent(value, maxValue) {
    if (!Number.isFinite(maxValue) || maxValue <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (Number(value) / maxValue) * 100));
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
    handleChange: handleChange
  };
})();
