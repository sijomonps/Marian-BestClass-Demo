window.applyPageConfig({
  autoRole: "admin",
  autoPage: "users"
});

(function initAdminUserManagementModule() {
  const usersPerPage = 10;
  const allFilterValue = "all";

  function renderUserManagementPage(ctx) {
    initializeUserUiState(ctx.state);

    const editingUser = ctx.state.editingUserId ? ctx.findUserById(ctx.state.editingUserId) : null;
    const showForm = Boolean(ctx.state.showUserForm || editingUser);
    const managedUsers = (ctx.users || [])
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    const formHtml = showForm
      ? renderUserForm(ctx, editingUser)
      : "";

    return (
      "<section class=\"section-header\"><div><h1>User Management</h1><p class=\"muted\">Manage users, approvals, and quick CSV upload.</p></div></section>" +
      "<section class=\"panel\">" +
      "<div class=\"panel-head\">" +
        "<div class=\"button-row\">" +
          "<button type=\"button\" class=\"btn primary\" data-admin-user-action=\"open-add-form\">Add User</button>" +
          "<button type=\"button\" class=\"btn ghost\" data-admin-user-action=\"upload-csv\">Upload CSV</button>" +
          "<button type=\"button\" class=\"btn ghost\" data-admin-user-action=\"download-sample\">Download Sample</button>" +
          "<input id=\"admin-user-csv-file\" type=\"file\" accept=\".csv,text/csv\" class=\"hidden\" />" +
        "</div>" +
      "</div>" +
      formHtml +
      "<div id=\"admin-user-list-root\">" + renderUserListSection(ctx, managedUsers) + "</div>" +
      "</section>"
    );
  }

  function renderUserListSection(ctx, managedUsers) {
    const viewState = getUserListViewState(ctx.state);
    const records = managedUsers.map((user) => createUserRecord(user, ctx));

    const departmentOptions = buildUniqueOptions(records, (record) => record.department);
    if (!hasOption(viewState.department, departmentOptions)) {
      viewState.department = allFilterValue;
    }

    const classOptions = buildUniqueOptions(
      filterByDepartment(records, viewState.department).filter((record) => record.className),
      (record) => record.className
    );
    if (!hasOption(viewState.className, classOptions)) {
      viewState.className = allFilterValue;
    }

    const hierarchyRecords = filterByClass(filterByDepartment(records, viewState.department), viewState.className);
    const studentOptions = buildStudentOptions(hierarchyRecords);
    if (!hasOption(viewState.studentId, studentOptions)) {
      viewState.studentId = allFilterValue;
    }

    const statusOptions = buildUniqueOptions(records, (record) => record.statusLabel);
    if (!hasOption(viewState.status, statusOptions)) {
      viewState.status = allFilterValue;
    }

    const query = normalizeText(viewState.search);
    const filtered = records.filter((record) => {
      if (query && record.searchText.indexOf(query) === -1) {
        return false;
      }
      if (viewState.department !== allFilterValue && !valuesMatch(record.department, viewState.department)) {
        return false;
      }
      if (viewState.className !== allFilterValue && !valuesMatch(record.className, viewState.className)) {
        return false;
      }
      if (viewState.status !== allFilterValue && !valuesMatch(record.statusLabel, viewState.status)) {
        return false;
      }
      if (viewState.studentId !== allFilterValue && Number(record.studentId) !== Number(viewState.studentId)) {
        return false;
      }
      return true;
    });

    const pageInfo = paginateRecords(filtered, viewState.currentPage, usersPerPage);
    viewState.currentPage = pageInfo.currentPage;

    const userRows = pageInfo.items.length
      ? pageInfo.items.map((record) => renderUserRow(record.user, ctx)).join("")
      : "<tr><td colspan=\"7\" class=\"empty-row\">No users match your filters.</td></tr>";

    return (
      "<section class=\"panel hierarchy-panel\">" +
      "<div class=\"panel-head\"><h3>Hierarchy View</h3></div>" +
      "<div class=\"list-toolbar\">" +
      "<div class=\"field\"><label for=\"admin-user-search\">Search</label><input id=\"admin-user-search\" type=\"search\" placeholder=\"Search name, category, email\" value=\"" + ctx.escapeAttribute(viewState.search) + "\" data-admin-user-filter=\"search\" /></div>" +
      "<div class=\"field\"><label for=\"admin-user-filter-department\">Department</label><select id=\"admin-user-filter-department\" data-admin-user-filter=\"department\">" + renderFilterOptions(departmentOptions, viewState.department, "All Departments", ctx) + "</select></div>" +
      "<div class=\"field\"><label for=\"admin-user-filter-class\">Class</label><select id=\"admin-user-filter-class\" data-admin-user-filter=\"className\">" + renderFilterOptions(classOptions, viewState.className, "All Classes", ctx) + "</select></div>" +
      "<div class=\"field\"><label for=\"admin-user-filter-student\">Student</label><select id=\"admin-user-filter-student\" data-admin-user-filter=\"studentId\">" + renderFilterOptions(studentOptions, viewState.studentId, "All Students", ctx) + "</select></div>" +
      "<div class=\"field\"><label for=\"admin-user-filter-status\">Status</label><select id=\"admin-user-filter-status\" data-admin-user-filter=\"status\">" + renderFilterOptions(statusOptions, viewState.status, "All Statuses", ctx) + "</select></div>" +
      "</div>" +
      renderSummary(pageInfo) +
      "<div class=\"table-wrap compact-table\"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Class</th><th>Approval</th><th>Actions</th></tr></thead><tbody>" + userRows + "</tbody></table></div>" +
      renderPagination(pageInfo, ctx) +
      "</section>"
    );
  }

  function renderUserForm(ctx, editingUser) {
    const heading = editingUser ? "Edit User" : "Add User";
    const submitLabel = editingUser ? "Save Changes" : "Create User";
    const departmentSuggestions = (ctx.departments || [])
      .map((item) => "<option value=\"" + ctx.escapeAttribute(item) + "\"></option>")
      .join("");

    const selectedRole = editingUser ? ctx.normalizeUserRole(editingUser.role) : "student";
    const classValue = editingUser && editingUser.class ? editingUser.class : "";
    const approvedChecked = !editingUser || editingUser.isApproved !== false ? " checked" : "";

    return (
      "<article class=\"panel\">" +
      "<h3>" + heading + "</h3>" +
      "<form id=\"admin-user-form\" class=\"stack-form two-col\" data-editing-user=\"" + (editingUser ? editingUser.id : "") + "\">" +
      "<div class=\"field\"><label for=\"admin-user-name\">Name</label><input id=\"admin-user-name\" name=\"name\" type=\"text\" required value=\"" + ctx.escapeAttribute(editingUser ? editingUser.name : "") + "\" /></div>" +
      "<div class=\"field\"><label for=\"admin-user-email\">Email</label><input id=\"admin-user-email\" name=\"email\" type=\"email\" required value=\"" + ctx.escapeAttribute(editingUser ? editingUser.email : "") + "\" /></div>" +
      "<div class=\"field\"><label for=\"admin-user-role\">Role</label><select id=\"admin-user-role\" name=\"role\" required>" + renderRoleOptions(ctx, selectedRole) + "</select></div>" +
      "<div class=\"field\"><label for=\"admin-user-department\">Department</label><input id=\"admin-user-department\" name=\"department\" type=\"text\" list=\"admin-department-list\" required value=\"" + ctx.escapeAttribute(editingUser ? editingUser.department : "") + "\" /><datalist id=\"admin-department-list\">" + departmentSuggestions + "</datalist></div>" +
      "<div class=\"field\"><label for=\"admin-user-class\">Class</label><input id=\"admin-user-class\" name=\"className\" type=\"text\" value=\"" + ctx.escapeAttribute(classValue) + "\" placeholder=\"Required for students\" /></div>" +
      "<div class=\"field\"><label for=\"admin-user-approved\">Approved</label><label><input id=\"admin-user-approved\" name=\"isApproved\" type=\"checkbox\"" + approvedChecked + " /> Enable login access</label></div>" +
      "<div class=\"full-span button-row\"><button type=\"submit\" class=\"btn primary\">" + submitLabel + "</button><button id=\"admin-user-cancel\" type=\"button\" class=\"btn ghost\">Cancel</button></div>" +
      "</form>" +
      "</article>"
    );
  }

  function renderUserRow(user, ctx) {
    const canDelete = ctx.canDeleteUser(user);
    const deleteLabel = canDelete ? "Delete" : "Delete Blocked";
    const deleteDisabled = canDelete ? "" : " disabled";
    const isApproved = user.isApproved !== false;
    const approvalClass = isApproved ? "status-approved" : "status-pending";
    const approvalLabel = isApproved ? "Approved" : "Pending";
    const approveButton = isApproved
      ? ""
      : "<button type=\"button\" class=\"btn success\" data-user-approve=\"" + user.id + "\">Approve</button>";

    return (
      "<tr>" +
      "<td>" + ctx.escapeHtml(user.name || "-") + "</td>" +
      "<td>" + ctx.escapeHtml(user.email || "-") + "</td>" +
      "<td>" + ctx.escapeHtml(ctx.getRoleLabel(user.role)) + "</td>" +
      "<td>" + ctx.escapeHtml(user.department || "-") + "</td>" +
      "<td>" + ctx.escapeHtml(user.class || "-") + "</td>" +
      "<td><span class=\"status-pill " + approvalClass + "\">" + approvalLabel + "</span></td>" +
      "<td><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-user-edit=\"" + user.id + "\">Edit</button>" + approveButton + "<button type=\"button\" class=\"btn danger\" data-user-delete=\"" + user.id + "\"" + deleteDisabled + ">" + deleteLabel + "</button></div></td>" +
      "</tr>"
    );
  }

  function getUserListViewState(state) {
    if (!state.adminUserListView || typeof state.adminUserListView !== "object") {
      state.adminUserListView = {
        search: "",
        department: allFilterValue,
        className: allFilterValue,
        status: allFilterValue,
        studentId: allFilterValue,
        currentPage: 1
      };
    }
    return state.adminUserListView;
  }

  function createUserRecord(user, ctx) {
    const roleLabel = ctx.getRoleLabel(user.role);
    const statusLabel = user.isApproved === false
      ? "Pending"
      : (String(user.status || "").trim() || "Active");
    const className = String(user.class || "").trim();

    return {
      user: user,
      name: String(user.name || ""),
      email: String(user.email || ""),
      roleLabel: roleLabel,
      department: String(user.department || ""),
      className: className,
      statusLabel: statusLabel,
      studentId: Number(user.linkedStudentId || 0),
      searchText: normalizeText(String(user.name || "") + " " + String(user.email || "") + " " + roleLabel + " " + String(user.department || ""))
    };
  }

  function normalizeFilterValue(value) {
    return String(value || "").trim();
  }

  function valuesMatch(left, right) {
    return normalizeText(left) === normalizeText(right);
  }

  function buildUniqueOptions(records, selector) {
    const map = new Map();

    (records || []).forEach((record) => {
      const value = normalizeFilterValue(selector(record));
      if (!value) {
        return;
      }
      const key = normalizeText(value);
      if (!map.has(key)) {
        map.set(key, {
          label: value,
          value: value
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  function buildStudentOptions(records) {
    const map = new Map();

    (records || []).forEach((record) => {
      if (!Number.isFinite(record.studentId) || record.studentId <= 0) {
        return;
      }
      const key = String(record.studentId);
      if (!map.has(key)) {
        map.set(key, {
          label: record.name || record.user.name || ("Student " + key),
          value: key
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  function hasOption(selectedValue, options) {
    if (selectedValue === allFilterValue) {
      return true;
    }
    return (options || []).some((option) => valuesMatch(option.value, selectedValue));
  }

  function filterByDepartment(records, department) {
    if (department === allFilterValue) {
      return records;
    }
    return records.filter((record) => valuesMatch(record.department, department));
  }

  function filterByClass(records, className) {
    if (className === allFilterValue) {
      return records;
    }
    return records.filter((record) => valuesMatch(record.className, className));
  }

  function paginateRecords(records, currentPage, pageSize) {
    const safeRecords = Array.isArray(records) ? records : [];
    const totalItems = safeRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Number.isFinite(Number(currentPage)) ? Number(currentPage) : 1;
    const page = Math.min(Math.max(1, safePage), totalPages);
    const start = (page - 1) * pageSize;
    const end = Math.min(totalItems, start + pageSize);

    return {
      items: safeRecords.slice(start, end),
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: page,
      start: totalItems ? start + 1 : 0,
      end: end
    };
  }

  function renderFilterOptions(options, selectedValue, allLabel, ctx) {
    const allSelected = selectedValue === allFilterValue ? " selected" : "";
    const rows = (options || [])
      .map((option) => {
        const selected = valuesMatch(option.value, selectedValue) ? " selected" : "";
        return "<option value=\"" + ctx.escapeAttribute(option.value) + "\"" + selected + ">" + ctx.escapeHtml(option.label) + "</option>";
      })
      .join("");
    return "<option value=\"" + allFilterValue + "\"" + allSelected + ">" + ctx.escapeHtml(allLabel) + "</option>" + rows;
  }

  function renderSummary(pageInfo) {
    if (!pageInfo || pageInfo.totalItems === 0) {
      return "<p class=\"muted list-summary\">Showing 0 records</p>";
    }
    return "<p class=\"muted list-summary\">Showing " + pageInfo.start + "-" + pageInfo.end + " of " + pageInfo.totalItems + " records</p>";
  }

  function renderPagination(pageInfo, ctx) {
    if (!pageInfo || pageInfo.totalItems === 0) {
      return "";
    }

    let pageButtons = "";
    for (let page = 1; page <= pageInfo.totalPages; page += 1) {
      const activeClass = page === pageInfo.currentPage ? " active" : "";
      pageButtons += "<button type=\"button\" class=\"btn ghost pagination-btn" + activeClass + "\" data-admin-user-page-action=\"page\" data-admin-user-page-number=\"" + page + "\">" + page + "</button>";
    }

    const prevDisabled = pageInfo.currentPage <= 1 ? " disabled" : "";
    const nextDisabled = pageInfo.currentPage >= pageInfo.totalPages ? " disabled" : "";

    return (
      "<div class=\"pagination-row\">" +
      "<button type=\"button\" class=\"btn ghost pagination-btn\" data-admin-user-page-action=\"prev\"" + prevDisabled + ">Prev</button>" +
      pageButtons +
      "<button type=\"button\" class=\"btn ghost pagination-btn\" data-admin-user-page-action=\"next\"" + nextDisabled + ">Next</button>" +
      "</div>"
    );
  }

  function refreshUserList(ctx) {
    const root = document.getElementById("admin-user-list-root");
    if (!root) {
      ctx.renderPage();
      return;
    }

    const managedUsers = (ctx.users || [])
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    root.innerHTML = renderUserListSection(ctx, managedUsers);
  }

  function handleClick(event, ctx) {
    const pageButton = event.target.closest("button[data-admin-user-page-action]");
    if (pageButton) {
      const viewState = getUserListViewState(ctx.state);
      const action = String(pageButton.dataset.adminUserPageAction || "");
      const requestedPage = Number(pageButton.dataset.adminUserPageNumber);

      if (action === "prev") {
        viewState.currentPage = Math.max(1, Number(viewState.currentPage || 1) - 1);
      } else if (action === "next") {
        viewState.currentPage = Number(viewState.currentPage || 1) + 1;
      } else if (action === "page" && Number.isFinite(requestedPage)) {
        viewState.currentPage = Math.max(1, requestedPage);
      }

      refreshUserList(ctx);
      return true;
    }

    const openAddButton = event.target.closest("button[data-admin-user-action='open-add-form']");
    if (openAddButton) {
      ctx.state.showUserForm = true;
      ctx.state.editingUserId = null;
      ctx.renderPage();
      return true;
    }

    const uploadCsvButton = event.target.closest("button[data-admin-user-action='upload-csv']");
    if (uploadCsvButton) {
      const fileInput = document.getElementById("admin-user-csv-file");
      if (fileInput) {
        fileInput.click();
      }
      return true;
    }

    const downloadSampleButton = event.target.closest("button[data-admin-user-action='download-sample']");
    if (downloadSampleButton) {
      downloadSampleCsv();
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

    const approveButton = event.target.closest("button[data-user-approve]");
    if (approveButton) {
      const userId = Number(approveButton.dataset.userApprove);
      const user = ctx.findUserById(userId);
      if (!user) {
        ctx.showToast("User not found.", "error");
        return true;
      }

      user.isApproved = true;
      user.status = "Active";
      if (ctx.normalizeUserRole(user.role) === "student") {
        if (!String(user.class || "").trim()) {
          user.class = String(user.department || "General").trim();
        }
        ctx.ensureStudentLinkedToUser(user);
      }

      ctx.addRecentActivity("Approved user: " + user.name + " (" + user.email + ")");
      ctx.showToast("User approved.", "success");
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
    const email = ctx.normalizeEmail(formData.get("email"));
    const role = parseRoleInput(formData.get("role"));
    const department = String(formData.get("department") || "").trim();
    const className = String(formData.get("className") || "").trim();
    const isApproved = formData.get("isApproved") !== null;

    if (!name || !email || !role || !department) {
      ctx.showToast("Name, email, role, and department are required.", "error");
      return true;
    }

    if (role === "student" && !className) {
      ctx.showToast("Class is required for student users.", "error");
      return true;
    }

    const duplicate = ctx.users.some((item) => {
      if (editingUser && Number(item.id) === Number(editingUser.id)) {
        return false;
      }
      return ctx.normalizeEmail(item.email) === email;
    });

    if (duplicate) {
      ctx.showToast("Duplicate email detected.", "warning");
      return true;
    }

    if (!editingUser) {
      const newUser = {
        id: ctx.getNextUserId(),
        name: name,
        email: email,
        role: role,
        department: department,
        class: role === "student" ? className : "",
        isApproved: isApproved,
        status: isApproved ? "Active" : "Pending",
        linkedStudentId: null
      };

      if (newUser.role === "student" && newUser.isApproved) {
        ctx.ensureStudentLinkedToUser(newUser);
      }

      ctx.users.push(newUser);
      ctx.ensureDepartmentExists(department);
      ctx.state.showUserForm = false;
      ctx.state.editingUserId = null;
      ctx.addRecentActivity("Created user: " + newUser.name + " (" + ctx.getRoleLabel(newUser.role) + ")");
      ctx.showToast("User created successfully.", "success");
      ctx.renderPage();
      return true;
    }

    editingUser.name = name;
    editingUser.email = email;
    editingUser.role = role;
    editingUser.department = department;
    editingUser.class = role === "student" ? className : "";
    editingUser.isApproved = isApproved;
    editingUser.status = isApproved ? "Active" : "Pending";

    if (role === "student") {
      if (isApproved) {
        ctx.ensureStudentLinkedToUser(editingUser);
      } else {
        editingUser.linkedStudentId = null;
      }
    } else {
      editingUser.linkedStudentId = null;
    }

    ctx.ensureDepartmentExists(department);
    ctx.state.showUserForm = false;
    ctx.state.editingUserId = null;
    ctx.addRecentActivity("Updated user: " + editingUser.name + " (" + ctx.getRoleLabel(editingUser.role) + ")");
    ctx.showToast("User updated successfully.", "success");
    ctx.renderPage();
    return true;
  }

  function handleChange(event, ctx) {
    const target = event.target;
    if (!target) {
      return false;
    }

    if (target.dataset && target.dataset.adminUserFilter) {
      const viewState = getUserListViewState(ctx.state);
      const filterKey = String(target.dataset.adminUserFilter || "");
      const nextValue = String(target.value || "").trim() || allFilterValue;

      viewState[filterKey] = nextValue;
      if (filterKey === "department") {
        viewState.className = allFilterValue;
        viewState.studentId = allFilterValue;
      } else if (filterKey === "className") {
        viewState.studentId = allFilterValue;
      }
      viewState.currentPage = 1;

      refreshUserList(ctx);
      return true;
    }

    if (target.id !== "admin-user-csv-file") {
      return false;
    }

    const file = target.files && target.files[0] ? target.files[0] : null;
    if (!file) {
      return true;
    }

    file.text()
      .then((text) => {
        const parsed = parseCsvContent(text);
        const result = importCsvUsers(parsed, ctx);

        if (result.created > 0) {
          ctx.showToast(result.created + " users imported from CSV.", "success");
          ctx.addRecentActivity("Imported " + result.created + " users via CSV");
        } else {
          ctx.showToast("No users imported from CSV.", "warning");
        }

        if (result.errors.length) {
          ctx.showToast(result.errors[0], "warning");
        }

        ctx.renderPage();
      })
      .catch((error) => {
        const message = error && error.message ? error.message : "Unable to read CSV file.";
        ctx.showToast(message, "error");
      })
      .finally(() => {
        target.value = "";
      });

    return true;
  }

  function handleInput(event, ctx) {
    const target = event.target;
    if (!target || !target.dataset || String(target.dataset.adminUserFilter || "") !== "search") {
      return false;
    }

    const viewState = getUserListViewState(ctx.state);
    viewState.search = String(target.value || "");
    viewState.currentPage = 1;
    refreshUserList(ctx);
    return true;
  }

  function initializeUserUiState(state) {
    if (typeof state.showUserForm !== "boolean") {
      state.showUserForm = false;
    }
    if (!Number.isFinite(Number(state.editingUserId))) {
      state.editingUserId = null;
    }
    getUserListViewState(state);
  }

  function renderRoleOptions(ctx, selectedRole) {
    const currentRole = parseRoleInput(selectedRole) || "student";

    return (ctx.adminManagedRoleOptions || [])
      .map((roleOption) => {
        const selected = parseRoleInput(roleOption.value) === currentRole ? " selected" : "";
        return "<option value=\"" + ctx.escapeAttribute(roleOption.value) + "\"" + selected + ">" + ctx.escapeHtml(roleOption.label) + "</option>";
      })
      .join("");
  }

  function parseCsvContent(csvText) {
    const lines = String(csvText || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line);

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(",").map((cell) => normalizeText(cell));
    const indexes = {
      name: headers.indexOf("name"),
      email: headers.indexOf("email"),
      role: headers.indexOf("role"),
      department: headers.indexOf("department"),
      className: headers.indexOf("class")
    };

    if (indexes.name < 0 || indexes.email < 0 || indexes.role < 0 || indexes.department < 0 || indexes.className < 0) {
      throw new Error("CSV header must be: Name,Email,Role,Department,Class");
    }

    return lines.slice(1).map((line) => {
      const cells = line.split(",");
      return {
        name: String(cells[indexes.name] || "").trim(),
        email: String(cells[indexes.email] || "").trim(),
        role: String(cells[indexes.role] || "").trim(),
        department: String(cells[indexes.department] || "").trim(),
        className: String(cells[indexes.className] || "").trim()
      };
    });
  }

  function importCsvUsers(rows, ctx) {
    const existingEmails = new Set((ctx.users || []).map((item) => ctx.normalizeEmail(item.email)));
    const batchEmails = new Set();
    const errors = [];
    let created = 0;

    (rows || []).forEach((row, index) => {
      const role = parseRoleInput(row.role);
      const email = ctx.normalizeEmail(row.email);
      const name = String(row.name || "").trim();
      const department = String(row.department || "").trim();
      const className = String(row.className || "").trim();
      const rowLabel = "Row " + (index + 2);

      if (!name || !email || !department) {
        errors.push(rowLabel + ": missing required value(s).");
        return;
      }

      if (!role) {
        errors.push(rowLabel + ": role is invalid.");
        return;
      }

      if (existingEmails.has(email) || batchEmails.has(email)) {
        errors.push(rowLabel + ": duplicate email " + email + ".");
        return;
      }

      if (role === "student" && !className) {
        errors.push(rowLabel + ": class is required for student role.");
        return;
      }

      const newUser = {
        id: ctx.getNextUserId(),
        name: name,
        email: email,
        role: role,
        department: department,
        class: role === "student" ? className : "",
        isApproved: true,
        status: "Active",
        linkedStudentId: null
      };

      if (newUser.role === "student") {
        ctx.ensureStudentLinkedToUser(newUser);
      }

      ctx.users.push(newUser);
      ctx.ensureDepartmentExists(department);
      existingEmails.add(email);
      batchEmails.add(email);
      created += 1;
    });

    return {
      created: created,
      errors: errors
    };
  }

  function downloadSampleCsv() {
    const csv = [
      "Name,Email,Role,Department,Class",
      "Asha Roy,asha.roy@college.edu,student,Computer Science,BSc CS A",
      "Meera Thomas,meera.thomas@college.edu,teacher,Computer Science,",
      "Vinod Kumar,vinod.kumar@college.edu,evaluator,Evaluation Cell,"
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "users-sample.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function parseRoleInput(role) {
    const normalized = normalizeText(role);

    if (normalized === "student") {
      return "student";
    }
    if (normalized === "teacher" || normalized === "class teacher") {
      return "teacher";
    }
    if (normalized === "evaluator" || normalized === "evaluation team") {
      return "evaluator";
    }
    if (normalized === "hod" || normalized === "hod / iqac" || normalized === "iqac") {
      return "hod";
    }
    if (normalized === "admin") {
      return "admin";
    }

    return "";
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  window.adminUserManagementModule = {
    renderUserManagementPage: renderUserManagementPage,
    handleClick: handleClick,
    handleSubmit: handleSubmit,
    handleChange: handleChange,
    handleInput: handleInput
  };
})();
