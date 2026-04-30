window.applyPageConfig({
  autoRole: "admin",
  autoPage: "academic-years"
});

(function initAdminAcademicYearModule() {
  function renderPage(ctx) {
    const academicYears = ctx.academicYears || [];
    const activeYear = String(ctx.getActiveAcademicYear() || "");

    const yearListRows = academicYears.map((year) => {
      const isActive = year === activeYear;
      const statusBadge = isActive 
        ? "<span class=\"status-pill status-approved\">Active</span>" 
        : "<span class=\"status-pill status-pending\">Inactive</span>";
      
      const activateBtn = isActive
        ? "<button type=\"button\" class=\"btn ghost\" disabled>Currently Active</button>"
        : "<button type=\"button\" class=\"btn primary\" data-year-action=\"activate\" data-year=\"" + ctx.escapeAttribute(year) + "\">Set Active</button>";

      return (
        "<tr class=\"eval-list-row\" style=\"display: table-row;\">" +
        "<td><strong>" + ctx.escapeHtml(year) + "</strong></td>" +
        "<td>" + statusBadge + "</td>" +
        "<td><div class=\"button-row\">" + activateBtn + "</div></td>" +
        "</tr>"
      );
    }).join("");

    return (
      "<section class=\"section-header\"><div><h1>Academic Year Management</h1><p class=\"muted\">Add new academic years and activate the current session.</p></div></section>" +
      "<section class=\"panel\">" +
      "<h3>Add Academic Year</h3>" +
      "<form id=\"admin-add-year-form\" class=\"stack-form\">" +
      "<div class=\"field\"><label for=\"new-academic-year\">Year Format (e.g. 2026-2027)</label><input type=\"text\" id=\"new-academic-year\" name=\"newYear\" required placeholder=\"YYYY-YYYY\" pattern=\"\\d{4}-\\d{4}\" /></div>" +
      "<div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">Add Year</button></div>" +
      "</form>" +
      "</section>" +
      "<section class=\"panel\">" +
      "<h3>Academic Years List</h3>" +
      "<div class=\"table-wrap\">" +
      "<table>" +
      "<thead><tr><th>Academic Year</th><th>Status</th><th>Actions</th></tr></thead>" +
      "<tbody>" + yearListRows + "</tbody>" +
      "</table>" +
      "</div>" +
      "</section>"
    );
  }

  function handleClick(event, ctx) {
    const btn = event.target.closest("button[data-year-action]");
    if (!btn) return false;

    const action = btn.dataset.yearAction;
    const year = btn.dataset.year;

    if (action === "activate" && year) {
      ctx.openConfirmModal("Activate Academic Year", "Set " + year + " as the active academic year? Students and teachers will interact with this year by default.", function() {
        ctx.setActiveAcademicYear(year);
        ctx.showToast("Activated academic year: " + year, "success");
        ctx.renderTopbar();
        ctx.renderPage();
      });
      return true;
    }

    return false;
  }

  function handleSubmit(event, ctx) {
    const form = event.target;
    if (form.id !== "admin-add-year-form") {
      return false;
    }
    event.preventDefault();

    const formData = new FormData(form);
    const newYear = String(formData.get("newYear") || "").trim();

    if (!newYear.match(/^\d{4}-\d{4}$/)) {
      ctx.showToast("Invalid format. Please use YYYY-YYYY format.", "error");
      return true;
    }

    if (ctx.academicYears.includes(newYear)) {
      ctx.showToast("Academic year already exists.", "warning");
      return true;
    }

    if (typeof ctx.addAcademicYear === "function") {
      ctx.addAcademicYear(newYear);
      ctx.showToast("Added new academic year: " + newYear, "success");
      form.reset();
      ctx.renderPage();
    }
    return true;
  }

  window.adminAcademicYearModule = {
    renderPage: renderPage,
    handleClick: handleClick,
    handleSubmit: handleSubmit
  };
})();
