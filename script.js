const roleConfig = {
  student: {
    label: "Student",
    heading: "Student Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "📊" },
      { page: "submit", label: "Submit Activity", icon: "📝" },
      { page: "submissions", label: "My Submissions", icon: "📁" }
    ]
  },
  teacher: {
    label: "Class Teacher",
    heading: "Teacher Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "📊" },
      { page: "verification", label: "Verification", icon: "✅" },
      { page: "students", label: "Student Management", icon: "👥" }
    ]
  },
  evaluator: {
    label: "Evaluator",
    heading: "Evaluation Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "📊" },
      { page: "evaluation", label: "Evaluation", icon: "⚖️" }
    ]
  },
  admin: {
    label: "Admin",
    heading: "Admin Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "📊" },
      { page: "criteria", label: "Criteria Management", icon: "⚙️" },
      { page: "users", label: "User Management", icon: "👥" },
      { page: "departments", label: "Department Management", icon: "🏛️" },
      { page: "settings", label: "Settings", icon: "🔧" }
    ]
  },
  hod: {
    label: "HOD / IQAC",
    heading: "HOD / IQAC Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "📊" },
      { page: "reports", label: "Reports", icon: "📉" }
    ]
  }
};

const adminManagedRoleOptions = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Class Teacher" },
  { value: "evaluator", label: "Evaluation Team" },
  { value: "hod", label: "HOD / IQAC" },
  { value: "admin", label: "Admin" }
];

const defaultAcademicYears = ["2025-2026", "2024-2025", "2023-2024"];
let academicYears = defaultAcademicYears.slice();

const workflowStatus = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  VERIFIED: "Verified",
  EVALUATED: "Evaluated",
  LOCKED: "Locked",
  CORRECTION: "Correction",
  REJECTED: "Rejected"
};

const editableStudentStatuses = [workflowStatus.DRAFT, workflowStatus.CORRECTION];
const scoringStatuses = [workflowStatus.VERIFIED, workflowStatus.EVALUATED, workflowStatus.LOCKED];
const listPageSize = 10;
const allFilterValue = "all";

function createDefaultListViewState() {
  return {
    search: "",
    department: allFilterValue,
    className: allFilterValue,
    status: allFilterValue,
    studentId: allFilterValue,
    currentPage: 1
  };
}

function createDefaultEvaluatorListViewState() {
  return {
    search: "",
    department: allFilterValue,
    className: allFilterValue,
    status: allFilterValue,
    studentId: allFilterValue,
    pendingPage: 1,
    completedPage: 1
  };
}

function createAcademicYearState(years, activeYear) {
  const defaultActiveYear = years.includes(activeYear) ? activeYear : years[0] || "";
  return years.map((year) => ({
    year: year,
    isActive: year === defaultActiveYear
  }));
}

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
let users = createInitialUsers();

const state = {
  loggedIn: false,
  currentRole: "student",
  currentUserId: null,
  activePage: "dashboard",
  currentStudentId: 1,
  selectedAcademicYear: academicYears[0],
  academicYearState: createAcademicYearState(academicYears, academicYears[0]),
  activeAcademicYear: academicYears[0],
  submissionOpen: true,
  evaluationOpen: true,
  systemMode: "setup",
  criteriaLastUpdatedAt: null,
  recentActivity: [],
  departments: [],
  evaluatorView: "departments",
  evaluatorDepartment: "",
  evaluatorStudentId: null,
  evaluatorTransition: null,
  selectedSubmissionCategoryId: "",
  selectedSubmissionItemId: "",
  editingSubmissionId: null,
  editingCriteriaItemId: null,
  editingCategoryId: null,
  editingUserId: null,
  showUserForm: false,
  pendingApprovalUserId: null,
  userSearchQuery: "",
  userFilterType: "all",
  userFilterValue: "all",
  userSortKey: "name",
  userSortDirection: "asc",
  adminUserListView: null,
  listViews: {
    studentSubmissions: createDefaultListViewState(),
    teacherVerification: createDefaultListViewState(),
    evaluatorEvaluation: createDefaultEvaluatorListViewState()
  },
  criteriaByYear: {},
  criteriaHistoryByYear: {}
};

state.departments = buildDepartmentOptionsFromUsers(users);

initializeYearScopedCriteriaStores();

const ui = {};
let pendingConfirmationAction = null;
let evaluatorTransitionResetTimer = null;
const appPageConfig = normalizeAppPageConfig(window.appPageConfig || {});

document.addEventListener("DOMContentLoaded", init);

function normalizeAppPageConfig(config) {
  const safeConfig = config && typeof config === "object" ? config : {};
  const safeRole = roleConfig[safeConfig.autoRole] ? safeConfig.autoRole : "";

  return {
    autoRole: safeRole,
    autoPage: String(safeConfig.autoPage || "dashboard"),
    redirectOnLogin: Boolean(safeConfig.redirectOnLogin),
    logoutRedirect: String(safeConfig.logoutRedirect || ""),
    rolePageRoutes: safeConfig.rolePageRoutes && typeof safeConfig.rolePageRoutes === "object"
      ? safeConfig.rolePageRoutes
      : {}
  };
}

function init() {
  if (!criteriaCatalog.length) {
    criteriaCatalog = getDefaultCriteriaCatalog();
  }

  if (!submissions.length) {
    submissions = getDefaultSubmissions();
  }

  cacheElements();
  setupAuthExtensions();
  bindEvents();

  const firstCategory = criteriaCatalog[0];
  const firstItem = firstCategory && firstCategory.items && firstCategory.items[0];
  state.selectedSubmissionCategoryId = firstCategory ? firstCategory.id : "";
  state.selectedSubmissionItemId = firstItem ? firstItem.id : "";
  applyUrlCategorySelection();
  applyAutoPageConfig();

  bootstrapComputedMarks();
  renderAuthState();
}

function applyAutoPageConfig() {
  if (!appPageConfig.autoRole) {
    return;
  }

  state.loggedIn = true;
  state.currentRole = appPageConfig.autoRole;
  state.activePage = appPageConfig.autoPage;
  state.editingSubmissionId = null;
  state.editingCriteriaItemId = null;
  resetEvaluatorFlow();
  setActiveMenu(state.activePage);
}

function applyUrlCategorySelection() {
  const params = new URLSearchParams(window.location.search);
  const categoryId = String(params.get("category") || "").trim();
  if (!categoryId) {
    return;
  }

  const category = getCategoryById(categoryId);
  if (!category) {
    return;
  }

  state.selectedSubmissionCategoryId = category.id;
  const firstItem = category.items && category.items[0] ? category.items[0] : null;
  state.selectedSubmissionItemId = firstItem ? firstItem.id : "";
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
    const normalizedStatus = normalizeSubmissionStatus(submission.status, Boolean(submission.evaluatorVerified));
    const normalizedTimestamps = normalizeSubmissionTimestamps(submission.timestamps);

    if (!normalizedTimestamps.createdAt) {
      normalizedTimestamps.createdAt = new Date().toISOString();
    }

    if (!normalizedTimestamps.updatedAt) {
      normalizedTimestamps.updatedAt = normalizedTimestamps.createdAt;
    }

    if (normalizedStatus === workflowStatus.SUBMITTED && !normalizedTimestamps.submittedAt) {
      normalizedTimestamps.submittedAt = normalizedTimestamps.updatedAt;
    }

    if (normalizedStatus === workflowStatus.VERIFIED && !normalizedTimestamps.verifiedAt) {
      normalizedTimestamps.verifiedAt = normalizedTimestamps.updatedAt;
    }

    if ((normalizedStatus === workflowStatus.EVALUATED || normalizedStatus === workflowStatus.LOCKED) && !normalizedTimestamps.evaluatedAt) {
      normalizedTimestamps.evaluatedAt = normalizedTimestamps.updatedAt;
    }

    if (normalizedStatus === workflowStatus.LOCKED && !normalizedTimestamps.lockedAt) {
      normalizedTimestamps.lockedAt = normalizedTimestamps.evaluatedAt || normalizedTimestamps.updatedAt;
    }

    return {
      id: Number(submission.id) || index + 1,
      studentId: Number(submission.studentId) || 1,
      criteriaId: Number(submission.criteriaId) || 0,
      academicYear: normalizeAcademicYearValue(submission.academicYear),
      description: String(submission.description || ""),
      status: normalizedStatus,
      remarks: String(submission.remarks || ""),
      marks: Number.isFinite(submission.marks) ? submission.marks : null,
      proof: String(submission.proof || "proof-file.pdf"),
      evaluatorVerified: normalizedStatus === workflowStatus.LOCKED || normalizedStatus === workflowStatus.EVALUATED,
      verifiedBy: submission.verifiedBy ? String(submission.verifiedBy) : "",
      evaluatedBy: submission.evaluatedBy ? String(submission.evaluatedBy) : "",
      timestamps: normalizedTimestamps,
      evidence: normalizeEvidence(submission.evidence || submission.meta)
    };
  });
}

function normalizeSubmissionStatus(status, evaluatorVerified) {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "draft") {
    return workflowStatus.DRAFT;
  }
  if (normalized === "submitted" || normalized === "pending") {
    return workflowStatus.SUBMITTED;
  }
  if (normalized === "verified") {
    return workflowStatus.VERIFIED;
  }
  if (normalized === "evaluated") {
    return workflowStatus.EVALUATED;
  }
  if (normalized === "locked") {
    return workflowStatus.LOCKED;
  }
  if (normalized === "correction" || normalized.indexOf("correction") > -1) {
    return workflowStatus.CORRECTION;
  }
  if (normalized === "rejected") {
    return workflowStatus.REJECTED;
  }

  if (normalized === "approved") {
    return evaluatorVerified ? workflowStatus.LOCKED : workflowStatus.VERIFIED;
  }

  return workflowStatus.SUBMITTED;
}

function normalizeSubmissionTimestamps(timestamps) {
  const source = timestamps && typeof timestamps === "object" ? timestamps : {};
  return {
    createdAt: source.createdAt ? String(source.createdAt) : "",
    updatedAt: source.updatedAt ? String(source.updatedAt) : "",
    submittedAt: source.submittedAt ? String(source.submittedAt) : "",
    verifiedAt: source.verifiedAt ? String(source.verifiedAt) : "",
    correctionAt: source.correctionAt ? String(source.correctionAt) : "",
    rejectedAt: source.rejectedAt ? String(source.rejectedAt) : "",
    evaluatedAt: source.evaluatedAt ? String(source.evaluatedAt) : "",
    lockedAt: source.lockedAt ? String(source.lockedAt) : ""
  };
}

function isSubmissionEditableByStudent(status) {
  return editableStudentStatuses.indexOf(String(status || "")) > -1;
}

function isSubmissionSubmitted(status) {
  return String(status || "") === workflowStatus.SUBMITTED;
}

function isSubmissionVerified(status) {
  return String(status || "") === workflowStatus.VERIFIED;
}

function isSubmissionLocked(status) {
  return String(status || "") === workflowStatus.LOCKED;
}

function isSubmissionRejected(status) {
  return String(status || "") === workflowStatus.REJECTED;
}

function isSubmissionCorrection(status) {
  return String(status || "") === workflowStatus.CORRECTION;
}

function isSubmissionScored(status) {
  return scoringStatuses.indexOf(String(status || "")) > -1;
}

function isTeacherActionAllowed(status) {
  return isSubmissionSubmitted(status);
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
  if (normalized === "negative") {
    return "negative";
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
  ui.loginCard = ui.loginScreen ? ui.loginScreen.querySelector(".login-card") : null;
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

function setupAuthExtensions() {
  if (!ui.loginCard || !ui.loginForm) {
    return;
  }

  if (!document.getElementById("student-signup-wrap")) {
    ui.loginCard.insertAdjacentHTML(
      "beforeend",
      "<div id=\"auth-login-actions\" class=\"button-row\">" +
      "<button id=\"show-student-signup\" type=\"button\" class=\"btn ghost full\">New Student? Register</button>" +
      "</div>" +
      "<section id=\"student-signup-wrap\" class=\"hidden\">" +
      "<h3>Student Registration</h3>" +
      "<p class=\"muted\">Create your account. Login is enabled after admin approval.</p>" +
      "<form id=\"student-signup-form\" class=\"stack-form two-col\">" +
      "<div class=\"field\"><label for=\"signup-name\">Name</label><input id=\"signup-name\" name=\"name\" type=\"text\" required /></div>" +
      "<div class=\"field\"><label for=\"signup-email\">Email</label><input id=\"signup-email\" name=\"email\" type=\"email\" placeholder=\"name@college.edu\" required /></div>" +
      "<div class=\"field\"><label for=\"signup-department\">Department</label><input id=\"signup-department\" name=\"department\" type=\"text\" required /></div>" +
      "<div class=\"field\"><label for=\"signup-class\">Class</label><input id=\"signup-class\" name=\"className\" type=\"text\" placeholder=\"BSc CS A\" required /></div>" +
      "<div class=\"full-span button-row\">" +
      "<button type=\"submit\" class=\"btn primary\">Register</button>" +
      "<button id=\"signup-back-btn\" type=\"button\" class=\"btn ghost\">Back to Login</button>" +
      "</div>" +
      "</form>" +
      "</section>" +
      "<section id=\"pending-approval-wrap\" class=\"hidden\">" +
      "<h3>Pending Approval</h3>" +
      "<p id=\"pending-approval-message\" class=\"muted\">Your account is awaiting admin approval.</p>" +
      "<div class=\"button-row\"><button id=\"pending-approval-back\" type=\"button\" class=\"btn ghost full\">Back to Login</button></div>" +
      "</section>"
    );
  }

  ui.authLoginActions = document.getElementById("auth-login-actions");
  ui.showStudentSignupBtn = document.getElementById("show-student-signup");
  ui.studentSignupWrap = document.getElementById("student-signup-wrap");
  ui.studentSignupForm = document.getElementById("student-signup-form");
  ui.signupBackBtn = document.getElementById("signup-back-btn");
  ui.pendingApprovalWrap = document.getElementById("pending-approval-wrap");
  ui.pendingApprovalMessage = document.getElementById("pending-approval-message");
  ui.pendingApprovalBackBtn = document.getElementById("pending-approval-back");
  toggleAuthView("login");
}

function toggleAuthView(view, user) {
  const nextView = String(view || "login").toLowerCase();
  if (ui.loginForm) {
    ui.loginForm.classList.toggle("hidden", nextView !== "login");
  }
  if (ui.authLoginActions) {
    ui.authLoginActions.classList.toggle("hidden", nextView !== "login");
  }
  if (ui.studentSignupWrap) {
    ui.studentSignupWrap.classList.toggle("hidden", nextView !== "signup");
  }
  if (ui.pendingApprovalWrap) {
    ui.pendingApprovalWrap.classList.toggle("hidden", nextView !== "pending");
  }

  if (nextView === "pending" && ui.pendingApprovalMessage) {
    const name = user && user.name ? user.name : "Student";
    ui.pendingApprovalMessage.textContent = name + ", your account is pending admin approval. Please try again after approval.";
  }
}

function showPendingApprovalScreen(user) {
  state.pendingApprovalUserId = user && Number.isFinite(Number(user.id)) ? Number(user.id) : null;
  toggleAuthView("pending", user);
}

function hidePendingApprovalScreen() {
  state.pendingApprovalUserId = null;
  toggleAuthView("login");
}

function handleStudentSignup(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const department = String(formData.get("department") || "").trim();
  const className = String(formData.get("className") || "").trim();

  if (!name || !email || !department || !className) {
    showToast("All signup fields are required.", "error");
    return;
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    if (existingUser.isApproved !== false) {
      showToast("This email already has an approved account. Please login.", "warning");
      toggleAuthView("login");
      return;
    }
    showPendingApprovalScreen(existingUser);
    showToast("This account is already pending approval.", "info");
    return;
  }

  const newUser = {
    id: getNextUserId(),
    name: name,
    email: email,
    role: "student",
    department: department,
    class: className,
    isApproved: false,
    status: "Pending",
    linkedStudentId: null
  };

  users.push(newUser);
  ensureDepartmentExists(department);
  addRecentActivity("Student signup request: " + newUser.name + " (" + newUser.email + ")");

  if (ui.loginForm) {
    const emailInput = ui.loginForm.querySelector("input[name='email']");
    if (emailInput) {
      emailInput.value = email;
    }
  }
  if (ui.loginRole) {
    ui.loginRole.value = "student";
  }

  if (ui.studentSignupForm) {
    ui.studentSignupForm.reset();
  }
  showPendingApprovalScreen(newUser);
  showToast("Registration submitted. Awaiting admin approval.", "success");
}

function bindEvents() {
  if (ui.loginForm) {
    ui.loginForm.addEventListener("submit", handleLogin);
  }

  if (ui.showStudentSignupBtn) {
    ui.showStudentSignupBtn.addEventListener("click", () => {
      toggleAuthView("signup");
    });
  }

  if (ui.signupBackBtn) {
    ui.signupBackBtn.addEventListener("click", () => {
      hidePendingApprovalScreen();
    });
  }

  if (ui.pendingApprovalBackBtn) {
    ui.pendingApprovalBackBtn.addEventListener("click", () => {
      hidePendingApprovalScreen();
    });
  }

  if (ui.studentSignupForm) {
    ui.studentSignupForm.addEventListener("submit", handleStudentSignup);
  }

  if (ui.logoutBtn) {
    ui.logoutBtn.addEventListener("click", handleLogout);
  }

  if (ui.menuToggle && ui.sidebar) {
    ui.menuToggle.addEventListener("click", () => {
      ui.sidebar.classList.toggle("open");
    });
  }

  if (ui.sidebarNav) {
    ui.sidebarNav.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-page]");
      if (!button) {
        return;
      }

      navigateToPage(button.dataset.page);
      if (ui.sidebar) {
        ui.sidebar.classList.remove("open");
      }
    });
  }

  if (ui.pageContent) {
    ui.pageContent.addEventListener("click", handlePageClick);
    ui.pageContent.addEventListener("input", handlePageInput);
    ui.pageContent.addEventListener("submit", handlePageSubmit);
    ui.pageContent.addEventListener("change", handlePageChange);
  }

  if (ui.confirmCancel) {
    ui.confirmCancel.addEventListener("click", closeConfirmModal);
  }

  if (ui.confirmAccept) {
    ui.confirmAccept.addEventListener("click", () => {
      if (typeof pendingConfirmationAction === "function") {
        pendingConfirmationAction();
      }
      closeConfirmModal();
    });
  }

  if (ui.confirmModal) {
    ui.confirmModal.addEventListener("click", (event) => {
      if (event.target === ui.confirmModal) {
        closeConfirmModal();
      }
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024 && ui.sidebar) {
      ui.sidebar.classList.remove("open");
    }
  });
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(ui.loginForm);
  const role = normalizeUserRole(formData.get("role"));
  const email = normalizeEmail(formData.get("email"));
  const matchedUser = email ? findUserByEmail(email) : null;

  if (matchedUser && normalizeUserRole(matchedUser.role) !== role) {
    showToast("Role mismatch. Login with your assigned role: " + getRoleLabel(matchedUser.role) + ".", "warning");
    return;
  }

  if (role === "student") {
    if (!email) {
      showToast("Student login requires a registered email.", "warning");
      return;
    }

    if (!matchedUser || normalizeUserRole(matchedUser.role) !== "student") {
      showToast("Student account not found. Register first.", "warning");
      return;
    }

    if (matchedUser.isApproved === false) {
      showPendingApprovalScreen(matchedUser);
      return;
    }
  }

  if (matchedUser && matchedUser.status === "Inactive") {
    showToast("This user is inactive. Contact admin to reactivate access.", "warning");
    return;
  }

  if (matchedUser && matchedUser.isApproved === false) {
    if (normalizeUserRole(matchedUser.role) === "student") {
      showPendingApprovalScreen(matchedUser);
    } else {
      showToast("This account is pending admin approval.", "warning");
    }
    return;
  }

  state.currentUserId = matchedUser ? matchedUser.id : null;
  if (role === "student" && matchedUser) {
    const linkedStudentId = ensureStudentLinkedToUser(matchedUser);
    if (!linkedStudentId) {
      showToast("Student profile is not linked yet. Contact admin.", "warning");
      return;
    }
    state.currentStudentId = linkedStudentId;
  }

  if (appPageConfig.redirectOnLogin) {
    const route = getRoleRoute(role, getRoleMenu(role)[0].page);
    if (route) {
      window.location.href = route;
      return;
    }
  }

  state.loggedIn = true;
  state.currentRole = role;
  state.activePage = getRoleMenu(role)[0].page;
  state.editingCriteriaItemId = null;
  state.editingSubmissionId = null;
  resetEvaluatorFlow();
  hidePendingApprovalScreen();

  renderAuthState();
  showToast("Welcome, " + roleConfig[role].label + ".", "success");
}

function handleLogout() {
  if (appPageConfig.logoutRedirect) {
    window.location.href = appPageConfig.logoutRedirect;
    return;
  }

  state.loggedIn = false;
  state.currentRole = "student";
  state.currentUserId = null;
  state.activePage = "dashboard";
  state.editingSubmissionId = null;
  state.editingCriteriaItemId = null;
  state.pendingApprovalUserId = null;
  resetEvaluatorFlow();
  if (ui.sidebar) {
    ui.sidebar.classList.remove("open");
  }
  closeConfirmModal();
  hidePendingApprovalScreen();

  renderAuthState();
  showToast("Logged out successfully.", "info");
}

function renderAuthState() {
  if (!state.loggedIn) {
    if (ui.loginScreen) {
      ui.loginScreen.classList.remove("hidden");
    }
    if (ui.appShell) {
      ui.appShell.classList.add("hidden");
    }

    const pendingUser = state.pendingApprovalUserId ? findUserById(state.pendingApprovalUserId) : null;
    if (pendingUser && pendingUser.isApproved === false) {
      showPendingApprovalScreen(pendingUser);
    } else {
      hidePendingApprovalScreen();
    }
    return;
  }

  if (ui.loginScreen) {
    ui.loginScreen.classList.add("hidden");
  }
  if (ui.appShell) {
    ui.appShell.classList.remove("hidden");
  }

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

function getRoleRoute(role, page) {
  const roleRoutes = appPageConfig.rolePageRoutes[role];
  if (!roleRoutes || typeof roleRoutes !== "object") {
    return "";
  }

  const route = roleRoutes[page];
  return route ? String(route) : "";
}

function getCurrentPathname() {
  const href = window.location.href.split("#")[0];
  const cleanHref = href.split("?")[0];
  const cleanPath = cleanHref.replace(window.location.origin, "");
  return cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;
}

function navigateToPage(page, options) {
  const navOptions = options && typeof options === "object" ? options : {};
  const route = getRoleRoute(state.currentRole, page);
  const query = navOptions.query && typeof navOptions.query === "object" ? navOptions.query : null;

  if (page !== "submit") {
    state.editingSubmissionId = null;
  }

  if (route) {
    const nextUrl = new URL(route, window.location.href);
    const currentPath = getCurrentPathname();
    const nextPath = nextUrl.pathname.startsWith("/") ? nextUrl.pathname.slice(1) : nextUrl.pathname;

    if (query) {
      Object.keys(query).forEach((key) => {
        const value = query[key];
        if (value === null || value === undefined || value === "") {
          return;
        }
        nextUrl.searchParams.set(key, String(value));
      });
    }

    if (currentPath !== nextPath || nextUrl.search !== window.location.search) {
      window.location.href = nextUrl.toString();
      return;
    }
  }

  setActiveMenu(page);
  renderSidebar();
  renderTopbar();
  renderPage();
}

function renderSidebar() {
  if (!ui.sidebarNav || !ui.sidebarRoleLabel) {
    return;
  }

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
  if (!ui.topbarHeading || !ui.topbarSubheading || !ui.topbarRoleBadge) {
    return;
  }

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
    return "Pending and completed verification queue";
  }

  return "Academic Year " + state.selectedAcademicYear;
}

function renderPage() {
  if (!ui.pageContent) {
    return;
  }

  let content = "";

  if (state.currentRole === "student") {
    if (state.activePage === "submit") {
      content = renderStudentSubmitPage();
    } else if (state.activePage === "submissions") {
      content = renderStudentSubmissionsPage();
    } else if (state.activePage === "students") {
      content = renderStudentManagementPage();
    } else {
      content = renderStudentDashboard();
    }
  } else if (state.currentRole === "teacher") {
    if (state.activePage === "verification") {
      content = renderTeacherVerificationPage();
    } else if (state.activePage === "students") {
      content = renderStudentManagementPage();
    } else {
      content = renderTeacherDashboard();
    }
  } else if (state.currentRole === "evaluator") {
    content = state.activePage === "evaluation" ? renderEvaluatorEvaluationPage() : renderEvaluatorDashboard();
  } else if (state.currentRole === "admin") {
    if (state.activePage === "criteria") {
      content = renderAdminCriteriaPage();
    } else if (state.activePage === "users") {
      content = renderAdminUserManagementPage();
    } else if (state.activePage === "departments") {
      content = renderAdminDepartmentManagementPage();
    } else if (state.activePage === "settings") {
      content = renderAdminSettingsPage();
    } else {
      content = renderAdminDashboard();
    }
  } else {
    content = state.activePage === "reports" ? renderHodReportsPage() : renderHodDashboard();
  }

  ui.pageContent.innerHTML = "<div class=\"page-stack\">" + content + "</div>";
  runPageRenderHooks();
}

function renderDashboardCards(metrics) {
  const displayMax = Number.isFinite(metrics.maxScore) ? metrics.maxScore : 0;
  const safeMax = Math.max(1, displayMax);
  const scorePercent = Math.min(100, Math.max(0, (metrics.score / safeMax) * 100));

  const cards = [
    { key: "total", icon: "📊", label: "Total Submissions", value: metrics.total },
    { key: "approved", icon: "✔", label: "Scored", value: metrics.approved },
    { key: "pending", icon: "⏳", label: "Queue", value: metrics.pending },
    {
      key: "score",
      icon: "📈",
      label: "Total Score",
      value:
        "<div class=\"score-meta\"><p>Score: " + metrics.score.toFixed(1) + " / " + displayMax.toFixed(1) +
        "</p><p>" + scorePercent.toFixed(1) + "%</p></div>" +
        "<div class=\"progress-track\"><div class=\"progress-fill progress-score\" style=\"width:" + scorePercent.toFixed(1) + "%\"></div></div>"
    }
  ];

  return (
    "<section class=\"cards-grid stats-grid\">" +
    cards
      .map((card) => {
        const valueHtml = card.key === "score" ? card.value : "<h3>" + escapeHtml(card.value) + "</h3>";
        return (
          "<article class=\"stat-card " + card.key + "\">" +
          "<div class=\"stat-head\"><span class=\"stat-icon\">" + card.icon + "</span><p>" + escapeHtml(card.label) + "</p></div>" +
          valueHtml +
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
    { key: "Scored", value: counts.approved, className: "progress-approved" },
    { key: "Submitted / Draft", value: counts.pending, className: "progress-pending" },
    { key: "Rejected", value: counts.rejected, className: "progress-rejected" },
    { key: "Correction", value: counts.correction, className: "progress-correction" }
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
          "<div class=\"progress-meta\"><span>" + escapeHtml(row.key) + "</span><span>" + row.value + " | " + percent.toFixed(1) + "%</span></div>" +
          "<div class=\"progress-track\"><div class=\"progress-fill " + row.className + "\" style=\"width:" + percent.toFixed(1) + "%\"></div></div>" +
          "</div>"
        );
      })
      .join("") +
    "</div>" +
    "</section>"
  );
}

function renderCategoryBreakdown(items, title) {
  const categoryMap = new Map();

  items.forEach((submission) => {
    if (!isSubmissionScored(submission.status)) {
      return;
    }

    const criteriaItem = getCriteriaById(submission.criteriaId);
    const categoryName = getCriteriaCategoryLabel(criteriaItem);
    const current = categoryMap.get(categoryName) || {
      category: categoryName,
      count: 0,
      score: 0
    };

    current.count += 1;
    current.score += safeMark(getSubmissionEffectiveMarks(submission));
    categoryMap.set(categoryName, current);
  });

  const rows = Array.from(categoryMap.values())
    .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category))
    .slice(0, 8);

  if (!rows.length) {
    return (
      "<section class=\"chart-card\">" +
      "<h3>" + escapeHtml(title) + "</h3>" +
      "<p class=\"empty-state\">No scored marks available yet.</p>" +
      "</section>"
    );
  }

  const maxScore = Math.max(1, ...rows.map((row) => Math.abs(row.score)));

  return (
    "<section class=\"chart-card\">" +
    "<h3>" + escapeHtml(title) + "</h3>" +
    "<div class=\"progress-list\">" +
    rows
      .map((row) => {
        const width = Math.min(100, (Math.abs(row.score) / maxScore) * 100);
        const fillClass = row.score < 0 ? "progress-rejected" : "progress-score";
        return (
          "<div class=\"progress-row\">" +
          "<div class=\"progress-meta\"><span>" + escapeHtml(row.category) + "</span><span>" + row.count + " scored | " + row.score.toFixed(1) + " marks</span></div>" +
          "<div class=\"progress-track\"><div class=\"progress-fill " + fillClass + "\" style=\"width:" + width.toFixed(1) + "%\"></div></div>" +
          "</div>"
        );
      })
      .join("") +
    "</div>" +
    "</section>"
  );
}

function renderRecentActivityPanel(items, title, limit) {
  const recentItems = [...items].sort((a, b) => b.id - a.id).slice(0, limit || 5);

  const rows = recentItems.length
    ? recentItems
        .map((submission) => {
          const student = getStudentById(submission.studentId);
          const criteriaItem = getCriteriaById(submission.criteriaId);
          const marks = getSubmissionEffectiveMarks(submission);
          return (
            "<tr>" +
            "<td>" + escapeHtml(student ? student.name : "Unknown Student") + "</td>" +
            "<td>" + escapeHtml(getCriteriaCategoryLabel(criteriaItem)) + "</td>" +
            "<td>" + escapeHtml(criteriaItem ? criteriaItem.title : "Removed Item") + "</td>" +
            "<td><span class=\"status-pill " + getStatusClass(submission.status) + "\">" + escapeHtml(submission.status) + "</span></td>" +
            "<td>" + marks.toFixed(1) + "</td>" +
            "</tr>"
          );
        })
        .join("")
    : "<tr><td colspan=\"5\" class=\"empty-row\">No submissions available</td></tr>";

  return (
    "<section class=\"panel\">" +
    "<div class=\"panel-head\"><h3>" + escapeHtml(title) + "</h3></div>" +
    "<div class=\"table-wrap compact-table\"><table><thead><tr><th>Student</th><th>Category</th><th>Item</th><th>Status</th><th>Marks</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
    "</section>"
  );
}

function buildStudentCategoryProgress(studentSubmissions) {
  const categories = getCriteriaCategories();

  const categoryStates = categories.map((category) => {
    const itemIds = new Set((category.items || []).map((item) => Number(item.id)));
    const categorySubmissions = studentSubmissions.filter((submission) => itemIds.has(Number(submission.criteriaId)));
    const hasSubmission = categorySubmissions.length > 0;

    return {
      id: category.id,
      category: category.category,
      completed: hasSubmission
    };
  });

  const completedCount = categoryStates.filter((item) => item.completed).length;
  const safeTotal = Math.max(1, categoryStates.length);
  const percent = (completedCount / safeTotal) * 100;

  return {
    total: categoryStates.length,
    completedCount: completedCount,
    remainingCount: Math.max(0, categoryStates.length - completedCount),
    percent: percent,
    categories: categoryStates
  };
}

function renderStudentProgressSection(progress) {
  return (
    "<section class=\"panel progress-overview\">" +
    "<div class=\"panel-head\"><h3>Progress</h3></div>" +
    "<p class=\"progress-line\"><strong>" + progress.completedCount + " out of " + progress.total + " categories completed</strong></p>" +
    "<p class=\"muted\">Progress: " + progress.completedCount + " / " + progress.total + "</p>" +
    "<div class=\"simple-progress-track\"><div class=\"simple-progress-fill\" style=\"width:" + progress.percent.toFixed(1) + "%\"></div></div>" +
    "<div class=\"progress-pills\">" +
    "<span class=\"progress-pill progress-pill-complete\">✔ Completed " + progress.completedCount + "</span>" +
    "<span class=\"progress-pill progress-pill-remaining\">⏳ Remaining " + progress.remainingCount + "</span>" +
    "</div>" +
    "</section>"
  );
}

function renderStudentChecklistSection(categories) {
  const rows = categories
    .map((item) => {
      const icon = item.completed ? "✔" : "⏳";
      const action = item.completed
        ? "<span class=\"check-done\">Done</span>"
        : "<button type=\"button\" class=\"btn ghost mini-add-btn\" data-submit-category=\"" + escapeAttribute(item.id) + "\">➕</button>";

      return (
        "<li class=\"checklist-item\">" +
        "<span class=\"check-symbol\">" + icon + "</span>" +
        "<span class=\"check-label\">" + escapeHtml(item.category) + "</span>" +
        action +
        "</li>"
      );
    })
    .join("");

  return (
    "<section class=\"panel checklist-panel\">" +
    "<div class=\"panel-head\"><h3>Category Checklist</h3></div>" +
    "<ul class=\"checklist\">" + rows + "</ul>" +
    "</section>"
  );
}

function renderStudentDashboard() {
  const studentSubmissions = submissions.filter((item) => item.studentId === state.currentStudentId);
  const progress = buildStudentCategoryProgress(studentSubmissions);

  return (
    "<section class=\"section-header\">" +
    "<div><h1>Student Dashboard</h1><p class=\"muted\">See completed categories, remaining work, and your next activity.</p></div>" +
    "</section>" +
    renderStudentProgressSection(progress) +
    renderStudentChecklistSection(progress.categories) +
    "<section class=\"panel\">" +
    "<div class=\"panel-head\"><h3>Quick Actions</h3></div>" +
    "<div class=\"button-row\">" +
    "<button type=\"button\" class=\"btn primary\" data-page-jump=\"submit\">➕ Submit New Activity</button>" +
    "<button type=\"button\" class=\"btn ghost\" data-page-jump=\"submissions\">📁 View My Submissions</button>" +
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
  const editingSubmission = getEditingStudentSubmission();
  if (editingSubmission) {
    const editingCriteria = getCriteriaById(editingSubmission.criteriaId);
    if (editingCriteria) {
      const editingCategory = getCategoryByItemId(editingCriteria.id);
      if (editingCategory) {
        state.selectedSubmissionCategoryId = editingCategory.id;
      }
      state.selectedSubmissionItemId = editingCriteria.id;
    }
  }
  if (!state.selectedSubmissionCategoryId || !getCategoryById(state.selectedSubmissionCategoryId)) {
    state.selectedSubmissionCategoryId = categories[0].id;
  }
  const selectedCategory = getCategoryById(state.selectedSubmissionCategoryId) || categories[0];
  const categoryItems = selectedCategory.items || [];
  const selectedItemInCategory = categoryItems.some((item) => Number(item.id) === Number(state.selectedSubmissionItemId));
  if (!state.selectedSubmissionItemId || !selectedItemInCategory) {
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
      return "<option value=\"" + item.id + "\"" + selected + ">" + escapeHtml(item.title) + " (" + escapeHtml(getCriteriaRuleSummary(item)) + ")</option>";
    })
    .join("");
  const dynamicInput = selectedItem ? renderStudentEvidenceInput(selectedItem, editingSubmission) : "";
  const criteriaRule = selectedItem ? renderCriteriaRuleCard(selectedItem) : "";
  const descriptionValue = editingSubmission ? editingSubmission.description : "";
  const proofHint = editingSubmission && editingSubmission.proof
    ? "<p class=\"muted\">Current proof: " + escapeHtml(editingSubmission.proof) + ". Upload a file only if you want to replace it.</p>"
    : "";
  const proofRequired = editingSubmission ? "" : " required";
  const title = editingSubmission ? "Edit Submission" : "Submit Activity";
  const subtitle = editingSubmission
    ? "You can edit only Draft or Correction submissions."
    : "Select category and item to submit activity evidence.";
  const cancelEditButton = editingSubmission
    ? "<button type=\"button\" class=\"btn ghost\" data-cancel-submission-edit=\"true\">Cancel Edit</button>"
    : "";
  return (
    "<section class=\"section-header\">" +
    "<div><h1>" + title + "</h1><p class=\"muted\">" + subtitle + "</p></div>" +
    "</section>" +
    "<section class=\"panel\">" +
    "<form id=\"student-submission-form\" class=\"stack-form two-col\">" +
    "<div class=\"field\"><label for=\"submission-category\">Category</label><select id=\"submission-category\" name=\"categoryId\" required>" + categoryOptions + "</select></div>" +
    "<div class=\"field\"><label for=\"submission-criteria\">Item</label><select id=\"submission-criteria\" name=\"criteriaId\" required>" + itemOptions + "</select></div>" +
    criteriaRule +
    dynamicInput +
    "<div class=\"field\"><label for=\"submission-proof\">Upload Proof</label><input id=\"submission-proof\" name=\"proof\" type=\"file\"" + proofRequired + " />" + proofHint + "</div>" +
    "<div class=\"field full-span\"><label for=\"submission-description\">Description</label><textarea id=\"submission-description\" name=\"description\" placeholder=\"Describe the activity\" required>" + escapeHtml(descriptionValue) + "</textarea></div>" +
    "<div class=\"button-row full-span\"><button type=\"submit\" class=\"btn ghost\" name=\"submissionAction\" value=\"draft\">Save Draft</button><button type=\"submit\" class=\"btn primary\" name=\"submissionAction\" value=\"submit\">Submit Activity</button>" + cancelEditButton + "</div>" +
    "</form>" +
    "</section>"
  );
}

function renderCriteriaRuleCard(criteriaItem) {
  return (
    "<div class=\"criteria-rule-card full-span\">" +
    "<div><span class=\"criteria-chip\">" + escapeHtml(getCriteriaTypeLabel(criteriaItem.type)) + "</span><h3>" + escapeHtml(criteriaItem.title) + "</h3></div>" +
    "<p>" + escapeHtml(getCriteriaRuleSummary(criteriaItem)) + "</p>" +
    "</div>"
  );
}

function renderStudentEvidenceInput(criteriaItem, submission) {
  const evidence = submission ? normalizeEvidence(submission.evidence) : normalizeEvidence({ type: criteriaItem.type });
  const countValue = Number.isFinite(evidence.count) ? evidence.count : "";
  const rangeValue = Number.isFinite(evidence.value) ? evidence.value : "";
  const yesSelected = evidence.checked ? " selected" : "";
  const noSelected = evidence.checked ? "" : " selected";
  if (criteriaItem.type === "count") {
    return "<div class=\"field\"><label for=\"submission-count\">Count</label><input id=\"submission-count\" name=\"countValue\" type=\"number\" min=\"1\" step=\"1\" required value=\"" + escapeAttribute(countValue) + "\" /><p class=\"muted\">Marks = count x " + criteriaItem.marks + "</p></div>";
  }
  if (criteriaItem.type === "negative") {
    return "<div class=\"field\"><label for=\"submission-count\">Count</label><input id=\"submission-count\" name=\"countValue\" type=\"number\" min=\"1\" step=\"1\" required value=\"" + escapeAttribute(countValue) + "\" /><p class=\"muted\">Penalty = count x " + criteriaItem.marks + "</p></div>";
  }
  if (criteriaItem.type === "range") {
    const rangeText = (criteriaItem.rules || [])
      .map((rule) => {
        return rule.min + "-" + rule.max + ": " + rule.marks;
      })
      .join(" | ");
    return "<div class=\"field\"><label for=\"submission-range\">Percentage / Value</label><input id=\"submission-range\" name=\"rangeValue\" type=\"number\" min=\"0\" max=\"100\" step=\"0.01\" required value=\"" + escapeAttribute(rangeValue) + "\" /><p class=\"muted\">Ranges: " + escapeHtml(rangeText) + "</p></div>";
  }
  if (criteriaItem.type === "boolean") {
    return "<div class=\"field\"><label for=\"submission-boolean\">Eligibility</label><select id=\"submission-boolean\" name=\"booleanValue\" required><option value=\"yes\"" + yesSelected + ">Yes</option><option value=\"no\"" + noSelected + ">No</option></select><p class=\"muted\">Marks awarded only when set to Yes.</p></div>";
  }
  return "<div class=\"field\"><label>Marks Rule</label><input type=\"text\" value=\"Fixed marks: " + criteriaItem.marks + "\" readonly /></div>";
}
function getEditingStudentSubmission() {
  if (!Number.isFinite(Number(state.editingSubmissionId))) {
    return null;
  }
  const submission = submissions.find((item) => Number(item.id) === Number(state.editingSubmissionId));
  if (!submission) {
    state.editingSubmissionId = null;
    return null;
  }
  if (Number(submission.studentId) !== Number(state.currentStudentId) || !isSubmissionEditableByStudent(submission.status)) {
    state.editingSubmissionId = null;
    return null;
  }
  return submission;
}

function openStudentSubmissionForEdit(submissionId) {
  const submission = submissions.find((item) => Number(item.id) === Number(submissionId));
  if (!submission) {
    showToast("Submission not found.", "error");
    return;
  }

  if (Number(submission.studentId) !== Number(state.currentStudentId)) {
    showToast("You can edit only your own submissions.", "warning");
    return;
  }

  if (!isSubmissionEditableByStudent(submission.status)) {
    showToast("Only Draft or Correction submissions are editable.", "warning");
    return;
  }

  const criteriaItem = getCriteriaById(submission.criteriaId);
  if (criteriaItem) {
    const category = getCategoryByItemId(criteriaItem.id);
    if (category) {
      state.selectedSubmissionCategoryId = category.id;
    }
    state.selectedSubmissionItemId = criteriaItem.id;
  }

  state.editingSubmissionId = submission.id;
  navigateToPage("submit", {
    query: { category: state.selectedSubmissionCategoryId }
  });
}

function ensureListViewState() {
  if (!state.listViews || typeof state.listViews !== "object") {
    state.listViews = {};
  }

  if (!state.listViews.studentSubmissions || typeof state.listViews.studentSubmissions !== "object") {
    state.listViews.studentSubmissions = createDefaultListViewState();
  }

  if (!state.listViews.teacherVerification || typeof state.listViews.teacherVerification !== "object") {
    state.listViews.teacherVerification = createDefaultListViewState();
  }

  if (!state.listViews.evaluatorEvaluation || typeof state.listViews.evaluatorEvaluation !== "object") {
    state.listViews.evaluatorEvaluation = createDefaultEvaluatorListViewState();
  }
}

function normalizeFilterText(value) {
  return String(value || "").trim().toLowerCase();
}

function valuesMatch(left, right) {
  return normalizeFilterText(left) === normalizeFilterText(right);
}

function hasFilterOption(selectedValue, options) {
  if (selectedValue === allFilterValue) {
    return true;
  }

  return options.some((option) => valuesMatch(option.value, selectedValue));
}

function getLinkedStudentUser(studentId) {
  return users.find((user) => Number(user.linkedStudentId) === Number(studentId)) || null;
}

function createSubmissionViewRecord(submission) {
  const student = getStudentById(submission.studentId);
  const criteriaItem = getCriteriaById(submission.criteriaId);
  const linkedUser = getLinkedStudentUser(submission.studentId);
  const previewMarks = calculateMarksByRule(submission, criteriaItem);
  const className = student ? student.className : "General";
  const department = getDepartmentByClassName(className);
  const studentName = student ? student.name : "Unknown Student";
  const email = linkedUser ? linkedUser.email : "";
  const category = getCriteriaCategoryLabel(criteriaItem);
  const itemTitle = criteriaItem ? criteriaItem.title : "Removed Item";
  const evidenceSummary = formatEvidenceSummary(submission, criteriaItem);

  return {
    submission: submission,
    id: Number(submission.id),
    studentId: Number(submission.studentId),
    studentName: studentName,
    email: email,
    department: department,
    className: className,
    category: category,
    itemTitle: itemTitle,
    evidenceSummary: evidenceSummary,
    status: String(submission.status || ""),
    description: String(submission.description || ""),
    proof: String(submission.proof || "-"),
    previewMarks: previewMarks,
    finalMarks: Number.isFinite(submission.marks) ? submission.marks : null,
    criteriaItem: criteriaItem,
    canEditByStudent: isSubmissionEditableByStudent(submission.status),
    canTeacherAct: isTeacherActionAllowed(submission.status),
    searchText: normalizeFilterText(studentName + " " + email + " " + department + " " + className + " " + category + " " + itemTitle)
  };
}

function buildUniqueOptions(records, valueSelector) {
  const set = new Map();

  records.forEach((record) => {
    const raw = valueSelector(record);
    const value = String(raw || "").trim();
    if (!value) {
      return;
    }
    const key = normalizeFilterText(value);
    if (!set.has(key)) {
      set.set(key, value);
    }
  });

  return Array.from(set.values())
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      label: value,
      value: value
    }));
}

function buildStudentOptions(records) {
  const map = new Map();

  records.forEach((record) => {
    const key = String(record.studentId);
    if (!map.has(key)) {
      map.set(key, {
        label: record.studentName,
        value: key
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function filterRecordsByDepartment(records, department) {
  if (department === allFilterValue) {
    return records;
  }
  return records.filter((record) => valuesMatch(record.department, department));
}

function filterRecordsByClass(records, className) {
  if (className === allFilterValue) {
    return records;
  }
  return records.filter((record) => valuesMatch(record.className, className));
}

function filterSubmissionViewRecords(records, viewState, includeStudentFilter) {
  const query = normalizeFilterText(viewState.search);

  return records.filter((record) => {
    if (query && record.searchText.indexOf(query) === -1) {
      return false;
    }
    if (viewState.department !== allFilterValue && !valuesMatch(record.department, viewState.department)) {
      return false;
    }
    if (viewState.className !== allFilterValue && !valuesMatch(record.className, viewState.className)) {
      return false;
    }
    if (viewState.status !== allFilterValue && !valuesMatch(record.status, viewState.status)) {
      return false;
    }
    if (includeStudentFilter && viewState.studentId !== allFilterValue && Number(record.studentId) !== Number(viewState.studentId)) {
      return false;
    }
    return true;
  });
}

function paginateListItems(items, pageNumber, pageSize) {
  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const requestedPage = Number.isFinite(Number(pageNumber)) ? Number(pageNumber) : 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(totalItems, startIndex + pageSize);

  return {
    items: safeItems.slice(startIndex, endIndex),
    totalItems: totalItems,
    totalPages: totalPages,
    currentPage: currentPage,
    startIndex: totalItems ? startIndex + 1 : 0,
    endIndex: endIndex
  };
}

function renderFilterOptions(options, selectedValue, allLabel) {
  const optionRows = (options || [])
    .map((option) => {
      const selected = valuesMatch(option.value, selectedValue) ? " selected" : "";
      return "<option value=\"" + escapeAttribute(option.value) + "\"" + selected + ">" + escapeHtml(option.label) + "</option>";
    })
    .join("");

  const allSelected = selectedValue === allFilterValue ? " selected" : "";
  return "<option value=\"" + allFilterValue + "\"" + allSelected + ">" + escapeHtml(allLabel) + "</option>" + optionRows;
}

function renderPaginationControls(target, pageInfo) {
  if (!pageInfo || pageInfo.totalItems === 0) {
    return "";
  }

  const pages = [];
  for (let index = 1; index <= pageInfo.totalPages; index += 1) {
    pages.push(index);
  }

  const pageButtons = pages
    .map((page) => {
      const activeClass = page === pageInfo.currentPage ? " active" : "";
      return "<button type=\"button\" class=\"btn ghost pagination-btn" + activeClass + "\" data-pagination-target=\"" + escapeAttribute(target) + "\" data-pagination-action=\"page\" data-pagination-number=\"" + page + "\">" + page + "</button>";
    })
    .join("");

  const prevDisabled = pageInfo.currentPage <= 1 ? " disabled" : "";
  const nextDisabled = pageInfo.currentPage >= pageInfo.totalPages ? " disabled" : "";

  return (
    "<div class=\"pagination-row\">" +
    "<button type=\"button\" class=\"btn ghost pagination-btn\" data-pagination-target=\"" + escapeAttribute(target) + "\" data-pagination-action=\"prev\"" + prevDisabled + ">Prev</button>" +
    pageButtons +
    "<button type=\"button\" class=\"btn ghost pagination-btn\" data-pagination-target=\"" + escapeAttribute(target) + "\" data-pagination-action=\"next\"" + nextDisabled + ">Next</button>" +
    "</div>"
  );
}

function renderListSummary(pageInfo) {
  if (!pageInfo || pageInfo.totalItems === 0) {
    return "<p class=\"muted list-summary\">Showing 0 records</p>";
  }

  return "<p class=\"muted list-summary\">Showing " + pageInfo.startIndex + "-" + pageInfo.endIndex + " of " + pageInfo.totalItems + " records</p>";
}

function renderStudentSubmissionsSection() {
  ensureListViewState();
  const viewState = state.listViews.studentSubmissions;
  const records = submissions
    .filter((item) => Number(item.studentId) === Number(state.currentStudentId))
    .sort((a, b) => b.id - a.id)
    .map((item) => createSubmissionViewRecord(item));

  const departmentOptions = buildUniqueOptions(records, (record) => record.department);
  if (!hasFilterOption(viewState.department, departmentOptions)) {
    viewState.department = allFilterValue;
  }

  const classOptions = buildUniqueOptions(filterRecordsByDepartment(records, viewState.department), (record) => record.className);
  if (!hasFilterOption(viewState.className, classOptions)) {
    viewState.className = allFilterValue;
  }

  const statusOptions = buildUniqueOptions(records, (record) => record.status);
  if (!hasFilterOption(viewState.status, statusOptions)) {
    viewState.status = allFilterValue;
  }

  const filtered = filterSubmissionViewRecords(records, viewState, false);
  const pageInfo = paginateListItems(filtered, viewState.currentPage, listPageSize);
  viewState.currentPage = pageInfo.currentPage;

  const rows = pageInfo.items.length
    ? pageInfo.items
        .map((record) => {
          let editAction;
          const isDeletable = !isSubmissionScored(record.status);
          
          if (record.canEditByStudent) {
            editAction = "<div class=\"button-row\" style=\"display:flex;gap:4px;\"><button type=\"button\" class=\"btn ghost\" data-student-edit-submission=\"" + record.id + "\">Edit</button>" +
              "<button type=\"button\" class=\"btn danger\" data-student-delete-submission=\"" + record.id + "\">Delete</button></div>";
          } else if (isDeletable) {
            editAction = "<div class=\"button-row\"><button type=\"button\" class=\"btn danger\" data-student-delete-submission=\"" + record.id + "\">Delete</button></div>";
          } else {
            editAction = "<span class=\"muted\">Locked</span>";
          }

          return (
            "<tr>" +
            "<td>" + escapeHtml(record.category) + "</td>" +
            "<td>" + escapeHtml(record.itemTitle) + "</td>" +
            "<td>" + escapeHtml(record.evidenceSummary) + "</td>" +
            "<td>" + escapeHtml(record.description) + "</td>" +
            "<td><span class=\"status-pill " + getStatusClass(record.status) + "\">" + escapeHtml(record.status) + "</span></td>" +
            "<td>" + safeMark(record.previewMarks).toFixed(1) + "</td>" +
            "<td>" + (Number.isFinite(record.finalMarks) ? record.finalMarks : "-") + "</td>" +
            "<td>" + editAction + "</td>" +
            "</tr>"
          );
        })
        .join("")
    : "<tr><td colspan=\"8\" class=\"empty-row\">No submissions match your filters.</td></tr>";

  return (
    "" +
    renderListSummary(pageInfo) +
    "<div class=\"table-wrap\">" +
    "<table><thead><tr><th>Category</th><th>Item</th><th>Evidence</th><th>Description</th><th>Status</th><th>Rule Marks</th><th>Final Marks</th><th>Action</th></tr></thead><tbody>" + rows + "</tbody></table>" +
    "</div>" +
    renderPaginationControls("student-submissions", pageInfo)
  );
}

function renderStudentSubmissionsPage() {
  return (
    "<section class=\"section-header\">" +
    "<div><h1>My Submissions</h1><p class=\"muted\">Live status of all activities you submitted.</p></div>" +
    "</section>" +
    "<section class=\"panel\" id=\"student-submissions-panel\">" +
    renderStudentSubmissionsSection() +
    "</section>"
  );
}

function renderStudentManagementPage() {
  const isTeacher = state.currentRole === "teacher";
  const overrideClass = "BSc CS A";

  const myStudents = users.filter(u => u.role === "student" && u.class === overrideClass);

  let rows = myStudents.map(u => 
      "<tr><td>" + escapeHtml(u.name) + "</td><td>" + escapeHtml(u.email) + "</td><td>" + escapeHtml(u.department) + "</td>" +
      "<td><button class='btn danger' data-delete-student='" + u.id + "'>Delete</button></td></tr>"
  ).join("");
  
  if (!rows) rows = "<tr><td colspan='4'>No students found.</td></tr>";

  const bulkSection = isTeacher ? 
      ("<div class=\"panel\" style=\"margin-top:20px;\">" +
       "<h3>Bulk Upload Students (CSV)</h3>" +
       "<form id=\"bulk-upload-form\" class=\"stack-form\">" +
       "<div class=\"field\"><label>CSV File</label><input type=\"file\" accept=\".csv\" required></div>" +
       "<button type=\"submit\" class=\"btn ghost\">Upload CSV</button>" +
       "</form>" +
       "</div>") : "";

  const extraTeacherFields = isTeacher ? 
      ("<div class=\"field\"><label>Email</label><input type=\"email\" name=\"email\" required placeholder=\"student@college.edu\"></div>" +
       "<div class=\"field\"><label>Password</label><input type=\"password\" name=\"password\" required placeholder=\"Password\"></div>") : "";

  return (
    "<section class=\"section-header\">" +
    "<div><h1>" + (isTeacher ? 'Student Management' : 'Class Management') + "</h1>" +
    "<p class=\"muted\">Manage students in your class.</p></div>" +
    "</section>" +
    "<div style=\"display:flex; gap: 20px; flex-wrap: wrap; align-items: flex-start;\">" +
       "<div class=\"panel\" style=\"flex: 2; min-width: 300px;\">" +
         "<h3>Class List</h3>" +
         "<div class=\"table-wrap\">" +
           "<table>" +
             "<thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Action</th></tr></thead>" +
             "<tbody>" + rows + "</tbody>" +
           "</table>" +
         "</div>" +
       "</div>" +
       "<div style=\"flex: 1; display:flex; flex-direction:column; min-width: 300px;\">" +
         "<div class=\"panel\">" +
           "<h3>Manual Add Student</h3>" +
           "<form id=\"add-student-form\" class=\"stack-form\">" +
             "<div class=\"field\"><label>Name</label><input type=\"text\" name=\"name\" required placeholder=\"Student Name\"></div>" +
             extraTeacherFields +
             "<button type=\"submit\" class=\"btn primary\">Add Student</button>" +
           "</form>" +
         "</div>" +
         bulkSection +
       "</div>" +
    "</div>"
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
    renderRecentActivityPanel(submissions, "Latest Verification Items", 5) +
    "<section class=\"panel\">" +
    "<div class=\"button-row\">" +
    "<button type=\"button\" class=\"btn primary\" data-page-jump=\"verification\">✔ Open Verification Desk</button>" +
    "</div>" +
    "</section>"
  );
}

function renderTeacherVerificationSection() {
  const teacherClass = "BSc CS A";
  const records = submissions
    .filter(item => {
       const user = findUserById(item.studentId);
       return user && user.class === teacherClass;
    })
    .sort((a, b) => b.id - a.id)
    .map(item => createSubmissionViewRecord(item));

  state.teacherTab = state.teacherTab || "pending";

  let tabContent = "";
  if (state.teacherTab === "pending") {
    const pendingRecords = records.filter(r => isSubmissionSubmitted(r.status));
    tabContent = buildTeacherTable(pendingRecords);
  } else if (state.teacherTab === "reviewed") {
    const reviewedRecords = records.filter(r => !isSubmissionSubmitted(r.status) && r.status !== workflowStatus.DRAFT);
    tabContent = buildTeacherTable(reviewedRecords);
  }

  return (
    "<section class=\"panel\">" +
    "<div class=\"button-row\" style=\"margin-bottom:20px;\">" +
    "<button type=\"button\" class=\"btn " + (state.teacherTab === "pending" ? "primary" : "ghost") + "\" data-teacher-tab=\"pending\">Pending</button>" +
    "<button type=\"button\" class=\"btn " + (state.teacherTab === "reviewed" ? "primary" : "ghost") + "\" data-teacher-tab=\"reviewed\">Reviewed</button>" +
    "</div>" +
    tabContent +
    "</section>"
  );
}

function buildTeacherTable(records) {
  if (!records.length) return "<p class='empty-state'>No submissions found in this tab.</p>";
  const cards = records.map(record => {
    const actionHtml = record.canTeacherAct
      ? "<div class=\"button-row\">" +
        "<button type=\"button\" class=\"btn success\" data-teacher-action=\"" + workflowStatus.VERIFIED + "\" data-id=\"" + record.id + "\">✔ Verify</button>" +
        "<button type=\"button\" class=\"btn warn\" data-teacher-action=\"" + workflowStatus.CORRECTION + "\" data-id=\"" + record.id + "\">Request Correction</button>" +
        "<button type=\"button\" class=\"btn danger\" data-teacher-action=\"" + workflowStatus.REJECTED + "\" data-id=\"" + record.id + "\">✖ Reject</button>" +
        "</div>"
      : "<div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-teacher-edit-locked=\"" + record.id + "\">Edit Submission Status</button></div>";

    return (
      "<article class=\"submission-card\">" +
      "<div class=\"submission-head\"><h4>" + escapeHtml(record.studentName) + "</h4><span class=\"status-pill " + getStatusClass(record.status) + "\">" + escapeHtml(record.status) + "</span></div>" +
      "<div class=\"meta-list\">" +
      "<p><strong>Category:</strong> " + escapeHtml(record.category) + "</p>" +
      "<p><strong>Item:</strong> " + escapeHtml(record.itemTitle) + "</p>" +
      "<p><strong>Description:</strong> " + escapeHtml(record.description) + "</p>" +
      "</div>" +
      "<div class=\"button-row\" style=\"margin-top:12px;margin-bottom:12px;\"><button type=\"button\" class=\"btn ghost full\" data-view-doc=\"" + escapeAttribute(record.proof) + "\">📄 View Document</button></div>" +
      "<div class=\"field\"><label>Teacher Remark</label><input type=\"text\" data-remark-input=\"" + record.id + "\" value=\"" + escapeAttribute(record.submission.remarks || "") + "\" placeholder=\"Add a remark\" /></div>" +
      actionHtml +
      "</article>"
    );
  }).join("");
  return "<div class='submission-grid'>" + cards + "</div>";
}

function renderTeacherVerificationPage() {
  return (
    "<section class=\"section-header\">" +
    "<div><h1>Verification</h1></div>" +
    "</section>" +
    "<div id=\"teacher-verification-root\">" + renderTeacherVerificationSection() + "</div>"
  );
}
function renderEvaluatorDashboard() {
  const verifiedQueue = submissions.filter((item) => isSubmissionVerified(item.status));
  const lockedQueue = submissions.filter((item) => isSubmissionLocked(item.status));
  const allForEvaluation = verifiedQueue.concat(lockedQueue);

  const metrics = {
    total: allForEvaluation.length,
    approved: lockedQueue.length,
    pending: verifiedQueue.length,
    rejected: 0,
    correction: 0,
    score: lockedQueue.reduce((sum, item) => sum + safeMark(getSubmissionEffectiveMarks(item)), 0),
    maxScore: lockedQueue.reduce((sum, item) => sum + getSubmissionScoreCapacity(item), 0)
  };

  return (
    "<section class=\"section-header\">" +
    "<div><h1>Evaluator Dashboard</h1><p class=\"muted\">Review Verified submissions and lock final marks.</p></div>" +
    "</section>" +
    renderDashboardCards(metrics) +
    renderStatusProgress("Evaluation Progress", {
      total: metrics.total,
      approved: metrics.approved,
      pending: metrics.pending,
      rejected: 0,
      correction: 0
    }) +
    renderRecentActivityPanel(allForEvaluation, "Verified and Locked Submissions", 5) +
    "<section class=\"panel\"><div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-page-jump=\"evaluation\">Open Evaluation</button></div></section>"
  );
}

function renderEvaluatorEvaluationSection() {
  state.evaluatorTab = state.evaluatorTab || "evaluation";

  let tabContent = "";
  if (state.evaluatorTab === "evaluation") {
      const records = submissions
        .filter(item => isSubmissionVerified(item.status) || isSubmissionLocked(item.status))
        .sort((a, b) => b.id - a.id)
        .map(item => createSubmissionViewRecord(item));

      const cards = records.map(record => {
          const currentMarks = record.finalMarks !== null ? record.finalMarks : record.previewMarks;
          const marksHtml = record.canEvaluate
          ? "<div class=\"field eval-manual-field\"><label>Manual Marks</label><input data-evaluator-manual=\"" + record.id + "\" type=\"number\" step=\"0.5\" value=\"" + (Number.isFinite(record.submission.marks) ? record.submission.marks : "") + "\" placeholder=\"Auto: " + record.previewMarks + "\" /></div>" +
            "<div class=\"button-row\"><button type=\"button\" class=\"btn primary full\" data-evaluator-verify-save=\"" + record.id + "\">Verify & Save</button></div>"
          : "<div class=\"meta-list\" style=\"margin-bottom:8px;\"><p><strong>Locked Marks:</strong> " + currentMarks + "</p></div>" +
            "<div class=\"button-row\"><button type=\"button\" class=\"btn ghost full\" data-evaluator-edit-marks=\"" + record.id + "\">Edit Marks</button></div>";

        return (
          "<article class=\"submission-card\">" +
          "<div class=\"submission-head\"><h4>" + escapeHtml(record.studentName) + "</h4><span class=\"status-pill " + getStatusClass(record.status) + "\">" + escapeHtml(record.status) + "</span></div>" +
          "<div class=\"meta-list\">" +
          "<p><strong>Category:</strong> " + escapeHtml(record.category) + "</p>" +
          "<p><strong>Rule Marks:</strong> " + safeMark(record.previewMarks).toFixed(1) + "</p>" +
          "</div>" +
          "<div class=\"button-row\" style=\"margin-top:12px;margin-bottom:12px;\"><button type=\"button\" class=\"btn ghost full\" data-view-doc=\"" + escapeAttribute(record.proof) + "\">📄 View Document</button></div>" +
          marksHtml +
          "</article>"
        );
      }).join("");
      tabContent = cards ? "<div class='submission-grid'>" + cards + "</div>" : "<p class='empty-state'>No verified submissions to evaluate.</p>";
  } else if (state.evaluatorTab === "results") {
      const classScores = {};
      submissions.filter(s => s.status === workflowStatus.LOCKED || s.status === workflowStatus.EVALUATED).forEach(s => {
         const user = findUserById(s.studentId);
         if (user && user.class) {
             if (!classScores[user.class]) classScores[user.class] = 0;
             classScores[user.class] += getSubmissionEffectiveMarks(s);
         }
      });
      
      const ranked = Object.keys(classScores).map(c => ({ className: c, score: classScores[c] })).sort((a,b) => b.score - a.score);
      const maxScore = ranked.length ? Math.max(...ranked.map(r => r.score), 10) : 10;

      let resultRows = ranked.map((r, i) => {
         const percent = Math.min((r.score / maxScore) * 100, 100);
         return "<div style='margin-bottom: 20px;'>" +
                  "<div style='display:flex; justify-content:space-between; margin-bottom:5px;'><strong>#" + (i+1) + " " + escapeHtml(r.className) + "</strong><span>" + r.score.toFixed(1) + " Points</span></div>" +
                  "<div class='simple-progress-track'><div class='simple-progress-fill' style='width:" + percent + "%; background-color: var(--primary);'></div></div>" +
                "</div>";
      }).join("");

      tabContent = ranked.length ? "<div style='padding:15px; background:var(--surface); border-radius:var(--radius);'>" + resultRows + "</div>" : "<p class='empty-state'>No scored classes yet.</p>";
  }

  return (
    "<section class=\"panel\">" +
    "<div class=\"button-row\" style=\"margin-bottom:20px;\">" +
    "<button type=\"button\" class=\"btn " + (state.evaluatorTab === "evaluation" ? "primary" : "ghost") + "\" data-evaluator-tab=\"evaluation\">Evaluation</button>" +
    "<button type=\"button\" class=\"btn " + (state.evaluatorTab === "results" ? "primary" : "ghost") + "\" data-evaluator-tab=\"results\">Results</button>" +
    "</div>" +
    tabContent +
    "</section>"
  );
}

function renderEvaluatorEvaluationPage() {
  return (
    "<section class=\"section-header\">" +
    "<div><h1>Evaluation Workspace</h1></div>" +
    "</section>" +
    "<div id=\"evaluator-evaluation-root\">" + renderEvaluatorEvaluationSection() + "</div>"
  );
}

function refreshStudentSubmissionsSection() {
  if (!ui.pageContent) {
    return;
  }
  const root = ui.pageContent.querySelector("#student-submissions-panel");
  if (!root) {
    return;
  }
  root.innerHTML = renderStudentSubmissionsSection();
}

function refreshTeacherVerificationSection() {
  if (!ui.pageContent) {
    return;
  }
  const root = ui.pageContent.querySelector("#teacher-verification-root");
  if (!root) {
    return;
  }
  root.innerHTML = renderTeacherVerificationSection();
}

function refreshEvaluatorEvaluationSection() {
  if (!ui.pageContent) {
    return;
  }
  const root = ui.pageContent.querySelector("#evaluator-evaluation-root");
  if (!root) {
    return;
  }
  root.innerHTML = renderEvaluatorEvaluationSection();
}
function renderAdminDashboard() {
  if (window.adminDashboardModule && typeof window.adminDashboardModule.renderDashboard === "function") {
    return window.adminDashboardModule.renderDashboard({
      state: state,
      academicYears: academicYears,
      submissions: submissions,
      getSubmissionsForYear: getSubmissionsForYear,
      students: students,
      criteriaCatalog: criteriaCatalog,
      buildSummaryMetrics: buildSummaryMetrics,
      buildClassPerformance: buildClassPerformance,
      getActiveAcademicYear: getActiveAcademicYear,
      getAllCriteriaItems: getAllCriteriaItems,
      getSystemModeStatusClass: getSystemModeStatusClass,
      getSystemModeLabel: getSystemModeLabel,
      renderDashboardCards: renderDashboardCards,
      renderStatusProgress: renderStatusProgress,
      escapeHtml: escapeHtml
    });
  }

  const metrics = buildSummaryMetrics(submissions);
  return (
    "<section class=\"section-header\"><div><h1>Admin Dashboard</h1><p class=\"muted\">Overview of criteria, submissions, and yearly setup.</p></div></section>" +
    renderDashboardCards(metrics) +
    renderStatusProgress("Workflow Status", metrics)
  );
}

function renderAdminCriteriaPage() {
  if (window.adminCriteriaModule && typeof window.adminCriteriaModule.renderCriteriaPage === "function") {
    return window.adminCriteriaModule.renderCriteriaPage(getAdminCriteriaContext());
  }

  const categories = getCriteriaCategories();
  const editingItem = state.editingCriteriaItemId ? getCriteriaById(state.editingCriteriaItemId) : null;

  const yearOptions = academicYears
    .map((year) => {
      const selected = year === state.selectedAcademicYear ? " selected" : "";
      const yearState = state.academicYearState.find((item) => item.year === year);
      const statusLabel = yearState && yearState.isActive ? " (Active)" : "";
      return "<option value=\"" + year + "\"" + selected + ">" + year + statusLabel + "</option>";
    })
    .join("");

  const academicYearStatusRows = state.academicYearState
    .map((item) => {
      const chipClass = item.isActive ? "status-approved" : "status-pending";
      const chipLabel = item.isActive ? "Active" : "Inactive";
      return "<p><strong>" + escapeHtml(item.year) + "</strong> <span class=\"status-pill " + chipClass + "\">" + chipLabel + "</span></p>";
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
  const negativeSelected = editingItem && editingItem.type === "negative" ? " selected" : "";

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
    "<div class=\"meta-list\">" + academicYearStatusRows + "</div>" +
    "<hr /><h3>Add Category</h3><form id=\"category-form\" class=\"stack-form\"><div class=\"field\"><label for=\"category-title\">Category Name</label><input id=\"category-title\" name=\"categoryTitle\" type=\"text\" required /></div><div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">ï¼‹ Add Category</button></div></form></article>" +
    "<article class=\"panel\"><h3>" + (editingItem ? "Edit Criteria Item" : "Add Criteria Item") + "</h3>" +
    "<form id=\"criteria-item-form\" class=\"stack-form\" data-editing-item=\"" + (editingItem ? editingItem.id : "") + "\">" +
    "<div class=\"field\"><label for=\"criteria-item-category\">Category</label><select id=\"criteria-item-category\" name=\"categoryId\" required>" + categoryOptions + "</select></div>" +
    "<div class=\"field\"><label for=\"criteria-item-title\">Title</label><input id=\"criteria-item-title\" name=\"title\" type=\"text\" required value=\"" + escapeAttribute(editingItem ? editingItem.title : "") + "\" /></div>" +
    "<div class=\"field\"><label for=\"criteria-item-type\">Type</label><select id=\"criteria-item-type\" name=\"type\"><option value=\"fixed\"" + fixedSelected + ">Fixed</option><option value=\"count\"" + countSelected + ">Count Based</option><option value=\"range\"" + rangeSelected + ">Range Based</option><option value=\"boolean\"" + booleanSelected + ">Boolean</option><option value=\"negative\"" + negativeSelected + ">Negative Marks</option></select></div>" +
    "<div class=\"field\"><label for=\"criteria-item-marks\">Marks (fixed/count/negative)</label><input id=\"criteria-item-marks\" name=\"marks\" type=\"number\" step=\"0.5\" value=\"" + (editingItem && Number.isFinite(editingItem.marks) ? editingItem.marks : "") + "\" /></div>" +
    "<div class=\"field\"><label for=\"criteria-item-rules\">Range Rules (for range type)</label><textarea id=\"criteria-item-rules\" name=\"rules\" placeholder=\"90-100:5, 80-89.99:4\">" + escapeHtml(editingItem ? formatRulesText(editingItem.rules || []) : "") + "</textarea></div>" +
    "<div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">" + (editingItem ? "✏️ Update Item" : "➕ Add Item") + "</button><button type=\"button\" id=\"cancel-item-edit\" class=\"btn ghost " + (editingItem ? "" : "hidden") + "\">Cancel</button></div>" +
    "</form></article></section>" +
    "<section class=\"panel\"><h3>Criteria by Category</h3><div class=\"table-wrap\"><table><thead><tr><th>Category</th><th>Item</th><th>Type</th><th>Marks / Rules</th><th>Actions</th></tr></thead><tbody>" + groupedRows + "</tbody></table></div></section>"
  );
}

function renderAdminUserManagementPage() {
  if (window.adminUserManagementModule && typeof window.adminUserManagementModule.renderUserManagementPage === "function") {
    return window.adminUserManagementModule.renderUserManagementPage(getAdminUserManagementContext());
  }

  return (
    "<section class=\"section-header\"><div><h1>User Management</h1><p class=\"muted\">User management module is not available in this page context.</p></div></section>"
  );
}

function renderAdminDepartmentManagementPage() {
  if (window.adminDepartmentManagementModule && typeof window.adminDepartmentManagementModule.renderDepartmentManagementPage === "function") {
    return window.adminDepartmentManagementModule.renderDepartmentManagementPage(getAdminDepartmentContext());
  }

  return (
    "<section class=\"section-header\"><div><h1>Department Management</h1><p class=\"muted\">Department management module is not available in this page context.</p></div></section>"
  );
}

function renderAdminSettingsPage() {
  if (window.adminSettingsModule && typeof window.adminSettingsModule.renderSettingsPage === "function") {
    return window.adminSettingsModule.renderSettingsPage(getAdminSettingsContext());
  }

  return (
    "<section class=\"section-header\"><div><h1>Settings</h1><p class=\"muted\">Settings module is not available in this page context.</p></div></section>"
  );
}

function renderHodDashboard() {
  const performance = buildClassPerformance();
  const metrics = {
    total: submissions.length,
    approved: submissions.filter((item) => isSubmissionScored(item.status)).length,
    pending: submissions.filter((item) => isSubmissionSubmitted(item.status) || item.status === workflowStatus.DRAFT).length,
    rejected: submissions.filter((item) => isSubmissionRejected(item.status)).length,
    correction: submissions.filter((item) => isSubmissionCorrection(item.status)).length,
    score: performance.reduce((sum, item) => sum + item.totalScore, 0),
    maxScore: performance.reduce((sum, item) => sum + item.maxScore, 0)
  };

  return (
    "<section class=\"section-header\"><div><h1>HOD / IQAC Dashboard</h1><p class=\"muted\">Institution-level performance overview.</p></div></section>" +
    renderDashboardCards(metrics) +
    renderCategoryBreakdown(submissions, "Institution Score by Category") +
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
      const medal = index === 0 ? "ðŸ¥‡" : index === 1 ? "ðŸ¥ˆ" : index === 2 ? "ðŸ¥‰" : "#" + (index + 1);
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
  const paginationButton = event.target.closest("button[data-pagination-target]");
  if (paginationButton) {
    handleListPagination(paginationButton);
    return;
  }

  const pageJump = event.target.closest("button[data-page-jump]");
  if (pageJump) {
    navigateToPage(pageJump.dataset.pageJump);
    return;
  }

  const adminActionButton = event.target.closest("button[data-admin-action]");
  if (adminActionButton) {
    handleAdminDashboardAction(String(adminActionButton.dataset.adminAction || ""));
    return;
  }

  const teacherTabButton = event.target.closest("button[data-teacher-tab]");
  if (teacherTabButton) {
    state.teacherTab = teacherTabButton.dataset.teacherTab;
    renderPage();
    return;
  }

  const evaluatorTabButton = event.target.closest("button[data-evaluator-tab]");
  if (evaluatorTabButton) {
    state.evaluatorTab = evaluatorTabButton.dataset.evaluatorTab;
    renderPage();
    return;
  }
  
  const viewDocButton = event.target.closest("button[data-view-doc]");
  if (viewDocButton) {
    const proofFile = viewDocButton.dataset.viewDoc;
    openConfirmModal("Document Viewer", "", () => {});
    ui.confirmMessage.innerHTML = "<p style='margin-bottom:10px;'>Viewing Document: <strong>" + escapeHtml(proofFile) + "</strong></p><div style='padding:40px; border:1px dashed var(--border); border-radius:var(--radius); text-align:center;' class='muted'>Preview not available in prototype mode</div>";
    ui.confirmAccept.textContent = "Close";
    ui.confirmAccept.className = "btn ghost";
    ui.confirmCancel.classList.add("hidden");
    return;
  }

  if (state.currentRole === "admin" && window.adminUserManagementModule && typeof window.adminUserManagementModule.handleClick === "function") {
    const handledAdminUserClick = window.adminUserManagementModule.handleClick(event, getAdminUserManagementContext());
    if (handledAdminUserClick) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminDepartmentManagementModule && typeof window.adminDepartmentManagementModule.handleClick === "function") {
    const handledAdminDepartmentClick = window.adminDepartmentManagementModule.handleClick(event, getAdminDepartmentContext());
    if (handledAdminDepartmentClick) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminSettingsModule && typeof window.adminSettingsModule.handleClick === "function") {
    const handledAdminSettingsClick = window.adminSettingsModule.handleClick(event, getAdminSettingsContext());
    if (handledAdminSettingsClick) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminCriteriaModule && typeof window.adminCriteriaModule.handleClick === "function") {
    const handledAdminClick = window.adminCriteriaModule.handleClick(event, getAdminCriteriaContext());
    if (handledAdminClick) {
      return;
    }
  }

  const submitCategoryButton = event.target.closest("button[data-submit-category]");
  if (submitCategoryButton) {
    const categoryId = String(submitCategoryButton.dataset.submitCategory || "");
    const category = getCategoryById(categoryId);

    if (!category) {
      showToast("Category not found.", "error");
      return;
    }

    state.selectedSubmissionCategoryId = category.id;
    const firstItem = category.items && category.items[0] ? category.items[0] : null;
    state.selectedSubmissionItemId = firstItem ? firstItem.id : "";
    state.editingSubmissionId = null;

    navigateToPage("submit", {
      query: { category: category.id }
    });
    return;
  }

  const verifySaveButton = event.target.closest("button[data-evaluator-verify-save]");
  if (verifySaveButton) {
    verifyAndSaveEvaluatorSubmission(Number(verifySaveButton.dataset.evaluatorVerifySave));
    return;
  }

  const editStudentSubmissionButton = event.target.closest("button[data-student-edit-submission]");
  if (editStudentSubmissionButton) {
    openStudentSubmissionForEdit(Number(editStudentSubmissionButton.dataset.studentEditSubmission));
    return;
  }

  const cancelSubmissionEditButton = event.target.closest("button[data-cancel-submission-edit]");
  if (cancelSubmissionEditButton) {
    state.editingSubmissionId = null;
    renderPage();
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

  if (form.id === "add-student-form") {
    event.preventDefault();
    const formData = new FormData(form);
    const isTeacher = state.currentRole === "teacher";
    const name = String(formData.get("name") || "").trim();
    const email = isTeacher ? String(formData.get("email") || "").trim() : name.toLowerCase().replace(/\s/g, "") + "@college.edu";
    const deptRaw = String(formData.get("department") || "").trim();
    const dept = isTeacher ? (deptRaw || "Computer Science") : "Computer Science";
    
    users.push({
      id: getNextUserId(),
      name: name,
      email: email,
      role: "student",
      department: dept,
      class: "BSc CS A",
      isApproved: true,
      status: "Active"
    });
    showToast("Student added successfully.", "success");
    form.reset();
    renderPage();
    return;
  }

  if (form.id === "bulk-upload-form") {
    event.preventDefault();
    showToast("Simulating Excel upload... records added.", "success");
    form.reset();
    return;
  }

  if (state.currentRole === "admin" && window.adminUserManagementModule && typeof window.adminUserManagementModule.handleSubmit === "function") {
    const handledAdminUserSubmit = window.adminUserManagementModule.handleSubmit(event, getAdminUserManagementContext());
    if (handledAdminUserSubmit) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminDepartmentManagementModule && typeof window.adminDepartmentManagementModule.handleSubmit === "function") {
    const handledAdminDepartmentSubmit = window.adminDepartmentManagementModule.handleSubmit(event, getAdminDepartmentContext());
    if (handledAdminDepartmentSubmit) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminSettingsModule && typeof window.adminSettingsModule.handleSubmit === "function") {
    const handledAdminSettingsSubmit = window.adminSettingsModule.handleSubmit(event, getAdminSettingsContext());
    if (handledAdminSettingsSubmit) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminCriteriaModule && typeof window.adminCriteriaModule.handleSubmit === "function") {
    const handledAdminSubmit = window.adminCriteriaModule.handleSubmit(event, getAdminCriteriaContext());
    if (handledAdminSubmit) {
      return;
    }
  }

  if (form.id === "student-submission-form") {
    event.preventDefault();
    submitStudentSubmission(form);
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

function handlePageInput(event) {
  const target = event.target;

  if (state.currentRole === "admin" && window.adminUserManagementModule && typeof window.adminUserManagementModule.handleInput === "function") {
    const handledAdminUserInput = window.adminUserManagementModule.handleInput(event, getAdminUserManagementContext());
    if (handledAdminUserInput) {
      return;
    }
  }

  if (!target || !target.dataset || !target.dataset.listTarget) {
    return;
  }

  if (String(target.dataset.listFilter || "") !== "search") {
    return;
  }

  updateListFilterState(String(target.dataset.listTarget), "search", target.value);
}

function handlePageChange(event) {
  const target = event.target;

  if (state.currentRole === "admin" && window.adminUserManagementModule && typeof window.adminUserManagementModule.handleChange === "function") {
    const handledAdminUserChange = window.adminUserManagementModule.handleChange(event, getAdminUserManagementContext());
    if (handledAdminUserChange) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminDashboardModule && typeof window.adminDashboardModule.handleChange === "function") {
    const handledAdminDashboardChange = window.adminDashboardModule.handleChange(event, {
      state: state,
      renderPage: renderPage
    });

    if (handledAdminDashboardChange) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminDepartmentManagementModule && typeof window.adminDepartmentManagementModule.handleChange === "function") {
    const handledAdminDepartmentChange = window.adminDepartmentManagementModule.handleChange(event, getAdminDepartmentContext());
    if (handledAdminDepartmentChange) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminSettingsModule && typeof window.adminSettingsModule.handleChange === "function") {
    const handledAdminSettingsChange = window.adminSettingsModule.handleChange(event, getAdminSettingsContext());
    if (handledAdminSettingsChange) {
      return;
    }
  }

  if (state.currentRole === "admin" && window.adminCriteriaModule && typeof window.adminCriteriaModule.handleChange === "function") {
    const handledAdminChange = window.adminCriteriaModule.handleChange(event, getAdminCriteriaContext());
    if (handledAdminChange) {
      return;
    }
  }

  if (target && target.dataset && target.dataset.listTarget && target.dataset.listFilter) {
    updateListFilterState(String(target.dataset.listTarget), String(target.dataset.listFilter), target.value);
    return;
  }

  if (target.id === "academic-year-select") {
    setSelectedAcademicYear(target.value);
    renderTopbar();
    renderPage();
    showToast("Viewing academic year " + state.selectedAcademicYear + ". Only the active year can be edited.", "info");
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

function updateListFilterState(target, filterKey, rawValue) {
  ensureListViewState();
  const safeTarget = String(target || "");
  const safeFilterKey = String(filterKey || "");
  const isSearch = safeFilterKey === "search";
  const nextValue = isSearch
    ? String(rawValue || "")
    : (String(rawValue || "").trim() || allFilterValue);

  if (safeTarget === "student-submissions") {
    const viewState = state.listViews.studentSubmissions;
    viewState[safeFilterKey] = nextValue;
    if (safeFilterKey === "department") {
      viewState.className = allFilterValue;
    }
    viewState.currentPage = 1;
    refreshStudentSubmissionsSection();
    return;
  }

  if (safeTarget === "teacher-verification") {
    const viewState = state.listViews.teacherVerification;
    viewState[safeFilterKey] = nextValue;
    if (safeFilterKey === "department") {
      viewState.className = allFilterValue;
      viewState.studentId = allFilterValue;
    } else if (safeFilterKey === "className") {
      viewState.studentId = allFilterValue;
    }
    viewState.currentPage = 1;
    refreshTeacherVerificationSection();
    return;
  }

  if (safeTarget === "evaluator-evaluation") {
    const viewState = state.listViews.evaluatorEvaluation;
    viewState[safeFilterKey] = nextValue;
    if (safeFilterKey === "department") {
      viewState.className = allFilterValue;
      viewState.studentId = allFilterValue;
    } else if (safeFilterKey === "className") {
      viewState.studentId = allFilterValue;
    }
    viewState.pendingPage = 1;
    viewState.completedPage = 1;
    refreshEvaluatorEvaluationSection();
  }
}

function applyPageChange(currentPage, action, pageNumber) {
  const page = Number.isFinite(Number(currentPage)) ? Number(currentPage) : 1;

  if (action === "prev") {
    return Math.max(1, page - 1);
  }

  if (action === "next") {
    return page + 1;
  }

  if (action === "page" && Number.isFinite(Number(pageNumber))) {
    return Math.max(1, Number(pageNumber));
  }

  return page;
}

function handleListPagination(button) {
  ensureListViewState();
  const target = String(button.dataset.paginationTarget || "");
  const action = String(button.dataset.paginationAction || "");
  const pageNumber = Number(button.dataset.paginationNumber);

  if (target === "student-submissions") {
    const viewState = state.listViews.studentSubmissions;
    viewState.currentPage = applyPageChange(viewState.currentPage, action, pageNumber);
    refreshStudentSubmissionsSection();
    return;
  }

  if (target === "teacher-verification") {
    const viewState = state.listViews.teacherVerification;
    viewState.currentPage = applyPageChange(viewState.currentPage, action, pageNumber);
    refreshTeacherVerificationSection();
    return;
  }

  if (target === "evaluator-pending") {
    const viewState = state.listViews.evaluatorEvaluation;
    viewState.pendingPage = applyPageChange(viewState.pendingPage, action, pageNumber);
    refreshEvaluatorEvaluationSection();
    return;
  }

  if (target === "evaluator-completed") {
    const viewState = state.listViews.evaluatorEvaluation;
    viewState.completedPage = applyPageChange(viewState.completedPage, action, pageNumber);
    refreshEvaluatorEvaluationSection();
  }
}

function runPageRenderHooks() {
  if (state.currentRole === "admin" &&
    state.activePage === "dashboard" &&
    window.adminDashboardModule &&
    typeof window.adminDashboardModule.afterRender === "function") {
    window.adminDashboardModule.afterRender();
  }
}

function submitStudentSubmission(form) {
  if (!state.submissionOpen) {
    showToast("Submission is currently OFF. Contact admin.", "warning");
    return;
  }

  if (!ensureYearEditAllowed("Submission create/update")) {
    return;
  }

  const formData = new FormData(form);
  const submissionAction = String(formData.get("submissionAction") || "submit").toLowerCase();
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

  if (criteriaItem.type === "count" || criteriaItem.type === "negative") {
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

  const targetStatus = submissionAction === "draft" ? workflowStatus.DRAFT : workflowStatus.SUBMITTED;
  const now = new Date().toISOString();
  const proofFile = form.querySelector("input[name='proof']");
  const uploadedProofName = proofFile && proofFile.files && proofFile.files[0] ? proofFile.files[0].name : "";
  const editingSubmission = getEditingStudentSubmission();

  if (editingSubmission) {
    editingSubmission.criteriaId = criteriaId;
    editingSubmission.academicYear = state.selectedAcademicYear;
    editingSubmission.description = description;
    editingSubmission.status = targetStatus;
    editingSubmission.remarks = targetStatus === workflowStatus.SUBMITTED ? "" : editingSubmission.remarks;
    editingSubmission.marks = null;
    editingSubmission.evaluatorVerified = false;
    editingSubmission.verifiedBy = "";
    editingSubmission.evaluatedBy = "";
    editingSubmission.evidence = evidence;
    editingSubmission.proof = uploadedProofName || editingSubmission.proof || "proof-file.pdf";
    editingSubmission.timestamps = normalizeSubmissionTimestamps(editingSubmission.timestamps);
    editingSubmission.timestamps.updatedAt = now;
    editingSubmission.timestamps.createdAt = editingSubmission.timestamps.createdAt || now;
    editingSubmission.timestamps.submittedAt = targetStatus === workflowStatus.SUBMITTED ? now : "";
    editingSubmission.timestamps.verifiedAt = "";
    editingSubmission.timestamps.correctionAt = "";
    editingSubmission.timestamps.rejectedAt = "";
    editingSubmission.timestamps.evaluatedAt = "";
    editingSubmission.timestamps.lockedAt = "";

    bootstrapSingleSubmissionMarks(editingSubmission);
    state.editingSubmissionId = null;
    form.reset();
    showToast(targetStatus === workflowStatus.DRAFT ? "Draft updated." : "Submission re-submitted for verification.", "success");
    renderPage();
    return;
  }

  const proofName = uploadedProofName || "proof-file.pdf";
  const nextId = submissions.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
  const newSubmission = {
    id: nextId,
    studentId: state.currentStudentId,
    criteriaId: criteriaId,
    academicYear: state.selectedAcademicYear,
    description: description,
    status: targetStatus,
    remarks: "",
    marks: null,
    proof: proofName,
    evaluatorVerified: false,
    verifiedBy: "",
    evaluatedBy: "",
    timestamps: {
      createdAt: now,
      updatedAt: now,
      submittedAt: targetStatus === workflowStatus.SUBMITTED ? now : "",
      verifiedAt: "",
      correctionAt: "",
      rejectedAt: "",
      evaluatedAt: "",
      lockedAt: ""
    },
    evidence: evidence
  };

  submissions.unshift(newSubmission);
  bootstrapSingleSubmissionMarks(newSubmission);

  form.reset();
  showToast(targetStatus === workflowStatus.DRAFT ? "Draft saved." : "Submission sent for verification.", "success");
  renderPage();
}

function updateTeacherStatus(submissionId, nextStatus) {
  if (!ensureYearEditAllowed("Teacher verification update")) {
    return;
  }

  const submission = submissions.find((item) => item.id === submissionId);
  if (!submission) {
    showToast("Submission not found.", "error");
    return;
  }

  const remarkInput = ui.pageContent.querySelector("[data-remark-input='" + submissionId + "']");
  const remarkValue = remarkInput ? remarkInput.value.trim() : "";

  if (!isTeacherActionAllowed(submission.status)) {
    showToast("Teacher can update only Submitted items.", "warning");
    return;
  }

  if (nextStatus !== workflowStatus.VERIFIED && nextStatus !== workflowStatus.CORRECTION && nextStatus !== workflowStatus.REJECTED) {
    showToast("Invalid teacher transition.", "error");
    return;
  }

  const now = new Date().toISOString();
  submission.timestamps = normalizeSubmissionTimestamps(submission.timestamps);
  submission.status = nextStatus;
  submission.remarks = remarkValue;
  submission.timestamps.updatedAt = now;
  submission.evaluatorVerified = false;

  if (nextStatus === workflowStatus.VERIFIED) {
    submission.marks = calculateMarksByRule(submission, getCriteriaById(submission.criteriaId));
    submission.verifiedBy = getCurrentActorLabel();
    submission.evaluatedBy = "";
    submission.timestamps.verifiedAt = now;
    submission.timestamps.correctionAt = "";
    submission.timestamps.rejectedAt = "";
    submission.timestamps.evaluatedAt = "";
    submission.timestamps.lockedAt = "";
  } else if (nextStatus === workflowStatus.CORRECTION) {
    submission.marks = null;
    submission.verifiedBy = "";
    submission.evaluatedBy = "";
    submission.timestamps.correctionAt = now;
    submission.timestamps.verifiedAt = "";
    submission.timestamps.rejectedAt = "";
    submission.timestamps.evaluatedAt = "";
    submission.timestamps.lockedAt = "";
  } else {
    submission.marks = null;
    submission.verifiedBy = "";
    submission.evaluatedBy = "";
    submission.timestamps.rejectedAt = now;
    submission.timestamps.verifiedAt = "";
    submission.timestamps.correctionAt = "";
    submission.timestamps.evaluatedAt = "";
    submission.timestamps.lockedAt = "";
  }

  showToast("Submission " + submissionId + " marked as " + nextStatus + ".", "success");
  renderPage();
}

function verifyAndSaveEvaluatorSubmission(submissionId) {
  if (!state.evaluationOpen) {
    showToast("Evaluation is currently OFF. Turn it on from Admin Settings.", "warning");
    return;
  }

  if (!ensureYearEditAllowed("Evaluator marks update")) {
    return;
  }

  const submission = submissions.find((item) => item.id === submissionId);

  if (!submission) {
    showToast("Submission not found.", "error");
    return;
  }

  if (!isSubmissionVerified(submission.status)) {
    showToast("Only Verified submissions can be evaluated.", "warning");
    return;
  }

  const criteriaItem = getCriteriaById(submission.criteriaId);
  if (!criteriaItem) {
    showToast("Criteria item not found for this submission.", "error");
    return;
  }

  const marksInput = ui.pageContent.querySelector("[data-evaluator-manual='" + submissionId + "']");
  const manualInput = marksInput ? String(marksInput.value || "").trim() : "";
  const autoMarks = calculateMarksByRule(submission, criteriaItem);

  const min = getCriteriaMinMarks(criteriaItem, submission);
  const max = getCriteriaMaxMarks(criteriaItem, submission);

  let marks = autoMarks;
  if (manualInput !== "") {
    marks = Number(manualInput);
    if (!Number.isFinite(marks)) {
      showToast("Manual marks must be a valid number.", "error");
      return;
    }
  }

  if (marks < min || marks > max) {
    showToast("Marks must be between " + min + " and " + max + ".", "error");
    return;
  }

  const now = new Date().toISOString();
  submission.marks = marks;
  submission.evaluatorVerified = true;
  submission.evaluatedBy = getCurrentActorLabel();
  submission.timestamps = normalizeSubmissionTimestamps(submission.timestamps);
  submission.timestamps.updatedAt = now;
  submission.timestamps.evaluatedAt = now;
  submission.status = workflowStatus.EVALUATED;
  submission.status = workflowStatus.LOCKED;
  submission.timestamps.lockedAt = now;
  setEvaluatorTransition(submission.id, "to-completed");
  showToast("Submission verified and locked.", "success");
  renderPage();
}

function moveEvaluatorSubmissionToPending(submissionId) {
  if (!state.evaluationOpen) {
    showToast("Evaluation is currently OFF. Turn it on from Admin Settings.", "warning");
    return;
  }

  if (!ensureYearEditAllowed("Evaluator status update")) {
    return;
  }

  const submission = submissions.find((item) => item.id === submissionId);
  if (!submission) {
    showToast("Submission not found.", "error");
    return;
  }

  if (!isSubmissionLocked(submission.status)) {
    showToast("Only locked submissions can be reopened for review.", "warning");
    return;
  }

  submission.status = workflowStatus.VERIFIED;
  submission.evaluatorVerified = false;
  submission.timestamps = normalizeSubmissionTimestamps(submission.timestamps);
  submission.timestamps.updatedAt = new Date().toISOString();
  submission.timestamps.evaluatedAt = "";
  submission.timestamps.lockedAt = "";
  setEvaluatorTransition(submission.id, "to-pending");
  showToast("Submission moved back to Verified for re-evaluation.", "info");
  renderPage();
}

function submitCategoryForm(form) {
  if (window.adminCriteriaModule && typeof window.adminCriteriaModule.submitCategoryForm === "function") {
    window.adminCriteriaModule.submitCategoryForm(form, getAdminCriteriaContext());
    return;
  }

  showToast("Admin criteria module is not available.", "warning");
}

function submitCriteriaItemForm(form) {
  if (window.adminCriteriaModule && typeof window.adminCriteriaModule.submitCriteriaItemForm === "function") {
    window.adminCriteriaModule.submitCriteriaItemForm(form, getAdminCriteriaContext());
    return;
  }

  showToast("Admin criteria module is not available.", "warning");
}

function deleteCriteriaItem(itemId) {
  if (window.adminCriteriaModule && typeof window.adminCriteriaModule.deleteCriteriaItem === "function") {
    window.adminCriteriaModule.deleteCriteriaItem(itemId, getAdminCriteriaContext());
    return;
  }

  showToast("Admin criteria module is not available.", "warning");
}

function parseRulesFromText(input) {
  if (window.adminCriteriaModule && typeof window.adminCriteriaModule.parseRulesFromText === "function") {
    return window.adminCriteriaModule.parseRulesFromText(input);
  }

  return [];
}

function formatRulesText(rules) {
  if (window.adminCriteriaModule && typeof window.adminCriteriaModule.formatRulesText === "function") {
    return window.adminCriteriaModule.formatRulesText(rules);
  }

  return "";
}

function getNextCriteriaItemId() {
  if (window.adminCriteriaModule && typeof window.adminCriteriaModule.getNextCriteriaItemId === "function") {
    return window.adminCriteriaModule.getNextCriteriaItemId(getAdminCriteriaContext());
  }

  return 101;
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

  if (!Number.isFinite(submission.marks) && isSubmissionScored(submission.status)) {
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

  if (criteriaItem.type === "negative") {
    const count = Number.isFinite(evidence.count) ? evidence.count : 1;
    return count * criteriaItem.marks;
  }

  if (criteriaItem.type === "range") {
    const value = Number.isFinite(evidence.value) ? evidence.value : null;
    if (!Number.isFinite(value)) {
      return 0;
    }

    const matched = getMatchedRangeRule(criteriaItem, value);
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

function getCriteriaMinMarks(criteriaItem, submission) {
  if (!criteriaItem) {
    return -100;
  }

  if (criteriaItem.type === "negative") {
    const count = submission && submission.evidence && Number.isFinite(submission.evidence.count) ? submission.evidence.count : 1;
    return Math.min(0, count * (Number(criteriaItem.marks) || 0));
  }

  if (criteriaItem.type === "range") {
    const marks = (criteriaItem.rules || []).map((rule) => rule.marks);
    return marks.length ? Math.min(...marks, 0) : 0;
  }

  return Math.min(0, Number(criteriaItem.marks) || 0);
}

function getCriteriaMaxMarks(criteriaItem, submission) {
  if (!criteriaItem) {
    return 100;
  }

  if (criteriaItem.type === "negative") {
    return 0;
  }

  if (criteriaItem.type === "count") {
    const count = submission && submission.evidence && Number.isFinite(submission.evidence.count) ? submission.evidence.count : 10;
    const suggested = count * (Number(criteriaItem.marks) || 0);
    return Math.max(0, suggested);
  }

  if (criteriaItem.type === "range") {
    const marks = (criteriaItem.rules || []).map((rule) => rule.marks);
    return marks.length ? Math.max(...marks, 0) : 0;
  }

  return Math.max(0, Number(criteriaItem.marks) || 0);
}

function getSubmissionScoreCapacity(submission) {
  const criteriaItem = getCriteriaById(submission.criteriaId);
  if (!criteriaItem || criteriaItem.type === "negative") {
    return 0;
  }

  if (criteriaItem.type === "range") {
    const marks = (criteriaItem.rules || []).map((rule) => rule.marks).filter((mark) => mark > 0);
    return marks.length ? Math.max(...marks) : 0;
  }

  if (criteriaItem.type === "count") {
    return Math.max(0, calculateMarksByRule(submission, criteriaItem));
  }

  return Math.max(0, Number(criteriaItem.marks) || 0);
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

  if (criteriaItem.type === "negative") {
    return "penalty per count x " + criteriaItem.marks;
  }

  if (criteriaItem.type === "boolean") {
    return "Yes => " + criteriaItem.marks + ", No => 0";
  }

  return "fixed: " + criteriaItem.marks;
}

function formatEvidenceSummary(submission, criteriaItem) {
  if (!criteriaItem) {
    return "-";
  }

  const evidence = normalizeEvidence(submission.evidence);
  const autoMarks = calculateMarksByRule(submission, criteriaItem);

  if (criteriaItem.type === "count") {
    const count = Number.isFinite(evidence.count) ? evidence.count : 0;
    return count + " x " + criteriaItem.marks + " = " + autoMarks.toFixed(1);
  }

  if (criteriaItem.type === "negative") {
    const count = Number.isFinite(evidence.count) ? evidence.count : 1;
    return count + " x " + criteriaItem.marks + " = " + autoMarks.toFixed(1);
  }

  if (criteriaItem.type === "range") {
    const value = Number.isFinite(evidence.value) ? evidence.value : null;
    const matched = getMatchedRangeRule(criteriaItem, value);
    const rangeLabel = matched ? matched.min + "-" + matched.max : "no matching range";
    return Number.isFinite(value) ? value + "% => " + rangeLabel + " = " + autoMarks.toFixed(1) : "No percentage entered";
  }

  if (criteriaItem.type === "boolean") {
    return (evidence.checked ? "Yes" : "No") + " = " + autoMarks.toFixed(1);
  }

  return "Applicable = " + autoMarks.toFixed(1);
}

function getMatchedRangeRule(criteriaItem, value) {
  if (!criteriaItem || !Number.isFinite(value)) {
    return null;
  }

  return (criteriaItem.rules || []).find((rule) => value >= rule.min && value <= rule.max) || null;
}

function getCriteriaTypeLabel(type) {
  if (type === "count") {
    return "Count Based";
  }
  if (type === "range") {
    return "Range Based";
  }
  if (type === "negative") {
    return "Negative Marks";
  }
  if (type === "boolean") {
    return "Yes/No";
  }
  return "Fixed";
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
    if (!isSubmissionScored(submission.status)) {
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
    classEntry.maxScore += getSubmissionScoreCapacity(submission);
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
  const approved = items.filter((item) => isSubmissionScored(item.status)).length;
  const pending = items.filter((item) => isSubmissionSubmitted(item.status) || item.status === workflowStatus.DRAFT).length;
  const rejected = items.filter((item) => isSubmissionRejected(item.status)).length;
  const correction = items.filter((item) => isSubmissionCorrection(item.status)).length;
  const scoredItems = items.filter((item) => isSubmissionScored(item.status));
  const score = scoredItems.reduce((sum, item) => sum + safeMark(getSubmissionEffectiveMarks(item)), 0);
  const maxScore = scoredItems.reduce((sum, item) => sum + getSubmissionScoreCapacity(item), 0);

  return {
    total: total,
    approved: approved,
    pending: pending,
    rejected: rejected,
    correction: correction,
    score: score,
    maxScore: maxScore
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
  return submissions.filter((item) => item.studentId === studentId && isSubmissionScored(item.status));
}

function getCriteriaCategories() {
  return criteriaCatalog;
}

function normalizeAcademicYearValue(year) {
  const raw = String(year || "").trim();
  if (raw) {
    return raw;
  }
  return String(academicYears[0] || "");
}

function getSubmissionAcademicYear(submission) {
  if (!submission || typeof submission !== "object") {
    return "";
  }

  const year = normalizeAcademicYearValue(submission.academicYear);
  if (!submission.academicYear) {
    submission.academicYear = year;
  }
  return year;
}

function getSubmissionsForYear(year) {
  const targetYear = String(year || "").trim();
  if (!targetYear) {
    return submissions;
  }

  return submissions.filter((submission) => getSubmissionAcademicYear(submission) === targetYear);
}

function getAdminUserManagementContext() {
  return {
    state: state,
    users: users,
    departments: state.departments,
    students: students,
    submissions: submissions,
    roleConfig: roleConfig,
    adminManagedRoleOptions: adminManagedRoleOptions,
    findUserByEmail: findUserByEmail,
    findUserById: findUserById,
    normalizeUserRole: normalizeUserRole,
    normalizeEmail: normalizeEmail,
    getRoleLabel: getRoleLabel,
    getUserActivityCount: getUserActivityCount,
    canDeleteUser: canDeleteUser,
    getNextUserId: getNextUserId,
    getNextStudentId: getNextStudentId,
    ensureStudentLinkedToUser: ensureStudentLinkedToUser,
    ensureDepartmentExists: ensureDepartmentExists,
    addRecentActivity: addRecentActivity,
    escapeHtml: escapeHtml,
    escapeAttribute: escapeAttribute,
    showToast: showToast,
    openConfirmModal: openConfirmModal,
    renderPage: renderPage
  };
}

function getAdminDepartmentContext() {
  return {
    state: state,
    getDepartmentList: getDepartmentList,
    ensureDepartmentExists: ensureDepartmentExists,
    removeDepartment: removeDepartment,
    addRecentActivity: addRecentActivity,
    escapeHtml: escapeHtml,
    escapeAttribute: escapeAttribute,
    showToast: showToast,
    openConfirmModal: openConfirmModal,
    renderPage: renderPage
  };
}

function getAdminSettingsContext() {
  return {
    state: state,
    getAcademicYears: function getAcademicYears() {
      return academicYears;
    },
    setSelectedAcademicYear: setSelectedAcademicYear,
    setActiveAcademicYear: setActiveAcademicYear,
    addRecentActivity: addRecentActivity,
    resetDemoData: resetDemoData,
    showToast: showToast,
    openConfirmModal: openConfirmModal,
    renderTopbar: renderTopbar,
    renderPage: renderPage
  };
}

function getAdminCriteriaContext() {
  return {
    state: state,
    academicYears: academicYears,
    criteriaCatalog: criteriaCatalog,
    criteriaByYear: state.criteriaByYear,
    criteriaHistoryByYear: state.criteriaHistoryByYear,
    submissions: submissions,
    getCriteriaCategories: getCriteriaCategories,
    getCriteriaById: getCriteriaById,
    getCategoryById: getCategoryById,
    getCategoryByItemId: getCategoryByItemId,
    getCriteriaHistoryForYear: getCriteriaHistoryForYear,
    getCriteriaTypeLabel: getCriteriaTypeLabel,
    getCriteriaRuleSummary: getCriteriaRuleSummary,
    getAllCriteriaItems: getAllCriteriaItems,
    normalizeCriteriaType: normalizeCriteriaType,
    ensureYearEditAllowed: ensureYearEditAllowed,
    setSelectedAcademicYear: setSelectedAcademicYear,
    escapeHtml: escapeHtml,
    escapeAttribute: escapeAttribute,
    showToast: showToast,
    openConfirmModal: openConfirmModal,
    touchCriteriaUpdate: touchCriteriaUpdate,
    renderTopbar: renderTopbar,
    renderPage: renderPage
  };
}

function setSelectedAcademicYear(year) {
  const hasYear = academicYears.includes(year);
  const nextYear = hasYear ? year : (academicYears[0] || "");
  state.selectedAcademicYear = nextYear;
  ensureCriteriaStoreForYear(nextYear);
  criteriaCatalog = state.criteriaByYear[nextYear];
}

function setActiveAcademicYear(year) {
  if (!academicYears.includes(year)) {
    return;
  }

  state.activeAcademicYear = year;
  state.academicYearState = academicYears.map((itemYear) => ({
    year: itemYear,
    isActive: itemYear === year
  }));
}

function deactivateActiveAcademicYear() {
  state.activeAcademicYear = "";
  state.academicYearState = academicYears.map((itemYear) => ({
    year: itemYear,
    isActive: false
  }));
}

function getActiveAcademicYear() {
  return state.activeAcademicYear || "";
}

function getSystemModeLabel(mode) {
  if (mode === "locked") {
    return "Locked";
  }
  if (mode === "evaluation") {
    return "Evaluation Ongoing";
  }
  return "Setup Mode";
}

function getSystemModeStatusClass(mode) {
  if (mode === "locked") {
    return "status-rejected";
  }
  if (mode === "evaluation") {
    return "status-pending";
  }
  return "status-approved";
}

function ensureYearEditAllowed(actionLabel) {
  const activeYear = getActiveAcademicYear();

  if (!activeYear) {
    showToast(actionLabel + " blocked. No active academic year.", "warning");
    return false;
  }

  if (state.selectedAcademicYear !== activeYear) {
    showToast(actionLabel + " blocked. Switch to the active year (" + activeYear + ") to edit data.", "warning");
    return false;
  }

  if (state.systemMode === "locked") {
    showToast(actionLabel + " blocked. System is locked.", "warning");
    return false;
  }

  return true;
}

function addRecentActivity(message) {
  const now = new Date();
  state.recentActivity.unshift({
    message: message,
    time: now.toLocaleString()
  });
  state.recentActivity = state.recentActivity.slice(0, 25);
}

function touchCriteriaUpdate(message) {
  state.criteriaLastUpdatedAt = new Date().toISOString();
  const yearKey = state.selectedAcademicYear;
  ensureCriteriaStoreForYear(yearKey);
  state.criteriaHistoryByYear[yearKey].unshift({
    message: message,
    at: state.criteriaLastUpdatedAt
  });
  state.criteriaHistoryByYear[yearKey] = state.criteriaHistoryByYear[yearKey].slice(0, 50);
  addRecentActivity(message);
}

function createAcademicYearEntry(rawValue) {
  const yearLabel = String(rawValue || "").trim();
  if (!yearLabel) {
    return;
  }

  if (academicYears.includes(yearLabel)) {
    showToast("Academic year already exists.", "warning");
    return;
  }

  academicYears.unshift(yearLabel);
  state.academicYearState.unshift({ year: yearLabel, isActive: false });
  state.criteriaByYear[yearLabel] = cloneCriteriaCatalog(criteriaCatalog);
  state.criteriaHistoryByYear[yearLabel] = [];
  state.selectedAcademicYear = yearLabel;
  criteriaCatalog = state.criteriaByYear[yearLabel];
  addRecentActivity("Created academic year: " + yearLabel);
  showToast("Academic year " + yearLabel + " created.", "success");
  renderPage();
}

function initializeYearScopedCriteriaStores() {
  const baseCatalog = cloneCriteriaCatalog(criteriaCatalog);

  academicYears.forEach((year, index) => {
    if (index === 0) {
      state.criteriaByYear[year] = criteriaCatalog;
    } else {
      state.criteriaByYear[year] = cloneCriteriaCatalog(baseCatalog);
    }
    state.criteriaHistoryByYear[year] = [];
  });

  const selectedYear = state.selectedAcademicYear;
  ensureCriteriaStoreForYear(selectedYear);
  criteriaCatalog = state.criteriaByYear[selectedYear];
}

function ensureCriteriaStoreForYear(year) {
  const safeYear = String(year || "");
  if (!safeYear) {
    return;
  }

  if (!state.criteriaByYear[safeYear]) {
    state.criteriaByYear[safeYear] = cloneCriteriaCatalog(criteriaCatalog);
  }

  if (!state.criteriaHistoryByYear[safeYear]) {
    state.criteriaHistoryByYear[safeYear] = [];
  }
}

function getCriteriaHistoryForYear(year) {
  ensureCriteriaStoreForYear(year);
  return state.criteriaHistoryByYear[String(year || "")] || [];
}

function handleAdminDashboardAction(action) {
  if (window.adminDashboardModule && typeof window.adminDashboardModule.handleAction === "function") {
    const handled = window.adminDashboardModule.handleAction(action, {
      state: state,
      setActiveAcademicYear: setActiveAcademicYear,
      deactivateActiveAcademicYear: deactivateActiveAcademicYear,
      getActiveAcademicYear: getActiveAcademicYear,
      getSystemModeLabel: getSystemModeLabel,
      setSelectedAcademicYear: setSelectedAcademicYear,
      createAcademicYearEntry: createAcademicYearEntry,
      resetDemoData: resetDemoData,
      addRecentActivity: addRecentActivity,
      navigateToPage: navigateToPage,
      showToast: showToast,
      openConfirmModal: openConfirmModal,
      renderPage: renderPage,
      renderTopbar: renderTopbar
    });

    if (handled) {
      return;
    }
  }

  showToast("Admin action not available in this page context.", "warning");
}

function normalizeDepartmentLabel(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function buildDepartmentOptionsFromUsers(userList) {
  const departments = [];

  (userList || []).forEach((user) => {
    const label = normalizeDepartmentLabel(user && user.department);
    if (!label) {
      return;
    }

    if (departments.indexOf(label) === -1) {
      departments.push(label);
    }
  });

  departments.sort((a, b) => a.localeCompare(b));
  return departments;
}

function getDepartmentList() {
  if (!Array.isArray(state.departments)) {
    state.departments = [];
  }

  if (!state.departments.length) {
    state.departments = buildDepartmentOptionsFromUsers(users);
  }

  return state.departments;
}

function ensureDepartmentExists(name) {
  const label = normalizeDepartmentLabel(name);
  if (!label) {
    return false;
  }

  const departments = getDepartmentList();
  const normalized = label.toLowerCase();
  const exists = departments.some((item) => normalizeDepartmentLabel(item).toLowerCase() === normalized);

  if (!exists) {
    departments.push(label);
    departments.sort((a, b) => a.localeCompare(b));
  }

  return true;
}

function removeDepartment(name) {
  const target = normalizeDepartmentLabel(name);
  if (!target) {
    return false;
  }

  const normalizedTarget = target.toLowerCase();

  const inUse = users.some((user) => normalizeDepartmentLabel(user.department).toLowerCase() === normalizedTarget);
  if (inUse) {
    return false;
  }

  const before = getDepartmentList().length;
  state.departments = getDepartmentList().filter((item) => normalizeDepartmentLabel(item).toLowerCase() !== normalizedTarget);
  return state.departments.length !== before;
}

function resetDemoData() {
  criteriaCatalog = getDefaultCriteriaCatalog();
  submissions = getDefaultSubmissions();
  users = createInitialUsers();
  academicYears = defaultAcademicYears.slice();

  state.selectedAcademicYear = academicYears[0] || "";
  state.activeAcademicYear = state.selectedAcademicYear;
  state.academicYearState = createAcademicYearState(academicYears, state.activeAcademicYear);
  state.systemMode = "setup";
  state.submissionOpen = true;
  state.evaluationOpen = true;

  state.criteriaLastUpdatedAt = null;
  state.recentActivity = [];
  state.criteriaByYear = {};
  state.criteriaHistoryByYear = {};

  state.editingCriteriaItemId = null;
  state.editingCategoryId = null;
  state.editingSubmissionId = null;
  state.editingUserId = null;
  state.showUserForm = false;
  state.pendingApprovalUserId = null;
  state.userSearchQuery = "";
  state.userFilterType = "all";
  state.userFilterValue = "all";
  state.userSortKey = "name";
  state.userSortDirection = "asc";
  state.listViews = {
    studentSubmissions: createDefaultListViewState(),
    teacherVerification: createDefaultListViewState(),
    evaluatorEvaluation: createDefaultEvaluatorListViewState()
  };
  state.adminUserListView = null;

  const firstCategory = criteriaCatalog[0];
  const firstItem = firstCategory && firstCategory.items && firstCategory.items[0];
  state.selectedSubmissionCategoryId = firstCategory ? firstCategory.id : "";
  state.selectedSubmissionItemId = firstItem ? firstItem.id : "";

  state.departments = buildDepartmentOptionsFromUsers(users);

  resetEvaluatorFlow();
  initializeYearScopedCriteriaStores();
  bootstrapComputedMarks();
}

function createInitialUsers() {
  const studentUsers = students.map((student) => {
    return {
      id: student.id,
      name: student.name,
      email: buildUserEmail(student.name, "student"),
      role: "student",
      department: getDepartmentByClassName(student.className),
      class: student.className,
      isApproved: true,
      status: "Active",
      linkedStudentId: student.id
    };
  });

  const staffUsers = [
    {
      id: 1001,
      name: "Meera Thomas",
      email: "meera.thomas@college.edu",
      role: "teacher",
      department: "Computer Science",
      class: "",
      isApproved: true,
      status: "Active",
      linkedStudentId: null
    },
    {
      id: 1002,
      name: "Vinod Kumar",
      email: "vinod.kumar@college.edu",
      role: "evaluator",
      department: "Evaluation Cell",
      class: "",
      isApproved: true,
      status: "Active",
      linkedStudentId: null
    },
    {
      id: 1003,
      name: "Latha Nair",
      email: "latha.nair@college.edu",
      role: "hod",
      department: "IQAC",
      class: "",
      isApproved: true,
      status: "Active",
      linkedStudentId: null
    },
    {
      id: 1004,
      name: "Admin User",
      email: "admin@college.edu",
      role: "admin",
      department: "Administration",
      class: "",
      isApproved: true,
      status: "Active",
      linkedStudentId: null
    }
  ];

  return studentUsers.concat(staffUsers);
}

function buildUserEmail(name, fallbackPrefix) {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const prefix = base || String(fallbackPrefix || "user").toLowerCase();
  return prefix + "@college.edu";
}

function normalizeUserRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "teacher" || normalized === "class teacher") {
    return "teacher";
  }
  if (normalized === "evaluator" || normalized === "evaluation team") {
    return "evaluator";
  }
  if (normalized === "hod" || normalized === "iqac" || normalized === "hod / iqac") {
    return "hod";
  }
  if (normalized === "admin") {
    return "admin";
  }
  return "student";
}

function getRoleLabel(role) {
  const roleKey = normalizeUserRole(role);
  return roleConfig[roleKey] ? roleConfig[roleKey].label : "Student";
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  return users.find((item) => normalizeEmail(item.email) === normalizedEmail) || null;
}

function findUserById(userId) {
  const safeId = Number(userId);
  if (!Number.isFinite(safeId)) {
    return null;
  }
  return users.find((item) => Number(item.id) === safeId) || null;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getUserActivityCount(user) {
  if (!user) {
    return 0;
  }

  const linkedStudentId = Number(user.linkedStudentId);
  if (!Number.isFinite(linkedStudentId)) {
    return 0;
  }

  return submissions.filter((item) => Number(item.studentId) === linkedStudentId).length;
}

function canDeleteUser(user) {
  return getUserActivityCount(user) === 0;
}

function getNextUserId() {
  const ids = users.map((item) => Number(item.id)).filter((value) => Number.isFinite(value));
  const max = ids.length ? Math.max.apply(null, ids) : 1000;
  return max + 1;
}

function getNextStudentId() {
  const ids = students.map((item) => Number(item.id)).filter((value) => Number.isFinite(value));
  const max = ids.length ? Math.max.apply(null, ids) : 0;
  return max + 1;
}

function ensureStudentLinkedToUser(user) {
  if (!user || normalizeUserRole(user.role) !== "student") {
    return null;
  }

  const currentLinked = Number(user.linkedStudentId);
  if (Number.isFinite(currentLinked) && getStudentById(currentLinked)) {
    return currentLinked;
  }

  const className = String(user.class || "").trim() || String(user.department || "").trim() || "General";
  const normalizedName = String(user.name || "").trim().toLowerCase();
  const normalizedClass = className.toLowerCase();
  const matched = students.find((student) => {
    return String(student.name || "").trim().toLowerCase() === normalizedName &&
      String(student.className || "").trim().toLowerCase() === normalizedClass;
  });

  if (matched) {
    user.linkedStudentId = matched.id;
    return matched.id;
  }

  if (user.isApproved === false) {
    return null;
  }

  const nextStudentId = getNextStudentId();
  students.push({
    id: nextStudentId,
    name: user.name,
    className: className
  });
  user.linkedStudentId = nextStudentId;
  return nextStudentId;
}

function getCurrentActorLabel() {
  const user = findUserById(state.currentUserId);
  if (user && user.name) {
    return user.name + " (" + getRoleLabel(user.role) + ")";
  }

  const role = roleConfig[state.currentRole];
  return role ? role.label : "System";
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
  if (normalized === "verified" || normalized === "evaluated" || normalized === "locked" || normalized === "approved") {
    return "status-approved";
  }
  if (normalized === "rejected") {
    return "status-rejected";
  }
  if (normalized === "pending" || normalized === "submitted") {
    return "status-pending";
  }
  if (normalized.indexOf("correction") > -1) {
    return "status-correction";
  }
  if (normalized === "draft") {
    return "status-neutral";
  }
  return "status-neutral";
}

function resetEvaluatorFlow() {
  state.evaluatorView = "departments";
  state.evaluatorDepartment = "";
  state.evaluatorStudentId = null;
  state.evaluatorTransition = null;
  if (evaluatorTransitionResetTimer) {
    clearTimeout(evaluatorTransitionResetTimer);
    evaluatorTransitionResetTimer = null;
  }
}

function setEvaluatorTransition(submissionId, direction) {
  state.evaluatorTransition = {
    submissionId: Number(submissionId),
    direction: String(direction || "")
  };

  if (evaluatorTransitionResetTimer) {
    clearTimeout(evaluatorTransitionResetTimer);
  }

  evaluatorTransitionResetTimer = setTimeout(() => {
    state.evaluatorTransition = null;
    evaluatorTransitionResetTimer = null;
  }, 700);
}

function openConfirmModal(title, message, action) {
  if (!ui.confirmModal || !ui.confirmTitle || !ui.confirmMessage) {
    return;
  }

  pendingConfirmationAction = action;
  ui.confirmTitle.textContent = title;
  ui.confirmMessage.textContent = message;
  
  if (ui.confirmAccept) {
    ui.confirmAccept.textContent = "Confirm";
    ui.confirmAccept.className = "btn danger";
  }
  if (ui.confirmCancel) {
    ui.confirmCancel.classList.remove("hidden");
  }

  ui.confirmModal.classList.remove("hidden");
  ui.confirmModal.setAttribute("aria-hidden", "false");
}

function closeConfirmModal() {
  if (!ui.confirmModal) {
    pendingConfirmationAction = null;
    return;
  }

  pendingConfirmationAction = null;
  ui.confirmModal.classList.add("hidden");
  ui.confirmModal.setAttribute("aria-hidden", "true");
}

function showToast(message, variant) {
  if (!ui.toastContainer) {
    return;
  }

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
  return cloneCriteriaCatalog(window.criteriaData || []);
}

function getDefaultSubmissions() {
  return cloneSubmissions(window.seedSubmissions || []);
}








