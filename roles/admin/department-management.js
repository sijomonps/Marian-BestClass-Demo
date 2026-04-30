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
            const classes = typeof ctx.getDepartmentClasses === 'function' ? ctx.getDepartmentClasses(department) : [];
            const classesList = classes.length
              ? "<div class=\"dept-classes\" style=\"display:flex;gap:0.5rem;flex-wrap:wrap;margin:0.5rem 0;\">" + classes.map(c => 
                  "<span class=\"status-pill status-approved\" style=\"display:flex;align-items:center;gap:0.5rem;\">" + ctx.escapeHtml(c) + 
                  " <button type=\"button\" class=\"btn-icon danger\" data-class-delete=\"" + ctx.escapeAttribute(c) + "\" data-dept=\"" + ctx.escapeAttribute(department) + "\" style=\"background:transparent;border:none;color:white;cursor:pointer;padding:0;font-size:1.1rem;line-height:1;\">&times;</button></span>"
                ).join("") + "</div>"
              : "<p class=\"muted\">No classes</p>";

            return (
              "<div class=\"eval-sub-card\" style=\"margin-bottom:1rem;padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);\">" +
              "<div style=\"display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;\">" +
              "<div>" +
              "<strong>" + ctx.escapeHtml(department) + "</strong>" +
              classesList +
              "</div>" +
              "<div style=\"display:flex;gap:1rem;align-items:center;\">" +
              "<form class=\"inline-form\" data-add-class-form=\"" + ctx.escapeAttribute(department) + "\" style=\"display:flex;gap:0.5rem;\">" +
              "<input type=\"text\" name=\"className\" placeholder=\"New Class\" required style=\"width:150px;padding:0.25rem 0.5rem;border:1px solid var(--border);border-radius:4px;\" />" +
              "<button type=\"submit\" class=\"btn ghost\">Add Class</button>" +
              "</form>" +
              "<button type=\"button\" class=\"btn danger\" data-department-delete=\"" + ctx.escapeAttribute(department) + "\">Delete Dept</button>" +
              "</div>" +
              "</div>" +
              "</div>"
            );
          })
          .join("")
      : "<div class=\"empty-state\">No departments added yet.</div>";

    return (
      "<section class=\"section-header\"><div><h1>Department Management</h1><p class=\"muted\">Manage departments and their associated classes.</p></div></section>" +
      "<section class=\"panel\">" +
      "<h3>Add Department</h3>" +
      "<form id=\"admin-department-form\" class=\"stack-form\">" +
      "<div class=\"field\"><label for=\"admin-department-name\">Department Name</label><input id=\"admin-department-name\" name=\"departmentName\" type=\"text\" placeholder=\"e.g. Computer Science\" required /></div>" +
      "<div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">Add Department</button></div>" +
      "</form>" +
      "</section>" +
      "<section class=\"panel\">" +
      "<h3>Departments & Classes</h3>" +
      "<div class=\"eval-list-wrap\">" + departmentRows + "</div>" +
      "</section>"
    );
  }

  function handleSubmit(event, ctx) {
    const form = event.target;
    
    if (form.id === "admin-department-form") {
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

    if (form.hasAttribute("data-add-class-form")) {
      event.preventDefault();
      const deptName = form.getAttribute("data-add-class-form");
      const formData = new FormData(form);
      const className = normalizeText(formData.get("className"));
      
      if (!className) {
        ctx.showToast("Class name is required.", "error");
        return true;
      }

      if (typeof ctx.addDepartmentClass === 'function') {
        const added = ctx.addDepartmentClass(deptName, className);
        if (added) {
          ctx.showToast("Class added successfully.", "success");
          ctx.renderPage();
        } else {
          ctx.showToast("Class already exists or could not be added.", "warning");
        }
      }
      return true;
    }

    return false;
  }

  function handleClick(event, ctx) {
    const deleteDeptBtn = event.target.closest("button[data-department-delete]");
    if (deleteDeptBtn) {
      const rawName = String(deleteDeptBtn.dataset.departmentDelete || "");
      const departmentName = normalizeText(rawName);
      if (!departmentName) return true;

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

    const deleteClassBtn = event.target.closest("button[data-class-delete]");
    if (deleteClassBtn) {
      const className = normalizeText(deleteClassBtn.dataset.classDelete);
      const deptName = normalizeText(deleteClassBtn.dataset.dept);
      
      if (className && deptName && typeof ctx.removeDepartmentClass === 'function') {
        ctx.openConfirmModal("Delete Class", "Delete class " + className + "? This is blocked if students are assigned to it.", function() {
          const removed = ctx.removeDepartmentClass(deptName, className);
          if (!removed) {
            ctx.showToast("Class cannot be deleted. Students might be assigned to it.", "warning");
            return;
          }
          ctx.showToast("Class deleted.", "success");
          ctx.renderPage();
        });
      }
      return true;
    }

    return false;
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
