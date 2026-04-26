const roleConfig = {
  student: {
    label: "Student",
    heading: "Student Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "DB" },
      { page: "submit", label: "Submit Activity", icon: "SA" },
      { page: "submissions", label: "My Submissions", icon: "MS" }
    ]
  },
  teacher: {
    label: "Class Teacher",
    heading: "Teacher Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "DB" },
      { page: "verification", label: "Verification", icon: "VR" }
    ]
  },
  evaluator: {
    label: "Evaluator",
    heading: "Evaluation Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "DB" },
      { page: "evaluation", label: "Evaluation", icon: "EV" }
    ]
  },
  admin: {
    label: "Admin",
    heading: "Admin Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "DB" },
      { page: "criteria", label: "Criteria Management", icon: "CM" }
    ]
  },
  hod: {
    label: "HOD / IQAC",
    heading: "HOD / IQAC Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "DB" },
      { page: "reports", label: "Reports", icon: "RP" }
    ]
  }
};

const academicYears = ["2025-2026", "2024-2025", "2023-2024"];

const evaluatorDepartmentRules = [
  { match: "bsc cs", department: "Computer Science" },
  { match: "bcom", department: "Commerce" },
  { match: "ba english", department: "English" }
];

const students = [
  { id: 1, name: "Anika Sharma", className: "BSc CS A" },
  { id: 2, name: "Rahul Menon", className: "BSc CS A" },
  { id: 3, name: "Sara Joseph", className: "BCom B" },
  { id: 4, name: "Arjun Das", className: "BCom B" },
  { id: 5, name: "Nisha Iyer", className: "BA English C" },
  { id: 6, name: "Vikram Patel", className: "BA English C" }
];

let criteriaCatalog = cloneCriteriaCatalog(window.criteriaData || []);
let submissions = cloneSubmissions(window.seedSubmissions || []);

const state = {
  loggedIn: false,
  currentRole: "student",
  activePage: "dashboard",
  currentStudentId: 1,
  selectedAcademicYear: academicYears[0],
  evaluatorView: "departments",
  evaluatorDepartment: "",
  evaluatorStudentId: null,
  selectedSubmissionCategoryId: "",
  selectedSubmissionItemId: "",
  editingCriteriaItemId: null
};

const ui = {};
let pendingConfirmationAction = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  if (!criteriaCatalog.length) {
    criteriaCatalog = getDefaultCriteriaCatalog();
  }

  if (!submissions.length) {
    submissions = getDefaultSubmissions();
  }

  cacheElements();
  bindEvents();

  const firstCategory = criteriaCatalog[0];
  const firstItem = firstCategory && firstCategory.items && firstCategory.items[0];
  state.selectedSubmissionCategoryId = firstCategory ? firstCategory.id : "";
  state.selectedSubmissionItemId = firstItem ? firstItem.id : "";

  bootstrapComputedMarks();
  renderAuthState();
}

function cloneCriteriaCatalog(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((category, categoryIndex) => {
    const safeCategoryId = category.id || "cat-" + (categoryIndex + 1);
    const items = Array.isArray(category.items)
      ? category.items.map((item, itemIndex) => {
          return {
            id: Number(item.id) || Number(String(categoryIndex + 1) + String(itemIndex + 1)),
            category: String(item.category || category.category || "General"),
            title: String(item.title || "Untitled"),
            type: normalizeCriteriaType(item.type),
            marks: Number.isFinite(item.marks) ? item.marks : 0,
            rules: Array.isArray(item.rules)
              ? item.rules.map((rule) => {
                  return {
                    min: Number.isFinite(rule.min) ? rule.min : 0,
                    max: Number.isFinite(rule.max) ? rule.max : 100,
                    marks: Number.isFinite(rule.marks) ? rule.marks : 0
                  };
                })
              : []
          };
        })
      : [];

    return {
      id: safeCategoryId,
      category: String(category.category || "General"),
      items: items
    };
  });
}

function cloneSubmissions(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((submission, index) => {
    return {
      id: Number(submission.id) || index + 1,
      studentId: Number(submission.studentId) || 1,
      criteriaId: Number(submission.criteriaId) || 0,
      description: String(submission.description || ""),
      status: String(submission.status || "Pending"),
      remarks: String(submission.remarks || ""),
      marks: Number.isFinite(submission.marks) ? submission.marks : null,
      proof: String(submission.proof || "proof-file.pdf"),
      evaluatorVerified: Boolean(submission.evaluatorVerified),
      evidence: normalizeEvidence(submission.evidence)
    };
  });
}

function normalizeEvidence(evidence) {
  const safeEvidence = evidence && typeof evidence === "object" ? evidence : {};
  return {
    type: normalizeCriteriaType(safeEvidence.type),
    count: Number.isFinite(safeEvidence.count) ? safeEvidence.count : null,
    value: Number.isFinite(safeEvidence.value) ? safeEvidence.value : null,
    checked: Boolean(safeEvidence.checked)
  };
}

function normalizeCriteriaType(type) {
  const normalized = String(type || "fixed").toLowerCase();
  if (normalized === "count") {
    return "count";
  }
  if (normalized === "range") {
    return "range";
  }
  if (normalized === "boolean") {
    return "boolean";
  }
  return "fixed";
}

function cacheElements() {
  ui.loginScreen = document.getElementById("login-screen");
  ui.loginForm = document.getElementById("login-form");
  ui.loginRole = document.getElementById("login-role");
  ui.appShell = document.getElementById("app-shell");
  ui.sidebar = document.getElementById("sidebar");
  ui.sidebarNav = document.getElementById("sidebar-nav");
  ui.sidebarRoleLabel = document.getElementById("sidebar-role-label");
  ui.menuToggle = document.getElementById("menu-toggle");
  ui.logoutBtn = document.getElementById("logout-btn");
  ui.topbarHeading = document.getElementById("topbar-heading");
  ui.topbarSubheading = document.getElementById("topbar-subheading");
  ui.topbarRoleBadge = document.getElementById("topbar-role-badge");
  ui.pageContent = document.getElementById("page-content");
  ui.toastContainer = document.getElementById("toast-container");

  ui.confirmModal = document.getElementById("confirm-modal");
  ui.confirmTitle = document.getElementById("confirm-title");
  ui.confirmMessage = document.getElementById("confirm-message");
  ui.confirmCancel = document.getElementById("confirm-cancel");
  ui.confirmAccept = document.getElementById("confirm-accept");
}

function bindEvents() {
  ui.loginForm.addEventListener("submit", handleLogin);
  ui.logoutBtn.addEventListener("click", handleLogout);

  ui.menuToggle.addEventListener("click", () => {
    ui.sidebar.classList.toggle("open");
  });

  ui.sidebarNav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button) {
      return;
    }

    setActiveMenu(button.dataset.page);
    renderSidebar();
    renderTopbar();
    renderPage();
    ui.sidebar.classList.remove("open");
  });

  ui.pageContent.addEventListener("click", handlePageClick);
  ui.pageContent.addEventListener("submit", handlePageSubmit);
  ui.pageContent.addEventListener("change", handlePageChange);

  ui.confirmCancel.addEventListener("click", closeConfirmModal);
  ui.confirmAccept.addEventListener("click", () => {
    if (typeof pendingConfirmationAction === "function") {
      pendingConfirmationAction();
    }
    closeConfirmModal();
  });

  ui.confirmModal.addEventListener("click", (event) => {
    if (event.target === ui.confirmModal) {
      closeConfirmModal();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      ui.sidebar.classList.remove("open");
    }
  });
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(ui.loginForm);
  const role = String(formData.get("role") || "student");

  state.loggedIn = true;
  state.currentRole = role;
  state.activePage = getRoleMenu(role)[0].page;
  state.editingCriteriaItemId = null;
  resetEvaluatorFlow();

  renderAuthState();
  showToast("Welcome, " + roleConfig[role].label + ".", "success");
}

function handleLogout() {
  state.loggedIn = false;
  state.currentRole = "student";
  state.activePage = "dashboard";
  state.editingCriteriaItemId = null;
  resetEvaluatorFlow();
  ui.sidebar.classList.remove("open");
  closeConfirmModal();

  renderAuthState();
  showToast("Logged out successfully.", "info");
}

function renderAuthState() {
  if (!state.loggedIn) {
    ui.loginScreen.classList.remove("hidden");
    ui.appShell.classList.add("hidden");
    return;
  }

  ui.loginScreen.classList.add("hidden");
  ui.appShell.classList.remove("hidden");

  renderSidebar();
  renderTopbar();
  renderPage();
}

function getRoleMenu(role) {
  return roleConfig[role] ? roleConfig[role].menu : roleConfig.student.menu;
}

function setActiveMenu(page) {
  const menu = getRoleMenu(state.currentRole);
  const found = menu.find((item) => item.page === page);
  state.activePage = found ? found.page : menu[0].page;
}

function renderSidebar() {
  const roleMeta = roleConfig[state.currentRole];
  const navItems = getRoleMenu(state.currentRole);

  ui.sidebarRoleLabel.textContent = roleMeta.label;

  ui.sidebarNav.innerHTML = navItems
    .map((item) => {
      const activeClass = item.page === state.activePage ? "active" : "";
      return (
        "<li>" +
        "<button type=\"button\" class=\"nav-item " + activeClass + "\" data-page=\"" + item.page + "\">" +
        "<span class=\"nav-icon\">" + escapeHtml(item.icon) + "</span>" +
        "<span>" + escapeHtml(item.label) + "</span>" +
        "</button>" +
        "</li>"
      );
    })
    .join("");
}

function renderTopbar() {
  const roleMeta = roleConfig[state.currentRole];
  const menuItem = getRoleMenu(state.currentRole).find((item) => item.page === state.activePage);
  const pageTitle = menuItem ? menuItem.label : roleMeta.heading;

  ui.topbarHeading.textContent = pageTitle;
  ui.topbarSubheading.textContent = getTopbarSubheading();
  ui.topbarRoleBadge.textContent = roleMeta.label;
  ui.topbarRoleBadge.className = "role-badge role-" + state.currentRole;
}

function getTopbarSubheading() {
  if (state.currentRole === "evaluator" && state.activePage === "evaluation") {
    if (state.evaluatorView === "students") {
      return "Department: " + state.evaluatorDepartment;
    }
    if (state.evaluatorView === "details") {
      const student = getStudentById(state.evaluatorStudentId);
      return student ? "Evaluating " + student.name : "Student details";
    }
    return "Select a department to begin";
  }

  return "Academic Year " + state.selectedAcademicYear;
}

function renderPage() {
  let content = "";

  if (state.currentRole === "student") {
    if (state.activePage === "submit") {
      content = renderStudentSubmitPage();
    } else if (state.activePage === "submissions") {
      content = renderStudentSubmissionsPage();
    } else {
      content = renderStudentDashboard();
    }
  } else if (state.currentRole === "teacher") {
    content = state.activePage === "verification" ? renderTeacherVerificationPage() : renderTeacherDashboard();
  } else if (state.currentRole === "evaluator") {
    content = state.activePage === "evaluation" ? renderEvaluatorEvaluationPage() : renderEvaluatorDashboard();
  } else if (state.currentRole === "admin") {
    content = state.activePage === "criteria" ? renderAdminCriteriaPage() : renderAdminDashboard();
  } else {
    content = state.activePage === "reports" ? renderHodReportsPage() : renderHodDashboard();
  }

  ui.pageContent.innerHTML = "<div class=\"page-stack\">" + content + "</div>";
}

function renderDashboardCards(metrics) {
  const cards = [
    { label: "Total Submissions", value: metrics.total },
    { label: "Approved", value: metrics.approved },
    { label: "Pending", value: metrics.pending },
    { label: "Total Score", value: metrics.score.toFixed(1) }
  ];

  return (
    "<section class=\"cards-grid stats-grid\">" +
    cards
      .map((card) => {
        return (
          "<article class=\"stat-card\">" +
          "<p>" + escapeHtml(card.label) + "</p>" +
          "<h3>" + escapeHtml(card.value) + "</h3>" +
          "</article>"
        );
      })
      .join("") +
    "</section>"
  );
}

function renderStatusProgress(title, counts) {
  const total = Math.max(1, counts.total);
  const rows = [
    { key: "Approved", value: counts.approved },
    { key: "Pending", value: counts.pending },
    { key: "Rejected", value: counts.rejected },
    { key: "Correction", value: counts.correction }
  ];

  return (
    "<section class=\"chart-card\">" +
    "<h3>" + escapeHtml(title) + "</h3>" +
    "<div class=\"progress-list\">" +
    rows
      .map((row) => {
        const percent = (row.value / total) * 100;
        return (
          "<div class=\"progress-row\">" +
          "<div class=\"progress-meta\"><span>" + escapeHtml(row.key) + "</span><span>" + row.value + "</span></div>" +
          "<div class=\"progress-track\"><div class=\"progress-fill\" style=\"width:" + percent.toFixed(1) + "%\"></div></div>" +
          "</div>"
        );
      })
      .join("") +
    "</div>" +
    "</section>"
  );
}

function renderStudentDashboard() {
  const studentSubmissions = submissions.filter((item) => item.studentId === state.currentStudentId);
  const metrics = buildSummaryMetrics(studentSubmissions);

  return (
    "<section class=\"section-header\">" +
    "<div><h1>Student Dashboard</h1><p class=\"muted\">Track your performance and submission status.</p></div>" +
    "</section>" +
    renderDashboardCards(metrics) +
    renderStatusProgress("Submission Distribution", metrics) +
    "<section class=\"panel\">" +
    "<div class=\"panel-head\"><h3>Quick Actions</h3></div>" +
    "<div class=\"button-row\">" +
    "<button type=\"button\" class=\"btn primary\" data-page-jump=\"submit\">Submit New Activity</button>" +
    "<button type=\"button\" class=\"btn ghost\" data-page-jump=\"submissions\">View My Submissions</button>" +
    "</div>" +
    "</section>"
  );
}

function renderStudentSubmitPage() {
  const categories = getCriteriaCategories();
  if (!categories.length) {
    return (
      "<section class=\"section-header\">" +
      "<div><h1>Submit Activity</h1><p class=\"muted\">Add proof and details for teacher verification.</p></div>" +
      "</section><section class=\"panel\"><p class=\"empty-state\">No criteria available. Please contact admin.</p></section>"
    );
  }

  if (!state.selectedSubmissionCategoryId || !getCategoryById(state.selectedSubmissionCategoryId)) {
    state.selectedSubmissionCategoryId = categories[0].id;
  }

  const selectedCategory = getCategoryById(state.selectedSubmissionCategoryId) || categories[0];
  const categoryItems = selectedCategory.items || [];
  if (!state.selectedSubmissionItemId || !getCriteriaById(state.selectedSubmissionItemId)) {
    state.selectedSubmissionItemId = categoryItems[0] ? categoryItems[0].id : "";
  }

  const selectedItem = getCriteriaById(state.selectedSubmissionItemId);

  const categoryOptions = categories
    .map((category) => {
      const selected = category.id === state.selectedSubmissionCategoryId ? " selected" : "";
      return "<option value=\"" + category.id + "\"" + selected + ">" + escapeHtml(category.category) + "</option>";
    })
    .join("");

  const itemOptions = categoryItems
    .map((item) => {
      const selected = item.id === state.selectedSubmissionItemId ? " selected" : "";
      return "<option value=\"" + item.id + "\"" + selected + ">" + escapeHtml(item.title) + " (" + escapeHtml(getCriteriaTypeLabel(item.type)) + ")</option>";
    })
    .join("");

  const dynamicInput = selectedItem ? renderStudentEvidenceInput(selectedItem) : "";

  return (
    "<section class=\"section-header\">" +
    "<div><h1>Submit Activity</h1><p class=\"muted\">Select category and item to submit activity evidence.</p></div>" +
    "</section>" +
    "<section class=\"panel\">" +
    "<form id=\"student-submission-form\" class=\"stack-form two-col\">" +
    "<div class=\"field\"><label for=\"submission-category\">Category</label><select id=\"submission-category\" name=\"categoryId\" required>" + categoryOptions + "</select></div>" +
    "<div class=\"field\"><label for=\"submission-criteria\">Item</label><select id=\"submission-criteria\" name=\"criteriaId\" required>" + itemOptions + "</select></div>" +
    dynamicInput +
    "<div class=\"field\"><label for=\"submission-proof\">Upload Proof</label><input id=\"submission-proof\" name=\"proof\" type=\"file\" required /></div>" +
    "<div class=\"field full-span\"><label for=\"submission-description\">Description</label><textarea id=\"submission-description\" name=\"description\" placeholder=\"Describe the activity\" required></textarea></div>" +
    "<div class=\"button-row full-span\"><button type=\"submit\" class=\"btn primary\">Submit</button></div>" +
    "</form>" +
    "</section>"
  );
}

function renderStudentEvidenceInput(criteriaItem) {
  if (criteriaItem.type === "count") {
    return "<div class=\"field\"><label for=\"submission-count\">Count</label><input id=\"submission-count\" name=\"countValue\" type=\"number\" min=\"1\" step=\"1\" required /><p class=\"muted\">Marks = count x " + criteriaItem.marks + "</p></div>";
  }

  if (criteriaItem.type === "range") {
    const rangeText = (criteriaItem.rules || [])
      .map((rule) => {
        return rule.min + "-" + rule.max + ": " + rule.marks;
      })
      .join(" | ");

    return "<div class=\"field\"><label for=\"submission-range\">Percentage / Value</label><input id=\"submission-range\" name=\"rangeValue\" type=\"number\" min=\"0\" max=\"100\" step=\"0.01\" required /><p class=\"muted\">Ranges: " + escapeHtml(rangeText) + "</p></div>";
  }

  if (criteriaItem.type === "boolean") {
    return "<div class=\"field\"><label for=\"submission-boolean\">Eligibility</label><select id=\"submission-boolean\" name=\"booleanValue\" required><option value=\"yes\">Yes</option><option value=\"no\">No</option></select><p class=\"muted\">Marks awarded only when set to Yes.</p></div>";
  }

  return "<div class=\"field\"><label>Marks Rule</label><input type=\"text\" value=\"Fixed marks: " + criteriaItem.marks + "\" readonly /></div>";
}

function renderStudentSubmissionsPage() {
  const mySubmissions = submissions
    .filter((item) => item.studentId === state.currentStudentId)
    .sort((a, b) => b.id - a.id);

  const rows = mySubmissions.length
    ? mySubmissions
        .map((item) => {
          const criteriaItem = getCriteriaById(item.criteriaId);
          const preview = calculateMarksByRule(item, criteriaItem);
          return (
            "<tr>" +
            "<td>" + escapeHtml(getCriteriaCategoryLabel(criteriaItem)) + "</td>" +
            "<td>" + escapeHtml(criteriaItem ? criteriaItem.title : "Removed Item") + "</td>" +
            "<td>" + escapeHtml(item.description) + "</td>" +
            "<td><span class=\"status-pill " + getStatusClass(item.status) + "\">" + escapeHtml(item.status) + "</span></td>" +
            "<td>" + preview.toFixed(1) + "</td>" +
            "<td>" + (Number.isFinite(item.marks) ? item.marks : "-") + "</td>" +
            "</tr>"
          );
        })
        .join("")
    : "<tr><td colspan=\"6\" class=\"empty-row\">No submissions yet</td></tr>";

  return (
    "<section class=\"section-header\">" +
    "<div><h1>My Submissions</h1><p class=\"muted\">Live status of all activities you submitted.</p></div>" +
    "</section>" +
    "<section class=\"panel\">" +
    "<div class=\"table-wrap\">" +
    "<table><thead><tr><th>Category</th><th>Item</th><th>Description</th><th>Status</th><th>Rule Marks</th><th>Final Marks</th></tr></thead><tbody>" + rows + "</tbody></table>" +
    "</div>" +
    "</section>"
  );
}

function renderTeacherDashboard() {
  const metrics = buildSummaryMetrics(submissions);

  return (
    "<section class=\"section-header\">" +
    "<div><h1>Teacher Dashboard</h1><p class=\"muted\">Monitor queue and move submissions through verification.</p></div>" +
    "</section>" +
    renderDashboardCards(metrics) +
    renderStatusProgress("Verification Queue", metrics) +
    "<section class=\"panel\">" +
    "<div class=\"button-row\">" +
    "<button type=\"button\" class=\"btn primary\" data-page-jump=\"verification\">Open Verification Desk</button>" +
    "</div>" +
    "</section>"
  );
}

function renderTeacherVerificationPage() {
  const reviewQueue = [...submissions].sort((a, b) => b.id - a.id);

  const cards = reviewQueue.length
    ? reviewQueue
        .map((item) => {
          const student = getStudentById(item.studentId);
          const criteriaItem = getCriteriaById(item.criteriaId);
          const previewMarks = calculateMarksByRule(item, criteriaItem);

          return (
            "<article class=\"submission-card\">" +
            "<div class=\"submission-head\"><h4>" + escapeHtml(student ? student.name : "Unknown Student") + "</h4><span class=\"status-pill " + getStatusClass(item.status) + "\">" + escapeHtml(item.status) + "</span></div>" +
            "<div class=\"meta-list\">" +
            "<p><strong>Class:</strong> " + escapeHtml(student ? student.className : "-") + "</p>" +
            "<p><strong>Category:</strong> " + escapeHtml(getCriteriaCategoryLabel(criteriaItem)) + "</p>" +
            "<p><strong>Item:</strong> " + escapeHtml(criteriaItem ? criteriaItem.title : "Removed Item") + "</p>" +
            "<p><strong>Rule Type:</strong> " + escapeHtml(getCriteriaTypeLabel(criteriaItem ? criteriaItem.type : "fixed")) + "</p>" +
            "<p><strong>Rule Marks Preview:</strong> " + previewMarks.toFixed(1) + "</p>" +
            "<p><strong>Description:</strong> " + escapeHtml(item.description) + "</p>" +
            "<p><strong>Proof:</strong> " + escapeHtml(item.proof || "-") + "</p>" +
            "</div>" +
            "<div class=\"field\"><label>Teacher Remark</label><input type=\"text\" data-remark-input=\"" + item.id + "\" value=\"" + escapeAttribute(item.remarks || "") + "\" placeholder=\"Add a remark\" /></div>" +
            "<div class=\"button-row\">" +
            "<button type=\"button\" class=\"btn success\" data-teacher-action=\"Approved\" data-id=\"" + item.id + "\">Approve</button>" +
            "<button type=\"button\" class=\"btn danger\" data-teacher-action=\"Rejected\" data-id=\"" + item.id + "\">Reject</button>" +
            "<button type=\"button\" class=\"btn warn\" data-teacher-action=\"Correction Requested\" data-id=\"" + item.id + "\">Request Correction</button>" +
            "</div>" +
            "</article>"
          );
        })
        .join("")
    : "<div class=\"panel\"><p class=\"empty-state\">No submissions yet</p></div>";

  return (
    "<section class=\"section-header\">" +
    "<div><h1>Verification</h1><p class=\"muted\">Approve, reject, or request corrections with remarks.</p></div>" +
    "</section>" +
    "<section class=\"submission-grid\">" + cards + "</section>"
  );
}

function renderEvaluatorDashboard() {
  const approved = submissions.filter((item) => item.status === "Approved");
  const verified = approved.filter((item) => Boolean(item.evaluatorVerified));
  const pendingVerification = approved.length - verified.length;

  const metrics = {
    total: approved.length,
    approved: verified.length,
    pending: pendingVerification,
    rejected: 0,
    correction: 0,
    score: approved.reduce((sum, item) => sum + safeMark(getSubmissionEffectiveMarks(item)), 0)
  };

  return (
    "<section class=\"section-header\">" +
    "<div><h1>Evaluator Dashboard</h1><p class=\"muted\">Review approved submissions and finalize marks.</p></div>" +
    "</section>" +
    renderDashboardCards(metrics) +
    renderStatusProgress("Verification Progress", {
      total: metrics.total,
      approved: metrics.approved,
      pending: metrics.pending,
      rejected: 0,
      correction: 0
    }) +
    "<section class=\"panel\"><div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-page-jump=\"evaluation\">Go to Evaluation</button></div></section>"
  );
}

function renderEvaluatorEvaluationPage() {
  if (state.evaluatorView === "students") {
    return renderEvaluatorStudentsView();
  }
  if (state.evaluatorView === "details") {
    return renderEvaluatorStudentDetailsView();
  }
  return renderEvaluatorDepartmentsView();
}

function renderEvaluatorDepartmentsView() {
  const summaryMap = new Map();

  students.forEach((student) => {
    const departmentName = getDepartmentByClassName(student.className);
    const bucket = summaryMap.get(departmentName) || {
      departmentName: departmentName,
      studentCount: 0,
      readyCount: 0
    };

    bucket.studentCount += 1;
    if (getApprovedSubmissionsByStudent(student.id).length > 0) {
      bucket.readyCount += 1;
    }

    summaryMap.set(departmentName, bucket);
  });

  const cards = Array.from(summaryMap.values())
    .sort((a, b) => a.departmentName.localeCompare(b.departmentName))
    .map((item) => {
      return (
        "<article class=\"department-card flex-row\">" +
        "<div class=\"dept-col dept-name\">" + escapeHtml(item.departmentName) + "</div>" +
        "<div class=\"dept-col dept-stats\">" + item.studentCount + " students | " + item.readyCount + " ready</div>" +
        "<div class=\"dept-col dept-action\"><button type=\"button\" class=\"btn primary\" data-evaluator-department=\"" + escapeAttribute(item.departmentName) + "\">Select</button></div>" +
        "</article>"
      );
    })
    .join("");

  return (
    "<section class=\"section-header\"><div><h1>Evaluation</h1><p class=\"muted\">Step 1: Choose a department.</p></div></section>" +
    "<section class=\"department-grid\">" + cards + "</section>"
  );
}

function renderEvaluatorStudentsView() {
  const departmentStudents = students
    .filter((student) => getDepartmentByClassName(student.className) === state.evaluatorDepartment)
    .sort((a, b) => a.name.localeCompare(b.name));

  const rows = departmentStudents.length
    ? departmentStudents
        .map((student) => {
          const approvedItems = getApprovedSubmissionsByStudent(student.id);
          const totalMarks = approvedItems.reduce((sum, item) => sum + safeMark(getSubmissionEffectiveMarks(item)), 0);
          return (
            "<tr>" +
            "<td>" + escapeHtml(student.name) + "</td>" +
            "<td>" + escapeHtml(student.className) + "</td>" +
            "<td>" + approvedItems.length + "</td>" +
            "<td>" + totalMarks.toFixed(1) + "</td>" +
            "<td><button type=\"button\" class=\"btn ghost\" data-evaluator-student=\"" + student.id + "\">View Details</button></td>" +
            "</tr>"
          );
        })
        .join("")
    : "<tr><td colspan=\"5\" class=\"empty-row\">No submissions yet</td></tr>";

  return (
    "<section class=\"section-header\">" +
    "<div><h1>" + escapeHtml(state.evaluatorDepartment) + "</h1><p class=\"muted\">Step 2: Select a student.</p></div>" +
    "<button type=\"button\" class=\"btn ghost\" data-evaluator-back=\"departments\">Back</button>" +
    "</section>" +
    "<section class=\"panel\"><div class=\"table-wrap\"><table><thead><tr><th>Student</th><th>Class</th><th>Approved</th><th>Total Marks</th><th>Action</th></tr></thead><tbody>" + rows + "</tbody></table></div></section>"
  );
}

function renderEvaluatorStudentDetailsView() {
  const student = getStudentById(state.evaluatorStudentId);
  if (!student) {
    state.evaluatorView = "students";
    return renderEvaluatorStudentsView();
  }

  const studentSubmissions = getApprovedSubmissionsByStudent(student.id).sort((a, b) => b.id - a.id);

  const cards = studentSubmissions.length
    ? studentSubmissions
        .map((item) => {
          const criteriaItem = getCriteriaById(item.criteriaId);
          const suggestedMarks = calculateMarksByRule(item, criteriaItem);
          const currentMarks = Number.isFinite(item.marks) ? item.marks : suggestedMarks;
          const minMarks = getCriteriaMinMarks(criteriaItem);
          const maxMarks = getCriteriaMaxMarks(criteriaItem, item);
          const verified = Boolean(item.evaluatorVerified);

          return (
            "<article class=\"submission-card\">" +
            "<div class=\"submission-head\"><h4>" + escapeHtml(criteriaItem ? criteriaItem.title : "Removed Item") + "</h4><span class=\"status-pill " + (verified ? "status-approved" : "status-pending") + "\">" + (verified ? "Verified" : "Pending Verification") + "</span></div>" +
            "<div class=\"meta-list\">" +
            "<p><strong>Category:</strong> " + escapeHtml(getCriteriaCategoryLabel(criteriaItem)) + "</p>" +
            "<p><strong>Rule Type:</strong> " + escapeHtml(getCriteriaTypeLabel(criteriaItem ? criteriaItem.type : "fixed")) + "</p>" +
            "<p><strong>Description:</strong> " + escapeHtml(item.description) + "</p>" +
            "<p><strong>Proof:</strong> " + escapeHtml(item.proof || "-") + "</p>" +
            "<p><strong>Teacher Remark:</strong> " + escapeHtml(item.remarks || "-") + "</p>" +
            "<p><strong>Auto Marks:</strong> " + suggestedMarks.toFixed(1) + "</p>" +
            "</div>" +
            "<div class=\"button-row\">" +
            "<button type=\"button\" class=\"btn " + (verified ? "ghost" : "success") + "\" data-evaluator-verify=\"" + item.id + "\">" + (verified ? "Verified" : "Verify Details") + "</button>" +
            "<button type=\"button\" class=\"btn ghost\" data-use-auto=\"" + item.id + "\">Use Auto</button>" +
            "</div>" +
            "<form class=\"stack-form\" data-mark-form=\"" + item.id + "\">" +
            "<div class=\"field\"><label>Enter Marks (Manual Override Allowed)</label><input name=\"marks\" type=\"number\" min=\"" + minMarks + "\" max=\"" + maxMarks + "\" step=\"0.5\" required value=\"" + currentMarks + "\" /></div>" +
            "<button type=\"submit\" class=\"btn primary\">Save Marks</button>" +
            "</form>" +
            "</article>"
          );
        })
        .join("")
    : "<div class=\"panel\"><p class=\"empty-state\">No submissions yet</p></div>";

  return (
    "<section class=\"section-header\">" +
    "<div><h1>" + escapeHtml(student.name) + "</h1><p class=\"muted\">Step 3: Verify details and save marks.</p></div>" +
    "<button type=\"button\" class=\"btn ghost\" data-evaluator-back=\"students\">Back</button>" +
    "</section>" +
    "<section class=\"submission-grid\">" + cards + "</section>"
  );
}

function renderAdminDashboard() {
  const metrics = buildSummaryMetrics(submissions);
  return (
    "<section class=\"section-header\"><div><h1>Admin Dashboard</h1><p class=\"muted\">Overview of criteria, submissions, and yearly setup.</p></div></section>" +
    renderDashboardCards(metrics) +
    "<section class=\"chart-card\"><h3>System Snapshot</h3><div class=\"meta-list\"><p><strong>Total Categories:</strong> " + criteriaCatalog.length + "</p><p><strong>Total Criteria Items:</strong> " + getAllCriteriaItems().length + "</p><p><strong>Academic Year:</strong> " + escapeHtml(state.selectedAcademicYear) + "</p></div></section>"
  );
}

function renderAdminCriteriaPage() {
  const categories = getCriteriaCategories();
  const editingItem = state.editingCriteriaItemId ? getCriteriaById(state.editingCriteriaItemId) : null;

  const yearOptions = academicYears
    .map((year) => {
      const selected = year === state.selectedAcademicYear ? " selected" : "";
      return "<option value=\"" + year + "\"" + selected + ">" + year + "</option>";
    })
    .join("");

  const categoryOptions = categories
    .map((category) => {
      const selected = editingItem && category.category === editingItem.category ? " selected" : "";
      return "<option value=\"" + category.id + "\"" + selected + ">" + escapeHtml(category.category) + "</option>";
    })
    .join("");

  const fixedSelected = !editingItem || editingItem.type === "fixed" ? " selected" : "";
  const countSelected = editingItem && editingItem.type === "count" ? " selected" : "";
  const rangeSelected = editingItem && editingItem.type === "range" ? " selected" : "";
  const booleanSelected = editingItem && editingItem.type === "boolean" ? " selected" : "";

  const groupedRows = categories
    .map((category) => {
      const itemRows = (category.items || []).length
        ? category.items
            .map((item) => {
              return (
                "<tr>" +
                "<td>" + escapeHtml(category.category) + "</td>" +
                "<td>" + escapeHtml(item.title) + "</td>" +
                "<td>" + escapeHtml(getCriteriaTypeLabel(item.type)) + "</td>" +
                "<td>" + escapeHtml(getCriteriaRuleSummary(item)) + "</td>" +
                "<td><div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-item-edit=\"" + item.id + "\">Edit</button><button type=\"button\" class=\"btn danger\" data-item-delete=\"" + item.id + "\">Delete</button></div></td>" +
                "</tr>"
              );
            })
            .join("")
        : "<tr><td>" + escapeHtml(category.category) + "</td><td colspan=\"4\" class=\"empty-row\">No items in this category.</td></tr>";
      return itemRows;
    })
    .join("");

  return (
    "<section class=\"section-header\"><div><h1>Criteria Management</h1><p class=\"muted\">Add categories, add criteria items, and update marks/rules.</p></div></section>" +
    "<section class=\"cards-grid two-panel-grid\">" +
    "<article class=\"panel\"><h3>Academic Year</h3><div class=\"field\"><label for=\"academic-year-select\">Select Session</label><select id=\"academic-year-select\">" + yearOptions + "</select></div>" +
    "<hr /><h3>Add Category</h3><form id=\"category-form\" class=\"stack-form\"><div class=\"field\"><label for=\"category-title\">Category Name</label><input id=\"category-title\" name=\"categoryTitle\" type=\"text\" required /></div><div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">Add Category</button></div></form></article>" +
    "<article class=\"panel\"><h3>" + (editingItem ? "Edit Criteria Item" : "Add Criteria Item") + "</h3>" +
    "<form id=\"criteria-item-form\" class=\"stack-form\" data-editing-item=\"" + (editingItem ? editingItem.id : "") + "\">" +
    "<div class=\"field\"><label for=\"criteria-item-category\">Category</label><select id=\"criteria-item-category\" name=\"categoryId\" required>" + categoryOptions + "</select></div>" +
    "<div class=\"field\"><label for=\"criteria-item-title\">Title</label><input id=\"criteria-item-title\" name=\"title\" type=\"text\" required value=\"" + escapeAttribute(editingItem ? editingItem.title : "") + "\" /></div>" +
    "<div class=\"field\"><label for=\"criteria-item-type\">Type</label><select id=\"criteria-item-type\" name=\"type\"><option value=\"fixed\"" + fixedSelected + ">Fixed Value</option><option value=\"count\"" + countSelected + ">Multiple Count</option><option value=\"range\"" + rangeSelected + ">Range Based</option><option value=\"boolean\"" + booleanSelected + ">Boolean</option></select></div>" +
    "<div class=\"field\"><label for=\"criteria-item-marks\">Marks (for fixed/count/boolean)</label><input id=\"criteria-item-marks\" name=\"marks\" type=\"number\" step=\"0.5\" value=\"" + (editingItem && Number.isFinite(editingItem.marks) ? editingItem.marks : "") + "\" /></div>" +
    "<div class=\"field\"><label for=\"criteria-item-rules\">Range Rules (for range type)</label><textarea id=\"criteria-item-rules\" name=\"rules\" placeholder=\"90-100:5, 80-89.99:4\">" + escapeHtml(editingItem ? formatRulesText(editingItem.rules || []) : "") + "</textarea></div>" +
    "<div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">" + (editingItem ? "Update Item" : "Add Item") + "</button><button type=\"button\" id=\"cancel-item-edit\" class=\"btn ghost " + (editingItem ? "" : "hidden") + "\">Cancel</button></div>" +
    "</form></article></section>" +
    "<section class=\"panel\"><h3>Criteria by Category</h3><div class=\"table-wrap\"><table><thead><tr><th>Category</th><th>Item</th><th>Type</th><th>Marks / Rules</th><th>Actions</th></tr></thead><tbody>" + groupedRows + "</tbody></table></div></section>"
  );
}

function renderHodDashboard() {
  const performance = buildClassPerformance();
  const metrics = {
    total: submissions.length,
    approved: submissions.filter((item) => item.status === "Approved").length,
    pending: submissions.filter((item) => item.status === "Pending").length,
    rejected: submissions.filter((item) => item.status === "Rejected").length,
    correction: submissions.filter((item) => String(item.status).toLowerCase().indexOf("correction") > -1).length,
    score: performance.reduce((sum, item) => sum + item.totalScore, 0)
  };

  return (
    "<section class=\"section-header\"><div><h1>HOD / IQAC Dashboard</h1><p class=\"muted\">Institution-level performance overview.</p></div></section>" +
    renderDashboardCards(metrics) +
    renderStatusProgress("Institution Submission Health", metrics)
  );
}

function renderHodReportsPage() {
  const ranked = buildClassPerformance().sort((a, b) => {
    if (b.totalScore === a.totalScore) {
      return b.normalizedScore - a.normalizedScore;
    }
    return b.totalScore - a.totalScore;
  });

  const maxScore = Math.max(1, ...ranked.map((item) => item.totalScore));

  const leaderboardRows = ranked
    .map((entry, index) => {
      const topClass = index === 0 ? "top-1" : index === 1 ? "top-2" : index === 2 ? "top-3" : "";
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "#" + (index + 1);
      const width = (entry.totalScore / maxScore) * 100;
      return (
        "<article class=\"leaderboard-row " + topClass + "\">" +
        "<div class=\"leaderboard-rank\">" + medal + "</div>" +
        "<div class=\"leaderboard-main\">" +
        "<h4>" + escapeHtml(entry.className) + " <span class=\"grade-badge " + getGradeClass(entry.grade) + "\">" + escapeHtml(entry.grade) + "</span></h4>" +
        "<div class=\"progress-track\"><div class=\"progress-fill\" style=\"width:" + width.toFixed(1) + "%\"></div></div>" +
        "</div>" +
        "<div class=\"leaderboard-metric\"><p><strong>Total:</strong> " + entry.totalScore.toFixed(1) + "</p><p><strong>Normalized:</strong> " + entry.normalizedScore.toFixed(1) + "</p></div>" +
        "</article>"
      );
    })
    .join("");

  const tableRows = ranked
    .map((entry) => {
      return (
        "<tr>" +
        "<td>" + escapeHtml(entry.className) + "</td>" +
        "<td>" + entry.totalScore.toFixed(1) + "</td>" +
        "<td>" + entry.normalizedScore.toFixed(1) + "</td>" +
        "<td>" + entry.percentile.toFixed(1) + "</td>" +
        "<td><span class=\"grade-badge " + getGradeClass(entry.grade) + "\">" + entry.grade + "</span></td>" +
        "</tr>"
      );
    })
    .join("");

  return (
    "<section class=\"section-header\"><div><h1>Reports</h1><p class=\"muted\">Leaderboard and class-wise academic performance.</p></div></section>" +
    "<section class=\"panel\"><h3>Class Leaderboard</h3><div class=\"leaderboard\">" + leaderboardRows + "</div></section>" +
    "<section class=\"panel\"><h3>Performance Table</h3><div class=\"table-wrap\"><table><thead><tr><th>Class</th><th>Total Score</th><th>Normalized</th><th>Percentile</th><th>Grade</th></tr></thead><tbody>" + tableRows + "</tbody></table></div></section>"
  );
}

function handlePageClick(event) {
  const pageJump = event.target.closest("button[data-page-jump]");
  if (pageJump) {
    setActiveMenu(pageJump.dataset.pageJump);
    renderSidebar();
    renderTopbar();
    renderPage();
    return;
  }

  const departmentButton = event.target.closest("button[data-evaluator-department]");
  if (departmentButton) {
    state.evaluatorDepartment = departmentButton.dataset.evaluatorDepartment || "";
    state.evaluatorStudentId = null;
    state.evaluatorView = "students";
    renderTopbar();
    renderPage();
    return;
  }

  const studentButton = event.target.closest("button[data-evaluator-student]");
  if (studentButton) {
    state.evaluatorStudentId = Number(studentButton.dataset.evaluatorStudent);
    state.evaluatorView = "details";
    renderTopbar();
    renderPage();
    return;
  }

  const evaluatorBackButton = event.target.closest("button[data-evaluator-back]");
  if (evaluatorBackButton) {
    const nextView = evaluatorBackButton.dataset.evaluatorBack;
    if (nextView === "departments") {
      resetEvaluatorFlow();
    } else {
      state.evaluatorView = "students";
      state.evaluatorStudentId = null;
    }
    renderTopbar();
    renderPage();
    return;
  }

  const verifyButton = event.target.closest("button[data-evaluator-verify]");
  if (verifyButton) {
    toggleEvaluatorVerification(Number(verifyButton.dataset.evaluatorVerify));
    return;
  }

  const useAutoButton = event.target.closest("button[data-use-auto]");
  if (useAutoButton) {
    const submissionId = Number(useAutoButton.dataset.useAuto);
    const submission = submissions.find((item) => item.id === submissionId);
    if (!submission) {
      showToast("Submission not found.", "error");
      return;
    }

    const autoMarks = calculateMarksByRule(submission, getCriteriaById(submission.criteriaId));
    submission.marks = autoMarks;
    renderPage();
    showToast("Auto marks applied: " + autoMarks.toFixed(1), "success");
    return;
  }

  const teacherActionButton = event.target.closest("button[data-teacher-action]");
  if (teacherActionButton) {
    const submissionId = Number(teacherActionButton.dataset.id);
    const nextStatus = teacherActionButton.dataset.teacherAction;

    openConfirmModal(
      "Confirm Action",
      "Mark submission #" + submissionId + " as " + nextStatus + "?",
      () => updateTeacherStatus(submissionId, nextStatus)
    );
    return;
  }

  const editItemButton = event.target.closest("button[data-item-edit]");
  if (editItemButton) {
    state.editingCriteriaItemId = Number(editItemButton.dataset.itemEdit);
    renderPage();
    return;
  }

  const deleteItemButton = event.target.closest("button[data-item-delete]");
  if (deleteItemButton) {
    const itemId = Number(deleteItemButton.dataset.itemDelete);
    openConfirmModal("Delete Criteria Item", "Are you sure you want to delete this criteria item?", () => {
      deleteCriteriaItem(itemId);
    });
    return;
  }

  const cancelItemEdit = event.target.closest("#cancel-item-edit");
  if (cancelItemEdit) {
    state.editingCriteriaItemId = null;
    renderPage();
    return;
  }
}

function handlePageSubmit(event) {
  const form = event.target;

  if (form.id === "student-submission-form") {
    event.preventDefault();
    submitStudentSubmission(form);
    return;
  }

  if (form.dataset.markForm) {
    event.preventDefault();
    saveEvaluatorMarks(form);
    return;
  }

  if (form.id === "category-form") {
    event.preventDefault();
    submitCategoryForm(form);
    return;
  }

  if (form.id === "criteria-item-form") {
    event.preventDefault();
    submitCriteriaItemForm(form);
  }
}

function handlePageChange(event) {
  const target = event.target;

  if (target.id === "academic-year-select") {
    state.selectedAcademicYear = target.value;
    renderTopbar();
    showToast("Academic year set to " + state.selectedAcademicYear + ".", "info");
    return;
  }

  if (target.id === "submission-category") {
    state.selectedSubmissionCategoryId = target.value;
    const category = getCategoryById(state.selectedSubmissionCategoryId);
    const firstItem = category && category.items && category.items[0] ? category.items[0] : null;
    state.selectedSubmissionItemId = firstItem ? firstItem.id : "";
    renderPage();
    return;
  }

  if (target.id === "submission-criteria") {
    state.selectedSubmissionItemId = Number(target.value);
    renderPage();
    return;
  }

  if (target.id === "criteria-item-type") {
    return;
  }
}

function submitStudentSubmission(form) {
  const formData = new FormData(form);
  const categoryId = String(formData.get("categoryId") || "").trim();
  const criteriaId = Number(formData.get("criteriaId"));
  const description = String(formData.get("description") || "").trim();

  const criteriaItem = getCriteriaById(criteriaId);
  const category = getCategoryById(categoryId);

  if (!criteriaItem || !category || !description) {
    showToast("Please select category, item, and description.", "error");
    return;
  }

  const evidence = {
    type: criteriaItem.type,
    count: null,
    value: null,
    checked: false
  };

  if (criteriaItem.type === "count") {
    const countValue = Number(formData.get("countValue"));
    if (!Number.isFinite(countValue) || countValue <= 0) {
      showToast("Please enter a valid count.", "error");
      return;
    }
    evidence.count = countValue;
  }

  if (criteriaItem.type === "range") {
    const rangeValue = Number(formData.get("rangeValue"));
    if (!Number.isFinite(rangeValue) || rangeValue < 0) {
      showToast("Please enter a valid percentage/value.", "error");
      return;
    }
    evidence.value = rangeValue;
  }

  if (criteriaItem.type === "boolean") {
    const boolValue = String(formData.get("booleanValue") || "no");
    evidence.checked = boolValue === "yes";
  }

  const proofFile = form.querySelector("input[name='proof']");
  const proofName = proofFile && proofFile.files && proofFile.files[0] ? proofFile.files[0].name : "proof-file.pdf";

  const nextId = submissions.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
  const newSubmission = {
    id: nextId,
    studentId: state.currentStudentId,
    criteriaId: criteriaId,
    description: description,
    status: "Pending",
    remarks: "",
    marks: null,
    proof: proofName,
    evaluatorVerified: false,
    evidence: evidence
  };

  submissions.unshift(newSubmission);
  bootstrapSingleSubmissionMarks(newSubmission);

  form.reset();
  showToast("Submission added successfully.", "success");
  renderPage();
}

function updateTeacherStatus(submissionId, nextStatus) {
  const submission = submissions.find((item) => item.id === submissionId);
  if (!submission) {
    showToast("Submission not found.", "error");
    return;
  }

  const remarkInput = ui.pageContent.querySelector("[data-remark-input='" + submissionId + "']");
  const remarkValue = remarkInput ? remarkInput.value.trim() : "";

  submission.status = nextStatus;
  submission.remarks = remarkValue;

  if (nextStatus !== "Approved") {
    submission.marks = null;
    submission.evaluatorVerified = false;
  }

  showToast("Submission " + submissionId + " marked as " + nextStatus + ".", "success");
  renderPage();
}

function saveEvaluatorMarks(form) {
  const submissionId = Number(form.dataset.markForm);
  const submission = submissions.find((item) => item.id === submissionId);

  if (!submission) {
    showToast("Submission not found.", "error");
    return;
  }

  const criteriaItem = getCriteriaById(submission.criteriaId);
  if (!criteriaItem) {
    showToast("Criteria item not found for this submission.", "error");
    return;
  }

  const marksInput = form.querySelector("input[name='marks']");
  const marks = Number(marksInput.value);

  if (!Number.isFinite(marks)) {
    showToast("Marks must be a valid number.", "error");
    return;
  }

  const min = getCriteriaMinMarks(criteriaItem);
  const max = getCriteriaMaxMarks(criteriaItem, submission);

  if (marks < min || marks > max) {
    showToast("Marks must be between " + min + " and " + max + ".", "error");
    return;
  }

  submission.marks = marks;
  showToast("Marks saved for submission " + submissionId + ".", "success");
  renderPage();
}

function toggleEvaluatorVerification(submissionId) {
  const submission = submissions.find((item) => item.id === submissionId);
  if (!submission) {
    showToast("Submission not found.", "error");
    return;
  }

  if (submission.status !== "Approved") {
    showToast("Only approved submissions can be verified.", "warning");
    return;
  }

  submission.evaluatorVerified = !Boolean(submission.evaluatorVerified);
  showToast(
    submission.evaluatorVerified
      ? "Submission " + submissionId + " verified by evaluator."
      : "Submission " + submissionId + " moved back to pending verification.",
    "success"
  );
  renderPage();
}

function submitCategoryForm(form) {
  const formData = new FormData(form);
  const categoryTitle = String(formData.get("categoryTitle") || "").trim();

  if (!categoryTitle) {
    showToast("Please enter a category name.", "error");
    return;
  }

  const duplicate = criteriaCatalog.some((category) => category.category.toLowerCase() === categoryTitle.toLowerCase());
  if (duplicate) {
    showToast("Category already exists.", "warning");
    return;
  }

  const nextId = "cat-" + Date.now();
  criteriaCatalog.push({
    id: nextId,
    category: categoryTitle,
    items: []
  });

  form.reset();
  showToast("Category added.", "success");
  renderPage();
}

function submitCriteriaItemForm(form) {
  const formData = new FormData(form);
  const categoryId = String(formData.get("categoryId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const type = normalizeCriteriaType(formData.get("type"));
  const marks = Number(formData.get("marks"));
  const rulesInput = String(formData.get("rules") || "").trim();

  if (!categoryId || !title) {
    showToast("Please select category and title.", "error");
    return;
  }

  const category = getCategoryById(categoryId);
  if (!category) {
    showToast("Category not found.", "error");
    return;
  }

  let parsedRules = [];
  if (type === "range") {
    parsedRules = parseRulesFromText(rulesInput);
    if (!parsedRules.length) {
      showToast("Enter valid range rules like 90-100:5, 80-89.99:4", "error");
      return;
    }
  }

  if (type !== "range" && !Number.isFinite(marks)) {
    showToast("Marks value is required for this type.", "error");
    return;
  }

  const editingId = Number(form.dataset.editingItem || state.editingCriteriaItemId || 0);
  if (editingId) {
    const targetItem = getCriteriaById(editingId);
    if (!targetItem) {
      showToast("Criteria item not found.", "error");
      return;
    }

    const currentCategory = getCategoryByItemId(editingId);
    if (currentCategory && currentCategory.id !== categoryId) {
      currentCategory.items = currentCategory.items.filter((item) => item.id !== editingId);
      category.items.push(targetItem);
    }

    targetItem.title = title;
    targetItem.category = category.category;
    targetItem.type = type;
    targetItem.marks = type === "range" ? 0 : marks;
    targetItem.rules = type === "range" ? parsedRules : [];

    state.editingCriteriaItemId = null;
    showToast("Criteria item updated.", "success");
  } else {
    const nextId = getNextCriteriaItemId();
    category.items.push({
      id: nextId,
      category: category.category,
      title: title,
      type: type,
      marks: type === "range" ? 0 : marks,
      rules: type === "range" ? parsedRules : []
    });
    showToast("Criteria item added.", "success");
  }

  renderPage();
}

function deleteCriteriaItem(itemId) {
  const inUse = submissions.some((submission) => submission.criteriaId === itemId);
  if (inUse) {
    showToast("Cannot delete item used in submissions.", "warning");
    return;
  }

  let deleted = false;
  criteriaCatalog.forEach((category) => {
    const previous = category.items.length;
    category.items = category.items.filter((item) => item.id !== itemId);
    if (category.items.length !== previous) {
      deleted = true;
    }
  });

  if (!deleted) {
    showToast("Criteria item not found.", "error");
    return;
  }

  if (state.editingCriteriaItemId === itemId) {
    state.editingCriteriaItemId = null;
  }

  showToast("Criteria item deleted.", "success");
  renderPage();
}

function parseRulesFromText(input) {
  if (!input) {
    return [];
  }

  const segments = input.split(",").map((item) => item.trim()).filter(Boolean);
  const rules = [];

  segments.forEach((segment) => {
    const parts = segment.split(":");
    if (parts.length !== 2) {
      return;
    }

    const rangePart = parts[0].trim();
    const marksPart = Number(parts[1].trim());

    const rangePieces = rangePart.split("-");
    if (rangePieces.length !== 2 || !Number.isFinite(marksPart)) {
      return;
    }

    const min = Number(rangePieces[0].trim());
    const max = Number(rangePieces[1].trim());
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return;
    }

    rules.push({ min: min, max: max, marks: marksPart });
  });

  return rules;
}

function formatRulesText(rules) {
  return (rules || [])
    .map((rule) => {
      return rule.min + "-" + rule.max + ":" + rule.marks;
    })
    .join(", ");
}

function getNextCriteriaItemId() {
  const allIds = getAllCriteriaItems().map((item) => Number(item.id)).filter((id) => Number.isFinite(id));
  const max = allIds.length ? Math.max(...allIds) : 100;
  return max + 1;
}

function bootstrapComputedMarks() {
  submissions.forEach((submission) => {
    bootstrapSingleSubmissionMarks(submission);
  });
}

function bootstrapSingleSubmissionMarks(submission) {
  const criteriaItem = getCriteriaById(submission.criteriaId);
  if (!criteriaItem) {
    return;
  }

  if (!submission.evidence) {
    submission.evidence = normalizeEvidence({ type: criteriaItem.type });
  }

  const suggested = calculateMarksByRule(submission, criteriaItem);
  submission.suggestedMarks = suggested;

  if (!Number.isFinite(submission.marks) && submission.status === "Approved") {
    submission.marks = suggested;
  }
}

function calculateMarksByRule(submission, criteriaItem) {
  if (!criteriaItem) {
    return 0;
  }

  const evidence = normalizeEvidence(submission.evidence);

  if (criteriaItem.type === "count") {
    const count = Number.isFinite(evidence.count) ? evidence.count : 0;
    return count * criteriaItem.marks;
  }

  if (criteriaItem.type === "range") {
    const value = Number.isFinite(evidence.value) ? evidence.value : null;
    if (!Number.isFinite(value)) {
      return 0;
    }

    const matched = (criteriaItem.rules || []).find((rule) => value >= rule.min && value <= rule.max);
    return matched ? matched.marks : 0;
  }

  if (criteriaItem.type === "boolean") {
    return evidence.checked ? criteriaItem.marks : 0;
  }

  return criteriaItem.marks;
}

function getSubmissionEffectiveMarks(submission) {
  if (Number.isFinite(submission.marks)) {
    return submission.marks;
  }

  const criteriaItem = getCriteriaById(submission.criteriaId);
  return calculateMarksByRule(submission, criteriaItem);
}

function getCriteriaMinMarks(criteriaItem) {
  if (!criteriaItem) {
    return -100;
  }

  if (criteriaItem.type === "range") {
    const marks = (criteriaItem.rules || []).map((rule) => rule.marks);
    return marks.length ? Math.min(...marks, 0) : -100;
  }

  return Math.min(0, Number(criteriaItem.marks) || 0);
}

function getCriteriaMaxMarks(criteriaItem, submission) {
  if (!criteriaItem) {
    return 100;
  }

  if (criteriaItem.type === "count") {
    const count = submission && submission.evidence && Number.isFinite(submission.evidence.count) ? submission.evidence.count : 10;
    const suggested = count * (Number(criteriaItem.marks) || 0);
    return Math.max(0, suggested, 100);
  }

  if (criteriaItem.type === "range") {
    const marks = (criteriaItem.rules || []).map((rule) => rule.marks);
    return marks.length ? Math.max(...marks, 100) : 100;
  }

  return Math.max(100, Number(criteriaItem.marks) || 0);
}

function getCriteriaRuleSummary(criteriaItem) {
  if (!criteriaItem) {
    return "-";
  }

  if (criteriaItem.type === "range") {
    return formatRulesText(criteriaItem.rules || []);
  }

  if (criteriaItem.type === "count") {
    return "per count x " + criteriaItem.marks;
  }

  if (criteriaItem.type === "boolean") {
    return "Yes => " + criteriaItem.marks + ", No => 0";
  }

  return "fixed: " + criteriaItem.marks;
}

function getCriteriaTypeLabel(type) {
  if (type === "count") {
    return "Multiple Count";
  }
  if (type === "range") {
    return "Range Based";
  }
  if (type === "boolean") {
    return "Boolean";
  }
  return "Fixed Value";
}

function getCriteriaCategoryLabel(criteriaItem) {
  return criteriaItem ? criteriaItem.category : "General";
}

function buildClassPerformance() {
  const classNames = Array.from(new Set(students.map((item) => item.className)));
  const classMap = new Map();

  classNames.forEach((className) => {
    classMap.set(className, {
      className: className,
      totalScore: 0,
      maxScore: 0,
      normalizedScore: 0,
      percentile: 0,
      grade: "D"
    });
  });

  submissions.forEach((submission) => {
    if (submission.status !== "Approved") {
      return;
    }

    const student = getStudentById(submission.studentId);
    const criteriaItem = getCriteriaById(submission.criteriaId);
    if (!student || !criteriaItem) {
      return;
    }

    const classEntry = classMap.get(student.className);
    if (!classEntry) {
      return;
    }

    const effective = getSubmissionEffectiveMarks(submission);
    classEntry.totalScore += effective;
    classEntry.maxScore += Math.max(1, Math.abs(getCriteriaMaxMarks(criteriaItem, submission)));
  });

  const classData = Array.from(classMap.values());
  classData.forEach((entry) => {
    entry.normalizedScore = entry.maxScore > 0 ? (entry.totalScore / entry.maxScore) * 100 : 0;
  });

  const scoreArray = classData.map((entry) => entry.totalScore);
  classData.forEach((entry) => {
    const belowOrEqual = scoreArray.filter((score) => score <= entry.totalScore).length;
    entry.percentile = scoreArray.length > 0 ? (belowOrEqual / scoreArray.length) * 100 : 0;
    entry.grade = calculateGrade(entry.normalizedScore);
  });

  return classData;
}

function buildSummaryMetrics(items) {
  const total = items.length;
  const approved = items.filter((item) => item.status === "Approved").length;
  const pending = items.filter((item) => item.status === "Pending").length;
  const rejected = items.filter((item) => item.status === "Rejected").length;
  const correction = items.filter((item) => String(item.status).toLowerCase().indexOf("correction") > -1).length;
  const score = items.reduce((sum, item) => sum + safeMark(getSubmissionEffectiveMarks(item)), 0);

  return {
    total: total,
    approved: approved,
    pending: pending,
    rejected: rejected,
    correction: correction,
    score: score
  };
}

function calculateGrade(normalizedScore) {
  if (normalizedScore >= 85) {
    return "A+";
  }
  if (normalizedScore >= 75) {
    return "A";
  }
  if (normalizedScore >= 65) {
    return "B+";
  }
  if (normalizedScore >= 55) {
    return "B";
  }
  if (normalizedScore >= 45) {
    return "C";
  }
  return "D";
}

function getStudentById(id) {
  return students.find((item) => item.id === id);
}

function getDepartmentByClassName(className) {
  const normalizedClass = String(className || "").toLowerCase();
  const matchedRule = evaluatorDepartmentRules.find((rule) => normalizedClass.indexOf(rule.match) > -1);
  return matchedRule ? matchedRule.department : "General";
}

function getApprovedSubmissionsByStudent(studentId) {
  return submissions.filter((item) => item.studentId === studentId && item.status === "Approved");
}

function getCriteriaCategories() {
  return criteriaCatalog;
}

function getAllCriteriaItems() {
  return criteriaCatalog.reduce((acc, category) => {
    return acc.concat(category.items || []);
  }, []);
}

function getCategoryById(categoryId) {
  return criteriaCatalog.find((category) => String(category.id) === String(categoryId));
}

function getCategoryByItemId(itemId) {
  return criteriaCatalog.find((category) => (category.items || []).some((item) => item.id === itemId));
}

function getCriteriaById(id) {
  return getAllCriteriaItems().find((item) => Number(item.id) === Number(id));
}

function getGradeClass(grade) {
  const normalized = String(grade || "").toLowerCase().replace("+", "-plus");
  return "grade-" + normalized;
}

function safeMark(value) {
  return Number.isFinite(value) ? value : 0;
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") {
    return "status-approved";
  }
  if (normalized === "rejected") {
    return "status-rejected";
  }
  if (normalized === "pending") {
    return "status-pending";
  }
  if (normalized.indexOf("correction") > -1) {
    return "status-correction";
  }
  return "status-neutral";
}

function resetEvaluatorFlow() {
  state.evaluatorView = "departments";
  state.evaluatorDepartment = "";
  state.evaluatorStudentId = null;
}

function openConfirmModal(title, message, action) {
  pendingConfirmationAction = action;
  ui.confirmTitle.textContent = title;
  ui.confirmMessage.textContent = message;
  ui.confirmModal.classList.remove("hidden");
  ui.confirmModal.setAttribute("aria-hidden", "false");
}

function closeConfirmModal() {
  pendingConfirmationAction = null;
  ui.confirmModal.classList.add("hidden");
  ui.confirmModal.setAttribute("aria-hidden", "true");
}

function showToast(message, variant) {
  const toast = document.createElement("div");
  const toastType = variant || "info";
  toast.className = "toast toast-" + toastType;
  toast.textContent = message;
  ui.toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 2800);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function getDefaultCriteriaCatalog() {
  return cloneCriteriaCatalog([
    {
      id: "cat-academics",
      category: "Academics",
      items: [
        { id: 101, category: "Academics", title: "S Grade", type: "fixed", marks: 5 },
        { id: 102, category: "Academics", title: "A+ Grade", type: "fixed", marks: 3 },
        { id: 103, category: "Academics", title: "Fail", type: "fixed", marks: -2 }
      ]
    },
    {
      id: "cat-courses",
      category: "Online Courses",
      items: [
        { id: 201, category: "Online Courses", title: "NPTEL", type: "count", marks: 10 },
        { id: 202, category: "Online Courses", title: "MOOC", type: "count", marks: 5 }
      ]
    },
    {
      id: "cat-performance",
      category: "Class Performance",
      items: [
        {
          id: 301,
          category: "Class Performance",
          title: "Pass Percentage",
          type: "range",
          rules: [
            { min: 90, max: 100, marks: 5 },
            { min: 80, max: 89.99, marks: 4 }
          ]
        }
      ]
    }
  ]);
}

function getDefaultSubmissions() {
  return cloneSubmissions([
    {
      id: 1,
      studentId: 1,
      criteriaId: 102,
      description: "A+ grade secured in semester results.",
      status: "Approved",
      remarks: "Verified with mark list",
      marks: null,
      proof: "sem_result_anika.pdf",
      evaluatorVerified: true,
      evidence: { type: "fixed" }
    }
  ]);
}
