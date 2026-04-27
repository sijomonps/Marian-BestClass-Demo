window.applyPageConfig({
  autoRole: "admin",
  autoPage: "users"
});

(function initAdminUserManagementModule() {
  function renderUserManagementPage(ctx) {
    initializeUserUiState(ctx.state);

    const editingUser = ctx.state.editingUserId ? ctx.findUserById(ctx.state.editingUserId) : null;
    const showForm = Boolean(ctx.state.showUserForm || editingUser);
    const managedUsers = (ctx.users || [])
      .filter((user) => {
        const role = ctx.normalizeUserRole(user.role);
        return role === "student" || role === "teacher" || role === "evaluator";
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    const userRows = managedUsers.length
      ? managedUsers.map((user) => renderUserRow(user, ctx)).join("")
      : "<tr><td colspan=\"4\" class=\"empty-row\">No users available.</td></tr>";

    const formHtml = showForm
      ? renderUserForm(ctx, editingUser)
      : "";

    return (
      "<section class=\"section-header\"><div><h1>User Management</h1><p class=\"muted\">Add users and assign role and department.</p></div></section>" +
      "<section class=\"panel\">" +
      "<div class=\"panel-head\">" +
        "<div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-admin-user-action=\"open-add-form\">Add User</button></div>" +
      "</div>" +
      formHtml +
        "<div class=\"table-wrap compact-table\"><table><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Actions</th></tr></thead><tbody>" + userRows + "</tbody></table></div>" +
      "</section>"
    );
  }

  function renderUserForm(ctx, editingUser) {
    const heading = editingUser ? "Edit User" : "Add User";
    const submitLabel = editingUser ? "Save Changes" : "Create User";
    const departmentSuggestions = (ctx.departments || [])
      .map((item) => "<option value=\"" + ctx.escapeAttribute(item) + "\"></option>")
      .join("");

    return (
      "<article class=\"panel\">" +
      "<h3>" + heading + "</h3>" +
      "<form id=\"admin-user-form\" class=\"stack-form two-col\" data-editing-user=\"" + (editingUser ? editingUser.id : "") + "\">" +
      "<div class=\"field\"><label for=\"admin-user-name\">Name</label><input id=\"admin-user-name\" name=\"name\" type=\"text\" required value=\"" + ctx.escapeAttribute(editingUser ? editingUser.name : "") + "\" /></div>" +
      "<div class=\"field\"><label for=\"admin-user-role\">Role</label><select id=\"admin-user-role\" name=\"role\" required>" + renderRoleOptions(ctx, editingUser) + "</select></div>" +
      "<div class=\"field\"><label for=\"admin-user-department\">Department</label><input id=\"admin-user-department\" name=\"department\" type=\"text\" list=\"admin-department-list\" required value=\"" + ctx.escapeAttribute(editingUser ? editingUser.department : "") + "\" /><datalist id=\"admin-department-list\">" + departmentSuggestions + "</datalist></div>" +
      "<div class=\"full-span button-row\"><button type=\"submit\" class=\"btn primary\">" + submitLabel + "</button><button id=\"admin-user-cancel\" type=\"button\" class=\"btn ghost\">Cancel</button></div>" +
      "</form>" +
      "</article>"
    );
  }

  function renderUserRow(user, ctx) {
    const canDelete = ctx.canDeleteUser(user);
    const deleteLabel = canDelete ? "Delete" : "Delete Blocked";
    const deleteDisabled = canDelete ? "" : " disabled";

    return (
      "<tr>" +
      "<td>" + ctx.escapeHtml(user.name) + "</td>" +
      "<td>" + ctx.escapeHtml(ctx.getRoleLabel(user.role)) + "</td>" +
      "<td>" + ctx.escapeHtml(user.department || "-") + "</td>" +
      "<td><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-user-edit=\"" + user.id + "\">Edit</button><button type=\"button\" class=\"btn danger\" data-user-delete=\"" + user.id + "\"" + deleteDisabled + ">" + deleteLabel + "</button></div></td>" +
      "</tr>"
    );
  }

  function handleClick(event, ctx) {
    const openAddButton = event.target.closest("button[data-admin-user-action='open-add-form']");
    if (openAddButton) {
      ctx.state.showUserForm = true;
      ctx.state.editingUserId = null;
      ctx.renderPage();
      return true;
    }

    const cancelButton = event.target.closest("#admin-user-cancel");
    if (cancelButton) {
      ctx.state.showUserForm = false;
      ctx.state.editingUserId = null;
      ctx.renderPage();
      return true;
    }

    const editButton = event.target.closest("button[data-user-edit]");
    if (editButton) {
      ctx.state.editingUserId = Number(editButton.dataset.userEdit);
      ctx.state.showUserForm = true;
      ctx.renderPage();
      return true;
    }

    const deleteButton = event.target.closest("button[data-user-delete]");
    if (deleteButton) {
      const userId = Number(deleteButton.dataset.userDelete);
      const user = ctx.findUserById(userId);
      if (!user) {
        ctx.showToast("User not found.", "error");
        return true;
      }

      if (Number(ctx.state.currentUserId) === Number(user.id)) {
        ctx.showToast("You cannot delete the currently logged-in account.", "warning");
        return true;
      }

      if (!ctx.canDeleteUser(user)) {
        ctx.showToast("Delete blocked. User has activity/submission data.", "warning");
        return true;
      }

      ctx.openConfirmModal("Delete User", "Delete this user permanently? This action cannot be undone.", function () {
        const index = ctx.users.findIndex((item) => Number(item.id) === Number(user.id));
        if (index === -1) {
          ctx.showToast("User not found.", "error");
          return;
        }
        ctx.users.splice(index, 1);

        if (Number(ctx.state.editingUserId) === Number(user.id)) {
          ctx.state.editingUserId = null;
          ctx.state.showUserForm = false;
        }

        ctx.addRecentActivity("Deleted user: " + user.name + " (" + user.email + ")");
        ctx.showToast("User deleted.", "success");
        ctx.renderPage();
      });
      return true;
    }

    return false;
  }

  function handleSubmit(event, ctx) {
    const form = event.target;
    if (form.id !== "admin-user-form") {
      return false;
    }

    event.preventDefault();

    const formData = new FormData(form);
    const editingId = Number(form.dataset.editingUser || ctx.state.editingUserId || 0);
    const editingUser = editingId ? ctx.findUserById(editingId) : null;

    const name = String(formData.get("name") || "").trim();
    const role = ctx.normalizeUserRole(formData.get("role"));
    const department = String(formData.get("department") || "").trim();
    const email = editingUser
      ? String(editingUser.email || "").trim().toLowerCase()
      : buildGeneratedEmail(name, role, ctx.users);

    if (!name) {
      ctx.showToast("Name is required.", "error");
      return true;
    }

    if (!role) {
      ctx.showToast("Role is required.", "error");
      return true;
    }

    if (["student", "teacher", "evaluator"].indexOf(role) === -1) {
      ctx.showToast("Role must be Student, Class Teacher, or Evaluation Team.", "error");
      return true;
    }

    if (!department) {
      ctx.showToast("Department is required.", "error");
      return true;
    }

    const duplicate = ctx.users.some((item) => {
      if (editingUser && Number(item.id) === Number(editingUser.id)) {
        return false;
      }
      return String(item.email || "").trim().toLowerCase() === email;
    });

    if (duplicate) {
      ctx.showToast("Duplicate email/user ID detected.", "warning");
      return true;
    }

    if (!editingUser) {
      const newUser = {
        id: ctx.getNextUserId(),
        name: name,
        email: email,
        role: role,
        department: department,
        status: "Active",
        linkedStudentId: null
      };

      ctx.users.push(newUser);
      if (department) {
        ctx.ensureDepartmentExists(department);
      }
      ctx.state.showUserForm = false;
      ctx.state.editingUserId = null;
      ctx.addRecentActivity("Created user: " + newUser.name + " (" + ctx.getRoleLabel(newUser.role) + ")");
      ctx.showToast("User created successfully.", "success");
      ctx.renderPage();
      return true;
    }

    const applyEdit = function applyEdit() {
      editingUser.name = name;
      editingUser.email = email;
      editingUser.role = role;
      editingUser.department = department;

      if (department) {
        ctx.ensureDepartmentExists(department);
      }

      ctx.state.showUserForm = false;
      ctx.state.editingUserId = null;
      ctx.addRecentActivity("Updated user: " + editingUser.name + " (" + ctx.getRoleLabel(editingUser.role) + ")");
      ctx.showToast("User updated successfully.", "success");
      ctx.renderPage();
    };

    if (editingUser.role !== role) {
      ctx.openConfirmModal(
        "Confirm Role Change",
        "Changing role updates permissions for this user. Historical records remain unchanged. Continue?",
        applyEdit
      );
      return true;
    }

    applyEdit();
    return true;
  }

  function handleChange(event, ctx) {
    return false;
  }

  function initializeUserUiState(state) {
    if (typeof state.showUserForm !== "boolean") {
      state.showUserForm = false;
    }
    if (!Number.isFinite(Number(state.editingUserId))) {
      state.editingUserId = null;
    }
  }

  function getFilteredSortedUsers(ctx) {
    const query = normalizeText(ctx.state.userSearchQuery);
    const filterType = String(ctx.state.userFilterType || "all");
    const filterValue = String(ctx.state.userFilterValue || "all");

    const filtered = ctx.users.filter((user) => {
      if (query) {
        const nameMatch = normalizeText(user.name).indexOf(query) > -1;
        const emailMatch = normalizeText(user.email).indexOf(query) > -1;
        if (!nameMatch && !emailMatch) {
          return false;
        }
      }

      if (filterType === "role" && filterValue !== "all" && String(user.role) !== filterValue) {
        return false;
      }

      if (filterType === "department" && filterValue !== "all") {
        if (normalizeText(user.department) !== normalizeText(filterValue)) {
          return false;
        }
      }

      if (filterType === "status" && filterValue !== "all" && String(user.status) !== filterValue) {
        return false;
      }

      return true;
    });

    const sortKey = String(ctx.state.userSortKey || "name");
    const direction = String(ctx.state.userSortDirection || "asc");

    filtered.sort((a, b) => {
      let left = "";
      let right = "";

      if (sortKey === "role") {
        left = ctx.getRoleLabel(a.role);
        right = ctx.getRoleLabel(b.role);
      } else {
        left = String(a.name || "");
        right = String(b.name || "");
      }

      const base = left.localeCompare(right);
      return direction === "desc" ? -base : base;
    });

    return filtered;
  }

  function renderRoleOptions(ctx, editingUser) {
    const currentRole = editingUser ? editingUser.role : "";
    const allowedRoles = ["student", "teacher", "evaluator"];

    return ctx.adminManagedRoleOptions
      .filter((roleOption) => allowedRoles.indexOf(String(roleOption.value)) > -1)
      .map((roleOption) => {
        const selected = roleOption.value === currentRole ? " selected" : "";
        return "<option value=\"" + ctx.escapeAttribute(roleOption.value) + "\"" + selected + ">" + ctx.escapeHtml(roleOption.label) + "</option>";
      })
      .join("");
  }

  function buildGeneratedEmail(name, role, users) {
    const rolePrefix = String(role || "user").toLowerCase();
    const base = String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || rolePrefix;

    let candidate = base + "@college.edu";
    let counter = 1;

    while (users.some((item) => String(item.email || "").toLowerCase() === candidate)) {
      counter += 1;
      candidate = base + counter + "@college.edu";
    }

    return candidate;
  }

  function getFilterValues(ctx, filterType) {
    if (filterType === "role") {
      return ctx.adminManagedRoleOptions.map((item) => ({
        value: item.value,
        label: item.label
      }));
    }

    if (filterType === "department") {
      const unique = [];
      ctx.users.forEach((user) => {
        const value = String(user.department || "").trim();
        if (value && unique.indexOf(value) === -1) {
          unique.push(value);
        }
      });

      unique.sort((a, b) => a.localeCompare(b));
      return unique.map((item) => ({ value: item, label: item }));
    }

    if (filterType === "status") {
      return [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
      ];
    }

    return [];
  }

  function renderFilterValueOptions(values, selectedValue, ctx) {
    const allOption = "<option value=\"all\"" + (selectedValue === "all" ? " selected" : "") + ">All</option>";
    const rows = values
      .map((item) => {
        const selected = String(item.value) === String(selectedValue) ? " selected" : "";
        return "<option value=\"" + ctx.escapeAttribute(item.value) + "\"" + selected + ">" + ctx.escapeHtml(item.label) + "</option>";
      })
      .join("");

    return allOption + rows;
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  window.adminUserManagementModule = {
    renderUserManagementPage: renderUserManagementPage,
    handleClick: handleClick,
    handleSubmit: handleSubmit,
    handleChange: handleChange
  };
})();
