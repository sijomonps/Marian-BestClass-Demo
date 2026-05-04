window.applyPageConfig({
  autoRole: "admin",
  autoPage: "settings"
});

(function initAdminSettingsModule() {
  function formatDatetimeLocal(isoStr) {
    if (!isoStr) return "";
    var d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    var pad = function(n) { return n < 10 ? "0" + n : String(n); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

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

    var startVal = formatDatetimeLocal(ctx.state.submissionStartTime);
    var endVal = formatDatetimeLocal(ctx.state.submissionEndTime);

    var timeWindowStatus = "";
    if (ctx.state.submissionStartTime || ctx.state.submissionEndTime) {
      var now = new Date();
      var sTime = ctx.state.submissionStartTime ? new Date(ctx.state.submissionStartTime) : null;
      var eTime = ctx.state.submissionEndTime ? new Date(ctx.state.submissionEndTime) : null;
      if (sTime && now < sTime) {
        timeWindowStatus = "<p><span class=\"status-pill status-pending\">Not Yet Open</span> Opens on " + sTime.toLocaleString() + "</p>";
      } else if (eTime && now > eTime) {
        timeWindowStatus = "<p><span class=\"status-pill status-rejected\">Closed</span> Deadline was " + eTime.toLocaleString() + "</p>";
      } else {
        var closeInfo = eTime ? " — Closes " + eTime.toLocaleString() : "";
        timeWindowStatus = "<p><span class=\"status-pill status-approved\">Active</span> Submission window is open" + closeInfo + "</p>";
      }
    } else {
      timeWindowStatus = "<p class=\"muted\">No time restriction set. Submissions allowed anytime (when toggle is ON).</p>";
    }

    return (
      "<section class=\"section-header\"><div><h1>Settings</h1><p class=\"muted\">Control submission, evaluation, year selection, and demo reset.</p></div></section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Submission Status</h3><p><span class=\"status-pill " + submissionClass + "\">" + (ctx.state.submissionOpen ? "ON" : "OFF") + "</span></p><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-settings-action=\"toggle-submission\">Toggle Submission</button></div></article>" +
      "<article class=\"panel\"><h3>Evaluation Status</h3><p><span class=\"status-pill " + evaluationClass + "\">" + (ctx.state.evaluationOpen ? "ON" : "OFF") + "</span></p><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-settings-action=\"toggle-evaluation\">Toggle Evaluation</button></div></article>" +
      "</section>" +

      "<section class=\"panel\">" +
      "<h3>📅 Submission Time Window</h3>" +
      "<p class=\"muted\">Set the start and end date/time for the submission period. Students can only submit within this window.</p>" +
      timeWindowStatus +
      "<form id=\"admin-time-window-form\" class=\"stack-form two-col\">" +
      "<div class=\"field\"><label for=\"submission-start-time\">Start Date & Time</label><input type=\"datetime-local\" id=\"submission-start-time\" name=\"submissionStartTime\" value=\"" + startVal + "\" /></div>" +
      "<div class=\"field\"><label for=\"submission-end-time\">End Date & Time</label><input type=\"datetime-local\" id=\"submission-end-time\" name=\"submissionEndTime\" value=\"" + endVal + "\" /></div>" +
      "<div class=\"full-span button-row\"><button type=\"submit\" class=\"btn primary\">Save Time Window</button><button type=\"button\" class=\"btn ghost\" data-settings-action=\"clear-time-window\">Clear Time Window</button></div>" +
      "</form>" +
      "</section>" +

      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Academic Year</h3><div class=\"meta-list\"><p><strong>Active Year:</strong> " + (activeYear ? activeYear : "None") + "</p></div><p class=\"muted\">Manage academic years in the Academic Years module.</p></article>" +
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
      ctx.persistState();
      ctx.renderPage();
      return true;
    }

    if (action === "toggle-evaluation") {
      ctx.state.evaluationOpen = !ctx.state.evaluationOpen;
      ctx.addRecentActivity("Evaluation status set to " + (ctx.state.evaluationOpen ? "ON" : "OFF"));
      ctx.showToast("Evaluation is now " + (ctx.state.evaluationOpen ? "ON" : "OFF") + ".", "success");
      ctx.persistState();
      ctx.renderPage();
      return true;
    }

    if (action === "clear-time-window") {
      ctx.state.submissionStartTime = "";
      ctx.state.submissionEndTime = "";
      ctx.addRecentActivity("Submission time window cleared by admin.");
      ctx.showToast("Submission time window has been cleared. No time restriction.", "success");
      ctx.persistState();
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


    return false;
  }

  function handleSubmit(event, ctx) {
    var form = event.target;
    if (form.id !== "admin-time-window-form") {
      return false;
    }
    event.preventDefault();

    var formData = new FormData(form);
    var startTimeVal = String(formData.get("submissionStartTime") || "").trim();
    var endTimeVal = String(formData.get("submissionEndTime") || "").trim();

    if (startTimeVal && endTimeVal) {
      var startDate = new Date(startTimeVal);
      var endDate = new Date(endTimeVal);
      if (endDate <= startDate) {
        ctx.showToast("End time must be after start time.", "error");
        return true;
      }
    }

    ctx.state.submissionStartTime = startTimeVal ? new Date(startTimeVal).toISOString() : "";
    ctx.state.submissionEndTime = endTimeVal ? new Date(endTimeVal).toISOString() : "";

    var msg = "Submission time window updated.";
    if (startTimeVal && endTimeVal) {
      msg = "Submission window set: " + new Date(startTimeVal).toLocaleString() + " to " + new Date(endTimeVal).toLocaleString();
    } else if (startTimeVal) {
      msg = "Submission start time set: " + new Date(startTimeVal).toLocaleString();
    } else if (endTimeVal) {
      msg = "Submission end time set: " + new Date(endTimeVal).toLocaleString();
    }

    ctx.addRecentActivity(msg);
    ctx.showToast(msg, "success");
    ctx.persistState();
    ctx.renderPage();
    return true;
  }

  window.adminSettingsModule = {
    renderSettingsPage: renderSettingsPage,
    handleClick: handleClick,
    handleChange: handleChange,
    handleSubmit: handleSubmit
  };
})();
