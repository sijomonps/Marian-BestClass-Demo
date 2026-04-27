window.applyPageConfig({
  autoRole: "admin",
  autoPage: "settings"
});

(function initAdminSettingsModule() {
  function renderSettingsPage(ctx) {
    const academicYears = ctx.getAcademicYears();
    const activeYear = String(ctx.state.activeAcademicYear || "");
    const selectedYear = String(ctx.state.selectedAcademicYear || "");

    const yearOptions = academicYears
      .map((year) => {
        const selected = year === selectedYear ? " selected" : "";
        return "<option value=\"" + year + "\"" + selected + ">" + year + "</option>";
      })
      .join("");

    const submissionClass = ctx.state.submissionOpen ? "status-approved" : "status-rejected";
    const evaluationClass = ctx.state.evaluationOpen ? "status-approved" : "status-rejected";

    return (
      "<section class=\"section-header\"><div><h1>Settings</h1><p class=\"muted\">Control submission, evaluation, year selection, and demo reset.</p></div></section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Submission Status</h3><p><span class=\"status-pill " + submissionClass + "\">" + (ctx.state.submissionOpen ? "ON" : "OFF") + "</span></p><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-settings-action=\"toggle-submission\">Toggle Submission</button></div></article>" +
      "<article class=\"panel\"><h3>Evaluation Status</h3><p><span class=\"status-pill " + evaluationClass + "\">" + (ctx.state.evaluationOpen ? "ON" : "OFF") + "</span></p><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-settings-action=\"toggle-evaluation\">Toggle Evaluation</button></div></article>" +
      "</section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Academic Year</h3><div class=\"field\"><label for=\"admin-settings-year-select\">Select Academic Year</label><select id=\"admin-settings-year-select\">" + yearOptions + "</select></div><div class=\"meta-list\"><p><strong>Active Year:</strong> " + (activeYear ? activeYear : "None") + "</p><p><strong>Viewing Year:</strong> " + selectedYear + "</p></div><div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-settings-action=\"activate-selected-year\">Set Selected Year Active</button></div></article>" +
      "<article class=\"panel\"><h3>Reset Demo Data</h3><p class=\"muted\">This restores criteria, users, submissions, years, and status toggles to initial seed data.</p><div class=\"button-row\"><button type=\"button\" class=\"btn danger\" data-settings-action=\"reset-demo\">Reset Demo Data</button></div></article>" +
      "</section>"
    );
  }

  function handleClick(event, ctx) {
    const actionButton = event.target.closest("button[data-settings-action]");
    if (!actionButton) {
      return false;
    }

    const action = String(actionButton.dataset.settingsAction || "");

    if (action === "toggle-submission") {
      ctx.state.submissionOpen = !ctx.state.submissionOpen;
      ctx.addRecentActivity("Submission status set to " + (ctx.state.submissionOpen ? "ON" : "OFF"));
      ctx.showToast("Submission is now " + (ctx.state.submissionOpen ? "ON" : "OFF") + ".", "success");
      ctx.renderPage();
      return true;
    }

    if (action === "toggle-evaluation") {
      ctx.state.evaluationOpen = !ctx.state.evaluationOpen;
      ctx.addRecentActivity("Evaluation status set to " + (ctx.state.evaluationOpen ? "ON" : "OFF"));
      ctx.showToast("Evaluation is now " + (ctx.state.evaluationOpen ? "ON" : "OFF") + ".", "success");
      ctx.renderPage();
      return true;
    }

    if (action === "activate-selected-year") {
      const selectedYear = String(ctx.state.selectedAcademicYear || "");
      if (!selectedYear) {
        ctx.showToast("Select an academic year first.", "warning");
        return true;
      }

      ctx.setActiveAcademicYear(selectedYear);
      ctx.addRecentActivity("Activated academic year: " + selectedYear);
      ctx.showToast("Academic year " + selectedYear + " is now active.", "success");
      ctx.renderTopbar();
      ctx.renderPage();
      return true;
    }

    if (action === "reset-demo") {
      ctx.openConfirmModal("Reset Demo Data", "Reset all demo data to initial state?", function () {
        ctx.resetDemoData();
        ctx.addRecentActivity("Demo data reset by admin.");
        ctx.showToast("Demo data has been reset.", "success");
        ctx.renderTopbar();
        ctx.renderPage();
      });
      return true;
    }

    return false;
  }

  function handleChange(event, ctx) {
    const target = event.target;

    if (target.id === "admin-settings-year-select") {
      const year = String(target.value || "");
      ctx.setSelectedAcademicYear(year);
      ctx.renderTopbar();
      ctx.renderPage();
      ctx.showToast("Viewing academic year " + year + ".", "info");
      return true;
    }

    return false;
  }

  function handleSubmit() {
    return false;
  }

  window.adminSettingsModule = {
    renderSettingsPage: renderSettingsPage,
    handleClick: handleClick,
    handleChange: handleChange,
    handleSubmit: handleSubmit
  };
})();
