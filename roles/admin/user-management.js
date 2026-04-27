window.applyPageConfig({
  autoRole: "admin",
  autoPage: "users"
});

(function initAdminUserManagementModule() {
  function renderUserManagementPage(ctx) {
    initializeUserUiState(ctx.state);

    const editingUser = ctx.state.editingUserId ? ctx.findUserById(ctx.state.editingUserId) : null;
    const showForm = Boolean(ctx.state.showUserForm);
    const users = getFilteredSortedUsers(ctx);
    const filterValues = getFilterValues(ctx, ctx.state.userFilterType);
    const roleOptions = renderRoleOptions(ctx, editingUser);
    const selectedSort = String(ctx.state.userSortKey) + "-" + String(ctx.state.userSortDirection);

    const userRows = users.length
      ? users.map((user) => renderUserRow(user, ctx)).join("")
      : "<tr><td colspan=\"6\" class=\"empty-row\">No users match the current search/filter.</td></tr>";

    const formHtml = showForm
      ? renderUserForm(ctx, editingUser)
      : "";

    return (
      "<section class=\"section-header\"><div><h1>User Management</h1><p class=\"muted\">Add users, assign a single role, and safely control account status.</p></div></section>" +
      "<section class=\"panel\">" +
      "<div class=\"panel-head\">" +
      "<div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-admin-user-action=\"open-add-form\">+ Add User</button></div>" +
      "<div class=\"button-row\">" +
      "<div class=\"field\"><label for=\"admin-user-search\">Search</label><input id=\"admin-user-search\" type=\"text\" placeholder=\"Name or email\" value=\"" + ctx.escapeAttribute(ctx.state.userSearchQuery) + "\" /></div>" +
      "<div class=\"field\"><label for=\"admin-user-filter-type\">Filter</label><select id=\"admin-user-filter-type\"><option value=\"all\"" + (ctx.state.userFilterType === "all" ? " selected" : "") + ">All</option><option value=\"role\"" + (ctx.state.userFilterType === "role" ? " selected" : "") + ">Role</option><option value=\"department\"" + (ctx.state.userFilterType === "department" ? " selected" : "") + ">Department / Class</option><option value=\"status\"" + (ctx.state.userFilterType === "status" ? " selected" : "") + ">Status</option></select></div>" +
      "<div class=\"field\"><label for=\"admin-user-filter-value\">Value</label><select id=\"admin-user-filter-value\">" + renderFilterValueOptions(filterValues, ctx.state.userFilterValue, ctx) + "</select></div>" +
      "<div class=\"field\"><label for=\"admin-user-sort\">Sort</label><select id=\"admin-user-sort\"><option value=\"name-asc\"" + (selectedSort === "name-asc" ? " selected" : "") + ">Name (A-Z)</option><option value=\"name-desc\"" + (selectedSort === "name-desc" ? " selected" : "") + ">Name (Z-A)</option><option value=\"role-asc\"" + (selectedSort === "role-asc" ? " selected" : "") + ">Role (A-Z)</option><option value=\"role-desc\"" + (selectedSort === "role-desc" ? " selected" : "") + ">Role (Z-A)</option></select></div>" +
      "</div>" +
      "</div>" +
      formHtml +
      "<div class=\"table-wrap compact-table\"><table><thead><tr><th>Name</th><th>Email / User ID</th><th>Role</th><th>Department / Class</th><th>Status</th><th>Actions</th></tr></thead><tbody>" + userRows + "</tbody></table></div>" +
      "</section>"
    );
  }

  function renderUserForm(ctx, editingUser) {
    const heading = editingUser ? "Edit User" : "Add User";
    const submitLabel = editingUser ? "Save Changes" : "Create User";
    const roleChangeNote = editingUser
      ? "<p class=\"muted\"><strong>Warning:</strong> Role changes affect permissions. A confirmation is required before applying.</p>"
      : "";

    return (
      "<article class=\"panel\">" +
      "<h3>" + heading + "</h3>" +
      roleChangeNote +
      "<form id=\"admin-user-form\" class=\"stack-form two-col\" data-editing-user=\"" + (editingUser ? editingUser.id : "") + "\">" +
      "<div class=\"field\"><label for=\"admin-user-name\">Name</label><input id=\"admin-user-name\" name=\"name\" type=\"text\" required value=\"" + ctx.escapeAttribute(editingUser ? editingUser.name : "") + "\" /></div>" +
      "<div class=\"field\"><label for=\"admin-user-email\">Email / Username</label><input id=\"admin-user-email\" name=\"email\" type=\"email\" required value=\"" + ctx.escapeAttribute(editingUser ? editingUser.email : "") + "\" /></div>" +
      "<div class=\"field\"><label for=\"admin-user-role\">Role</label><select id=\"admin-user-role\" name=\"role\" required>" + renderRoleOptions(ctx, editingUser) + "</select></div>" +
      "<div class=\"field\"><label for=\"admin-user-department\">Department / Class</label><input id=\"admin-user-department\" name=\"department\" type=\"text\" value=\"" + ctx.escapeAttribute(editingUser ? editingUser.department : "") + "\" /></div>" +
      "<div class=\"full-span button-row\"><button type=\"submit\" class=\"btn primary\">" + submitLabel + "</button><button id=\"admin-user-cancel\" type=\"button\" class=\"btn ghost\">Cancel</button></div>" +
      "</form>" +
      "</article>"
    );
  }

  function renderUserRow(user, ctx) {
    const isActive = user.status === "Active";
    const statusClass = isActive ? "status-approved" : "status-rejected";
    const toggleLabel = isActive ? "Deactivate" : "Activate";
    const toggleClass = isActive ? "warn" : "success";
    const activityCount = ctx.getUserActivityCount(user);
    const canDelete = ctx.canDeleteUser(user);
    const deleteLabel = canDelete ? "Delete" : "Delete Blocked";
    const deleteDisabled = canDelete ? "" : " disabled";

    return (
      "<tr>" +
      "<td>" + ctx.escapeHtml(user.name) + "</td>" +
      "<td>" + ctx.escapeHtml(user.email) + "</td>" +
      "<td>" + ctx.escapeHtml(ctx.getRoleLabel(user.role)) + "</td>" +
      "<td>" + ctx.escapeHtml(user.department || "-") + "</td>" +
      "<td><span class=\"status-pill " + statusClass + "\">" + ctx.escapeHtml(user.status) + "</span></td>" +
      "<td><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-user-edit=\"" + user.id + "\">Edit</button><button type=\"button\" class=\"btn " + toggleClass + "\" data-user-toggle-status=\"" + user.id + "\">" + toggleLabel + "</button><button type=\"button\" class=\"btn danger\" data-user-delete=\"" + user.id + "\" title=\"" + (canDelete ? "Delete user" : "Blocked: user has " + activityCount + " activity records") + "\"" + deleteDisabled + ">" + deleteLabel + "</button></div></td>" +
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

    const toggleStatusButton = event.target.closest("button[data-user-toggle-status]");
    if (toggleStatusButton) {
      const userId = Number(toggleStatusButton.dataset.userToggleStatus);
      const user = ctx.findUserById(userId);
      if (!user) {
        ctx.showToast("User not found.", "error");
        return true;
      }

      if (Number(ctx.state.currentUserId) === Number(user.id) && user.status === "Active") {
        ctx.showToast("You cannot deactivate the currently logged-in account.", "warning");
        return true;
      }

      const nextStatus = user.status === "Active" ? "Inactive" : "Active";
      const actionLabel = nextStatus === "Inactive" ? "Deactivate User" : "Activate User";
      const dialogMessage = nextStatus === "Inactive"
        ? "Deactivate this user? They will not be able to log in until reactivated."
        : "Activate this user account now?";

      ctx.openConfirmModal(actionLabel, dialogMessage, function () {
        user.status = nextStatus;
        ctx.addRecentActivity(nextStatus + " user: " + user.name + " (" + user.email + ")");
        ctx.showToast("User status updated to " + nextStatus + ".", "success");
        ctx.renderPage();
      });
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
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const role = ctx.normalizeUserRole(formData.get("role"));
    const department = String(formData.get("department") || "").trim();

    if (!name || !email) {
      ctx.showToast("Name and email are required.", "error");
      return true;
    }

    if (!role) {
      ctx.showToast("Role is required.", "error");
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
    const target = event.target;

    if (target.id === "admin-user-search") {
      ctx.state.userSearchQuery = String(target.value || "");
      ctx.renderPage();
      return true;
    }

    if (target.id === "admin-user-filter-type") {
      ctx.state.userFilterType = String(target.value || "all");
      ctx.state.userFilterValue = "all";
      ctx.renderPage();
      return true;
    }

    if (target.id === "admin-user-filter-value") {
      ctx.state.userFilterValue = String(target.value || "all");
      ctx.renderPage();
      return true;
    }

    if (target.id === "admin-user-sort") {
      const parts = String(target.value || "name-asc").split("-");
      ctx.state.userSortKey = parts[0] || "name";
      ctx.state.userSortDirection = parts[1] || "asc";
      ctx.renderPage();
      return true;
    }

    return false;
  }

  function initializeUserUiState(state) {
    if (typeof state.showUserForm !== "boolean") {
      state.showUserForm = false;
    }
    if (!Number.isFinite(Number(state.editingUserId))) {
      state.editingUserId = null;
    }
    if (typeof state.userSearchQuery !== "string") {
      state.userSearchQuery = "";
    }
    if (["all", "role", "department", "status"].indexOf(state.userFilterType) === -1) {
      state.userFilterType = "all";
    }
    if (typeof state.userFilterValue !== "string") {
      state.userFilterValue = "all";
    }
    if (["name", "role"].indexOf(state.userSortKey) === -1) {
      state.userSortKey = "name";
    }
    if (["asc", "desc"].indexOf(state.userSortDirection) === -1) {
      state.userSortDirection = "asc";
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
    return ctx.adminManagedRoleOptions
      .map((roleOption) => {
        const selected = roleOption.value === currentRole ? " selected" : "";
        return "<option value=\"" + ctx.escapeAttribute(roleOption.value) + "\"" + selected + ">" + ctx.escapeHtml(roleOption.label) + "</option>";
      })
      .join("");
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
