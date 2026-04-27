window.applyPageConfig({
  autoRole: "admin",
  autoPage: "departments"
});

(function initAdminDepartmentManagementModule() {
  function renderDepartmentManagementPage(ctx) {
    const departments = ctx.getDepartmentList();
    const departmentRows = departments.length
      ? departments
          .map((department) => {
            return (
              "<li class=\"simple-row-item\">" +
              "<p><strong>" + ctx.escapeHtml(department) + "</strong></p>" +
              "<div class=\"button-row\"><button type=\"button\" class=\"btn danger\" data-department-delete=\"" + ctx.escapeAttribute(department) + "\">Delete</button></div>" +
              "</li>"
            );
          })
          .join("")
      : "<li class=\"empty-row\">No departments added yet.</li>";

    return (
      "<section class=\"section-header\"><div><h1>Department Management</h1><p class=\"muted\">Add department and maintain the department list.</p></div></section>" +
      "<section class=\"cards-grid two-panel-grid\">" +
      "<article class=\"panel\"><h3>Add Department</h3><form id=\"admin-department-form\" class=\"stack-form\"><div class=\"field\"><label for=\"admin-department-name\">Department Name</label><input id=\"admin-department-name\" name=\"departmentName\" type=\"text\" required /></div><div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">Add Department</button></div></form></article>" +
      "<article class=\"panel\"><h3>Department List</h3><ul class=\"simple-row-list\">" + departmentRows + "</ul><p class=\"muted\">Delete is blocked if users are assigned to that department.</p></article>" +
      "</section>"
    );
  }

  function handleSubmit(event, ctx) {
    const form = event.target;
    if (form.id !== "admin-department-form") {
      return false;
    }

    event.preventDefault();

    const formData = new FormData(form);
    const departmentName = normalizeText(formData.get("departmentName"));
    const departmentKey = departmentName.toLowerCase();

    if (!departmentName) {
      ctx.showToast("Department name is required.", "error");
      return true;
    }

    const exists = ctx.getDepartmentList().some((item) => normalizeText(item).toLowerCase() === departmentKey);
    if (exists) {
      ctx.showToast("Department already exists.", "warning");
      return true;
    }

    ctx.ensureDepartmentExists(departmentName);
    ctx.addRecentActivity("Added department: " + departmentName);
    ctx.showToast("Department added.", "success");
    form.reset();
    ctx.renderPage();
    return true;
  }

  function handleClick(event, ctx) {
    const deleteButton = event.target.closest("button[data-department-delete]");
    if (!deleteButton) {
      return false;
    }

    const rawName = String(deleteButton.dataset.departmentDelete || "");
    const departmentName = normalizeText(rawName);
    if (!departmentName) {
      return true;
    }

    ctx.openConfirmModal("Delete Department", "Delete this department? This is blocked if any user uses it.", function () {
      const removed = ctx.removeDepartment(departmentName);
      if (!removed) {
        ctx.showToast("Department cannot be deleted. It may be in use.", "warning");
        return;
      }

      ctx.addRecentActivity("Deleted department: " + departmentName);
      ctx.showToast("Department deleted.", "success");
      ctx.renderPage();
    });

    return true;
  }

  function handleChange() {
    return false;
  }

  function normalizeText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  window.adminDepartmentManagementModule = {
    renderDepartmentManagementPage: renderDepartmentManagementPage,
    handleSubmit: handleSubmit,
    handleClick: handleClick,
    handleChange: handleChange
  };
})();
