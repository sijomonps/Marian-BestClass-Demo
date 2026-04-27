const roleConfig = {
  student: {
    label: "Student",
    heading: "Student Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "◉" },
      { page: "submit", label: "Submit Activity", icon: "✦" },
      { page: "submissions", label: "My Submissions", icon: "▦" }
    ]
  },
  teacher: {
    label: "Class Teacher",
    heading: "Teacher Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "◉" },
      { page: "verification", label: "Verification", icon: "✓" }
    ]
  },
  evaluator: {
    label: "Evaluator",
    heading: "Evaluation Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "◉" },
      { page: "evaluation", label: "Evaluation", icon: "◌" }
    ]
  },
  admin: {
    label: "Admin",
    heading: "Admin Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "◉" },
      { page: "criteria", label: "Criteria Management", icon: "⚙" },
      { page: "users", label: "User Management", icon: "👥" }
    ]
  },
  hod: {
    label: "HOD / IQAC",
    heading: "HOD / IQAC Workspace",
    menu: [
      { page: "dashboard", label: "Dashboard", icon: "◉" },
      { page: "reports", label: "Reports", icon: "◨" }
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

let academicYears = ["2025-2026", "2024-2025", "2023-2024"];

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
  systemMode: "setup",
  criteriaLastUpdatedAt: null,
  recentActivity: [],
  evaluatorView: "departments",
  evaluatorDepartment: "",
  evaluatorStudentId: null,
  evaluatorTransition: null,
  selectedSubmissionCategoryId: "",
  selectedSubmissionItemId: "",
  editingCriteriaItemId: null,
  editingCategoryId: null,
  editingUserId: null,
  showUserForm: false,
  userSearchQuery: "",
  userFilterType: "all",
  userFilterValue: "all",
  userSortKey: "name",
  userSortDirection: "asc",
  criteriaByYear: {},
  criteriaHistoryByYear: {}
};

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
    return {
      id: Number(submission.id) || index + 1,
      studentId: Number(submission.studentId) || 1,
      criteriaId: Number(submission.criteriaId) || 0,
      academicYear: normalizeAcademicYearValue(submission.academicYear),
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
  if (ui.loginForm) {
    ui.loginForm.addEventListener("submit", handleLogin);
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
  const role = String(formData.get("role") || "student");
  const email = String(formData.get("email") || "").trim();

  if (email) {
    const matchedUser = findUserByEmail(email);
    if (matchedUser && matchedUser.status === "Inactive") {
      showToast("This user is inactive. Contact admin to reactivate access.", "warning");
      return;
    }

    if (matchedUser && matchedUser.role !== role) {
      showToast("Role mismatch. Login with your assigned role: " + getRoleLabel(matchedUser.role) + ".", "warning");
      return;
    }

    state.currentUserId = matchedUser ? matchedUser.id : null;
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
  resetEvaluatorFlow();

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
  state.editingCriteriaItemId = null;
  resetEvaluatorFlow();
  if (ui.sidebar) {
    ui.sidebar.classList.remove("open");
  }
  closeConfirmModal();

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
    } else {
      content = renderStudentDashboard();
    }
  } else if (state.currentRole === "teacher") {
    content = state.activePage === "verification" ? renderTeacherVerificationPage() : renderTeacherDashboard();
  } else if (state.currentRole === "evaluator") {
    content = state.activePage === "evaluation" ? renderEvaluatorEvaluationPage() : renderEvaluatorDashboard();
  } else if (state.currentRole === "admin") {
    if (state.activePage === "criteria") {
      content = renderAdminCriteriaPage();
    } else if (state.activePage === "users") {
      content = renderAdminUserManagementPage();
    } else {
      content = renderAdminDashboard();
    }
  } else {
    content = state.activePage === "reports" ? renderHodReportsPage() : renderHodDashboard();
  }

  ui.pageContent.innerHTML = "<div class=\"page-stack\">" + content + "</div>";
}

function renderDashboardCards(metrics) {
  const displayMax = Number.isFinite(metrics.maxScore) ? metrics.maxScore : 0;
  const safeMax = Math.max(1, displayMax);
  const scorePercent = Math.min(100, Math.max(0, (metrics.score / safeMax) * 100));

  const cards = [
    { key: "total", icon: "◉", label: "Total Submissions", value: metrics.total },
    { key: "approved", icon: "✓", label: "Approved", value: metrics.approved },
    { key: "pending", icon: "◔", label: "Pending", value: metrics.pending },
    {
      key: "score",
      icon: "◈",
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
    { key: "Approved", value: counts.approved, className: "progress-approved" },
    { key: "Pending", value: counts.pending, className: "progress-pending" },
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
    if (submission.status !== "Approved") {
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
      "<p class=\"empty-state\">No approved marks available yet.</p>" +
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
          "<div class=\"progress-meta\"><span>" + escapeHtml(row.category) + "</span><span>" + row.count + " approved | " + row.score.toFixed(1) + " marks</span></div>" +
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
    "<span class=\"progress-pill progress-pill-remaining\">⬜ Remaining " + progress.remainingCount + "</span>" +
    "</div>" +
    "</section>"
  );
}

function renderStudentChecklistSection(categories) {
  const rows = categories
    .map((item) => {
      const icon = item.completed ? "✔" : "⬜";
      const action = item.completed
        ? "<span class=\"check-done\">Done</span>"
        : "<button type=\"button\" class=\"btn ghost mini-add-btn\" data-submit-category=\"" + escapeAttribute(item.id) + "\">＋</button>";

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
    "<button type=\"button\" class=\"btn primary\" data-page-jump=\"submit\">✦ Submit New Activity</button>" +
    "<button type=\"button\" class=\"btn ghost\" data-page-jump=\"submissions\">▦ View My Submissions</button>" +
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

  const dynamicInput = selectedItem ? renderStudentEvidenceInput(selectedItem) : "";
  const criteriaRule = selectedItem ? renderCriteriaRuleCard(selectedItem) : "";

  return (
    "<section class=\"section-header\">" +
    "<div><h1>Submit Activity</h1><p class=\"muted\">Select category and item to submit activity evidence.</p></div>" +
    "</section>" +
    "<section class=\"panel\">" +
    "<form id=\"student-submission-form\" class=\"stack-form two-col\">" +
    "<div class=\"field\"><label for=\"submission-category\">Category</label><select id=\"submission-category\" name=\"categoryId\" required>" + categoryOptions + "</select></div>" +
    "<div class=\"field\"><label for=\"submission-criteria\">Item</label><select id=\"submission-criteria\" name=\"criteriaId\" required>" + itemOptions + "</select></div>" +
    criteriaRule +
    dynamicInput +
    "<div class=\"field\"><label for=\"submission-proof\">Upload Proof</label><input id=\"submission-proof\" name=\"proof\" type=\"file\" required /></div>" +
    "<div class=\"field full-span\"><label for=\"submission-description\">Description</label><textarea id=\"submission-description\" name=\"description\" placeholder=\"Describe the activity\" required></textarea></div>" +
    "<div class=\"button-row full-span\"><button type=\"submit\" class=\"btn primary\">⬆ Submit</button></div>" +
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

function renderStudentEvidenceInput(criteriaItem) {
  if (criteriaItem.type === "count") {
    return "<div class=\"field\"><label for=\"submission-count\">Count</label><input id=\"submission-count\" name=\"countValue\" type=\"number\" min=\"1\" step=\"1\" required /><p class=\"muted\">Marks = count x " + criteriaItem.marks + "</p></div>";
  }

  if (criteriaItem.type === "negative") {
    return "<div class=\"field\"><label for=\"submission-count\">Count</label><input id=\"submission-count\" name=\"countValue\" type=\"number\" min=\"1\" step=\"1\" required /><p class=\"muted\">Penalty = count x " + criteriaItem.marks + "</p></div>";
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
            "<td>" + escapeHtml(formatEvidenceSummary(item, criteriaItem)) + "</td>" +
            "<td>" + escapeHtml(item.description) + "</td>" +
            "<td><span class=\"status-pill " + getStatusClass(item.status) + "\">" + escapeHtml(item.status) + "</span></td>" +
            "<td>" + preview.toFixed(1) + "</td>" +
            "<td>" + (Number.isFinite(item.marks) ? item.marks : "-") + "</td>" +
            "</tr>"
          );
        })
        .join("")
    : "<tr><td colspan=\"7\" class=\"empty-row\">No submissions yet</td></tr>";

  return (
    "<section class=\"section-header\">" +
    "<div><h1>My Submissions</h1><p class=\"muted\">Live status of all activities you submitted.</p></div>" +
    "</section>" +
    "<section class=\"panel\">" +
    "<div class=\"table-wrap\">" +
    "<table><thead><tr><th>◈ Category</th><th>◌ Item</th><th>▣ Evidence</th><th>✎ Description</th><th>◔ Status</th><th>Rule Marks</th><th>Final Marks</th></tr></thead><tbody>" + rows + "</tbody></table>" +
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
    renderRecentActivityPanel(submissions, "Latest Verification Items", 5) +
    "<section class=\"panel\">" +
    "<div class=\"button-row\">" +
    "<button type=\"button\" class=\"btn primary\" data-page-jump=\"verification\">✓ Open Verification Desk</button>" +
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
            "<p><strong>Evidence:</strong> " + escapeHtml(formatEvidenceSummary(item, criteriaItem)) + "</p>" +
            "<p><strong>Rule Marks Preview:</strong> " + previewMarks.toFixed(1) + "</p>" +
            "<p><strong>Description:</strong> " + escapeHtml(item.description) + "</p>" +
            "<p><strong>Proof:</strong> " + escapeHtml(item.proof || "-") + "</p>" +
            "</div>" +
            "<div class=\"field\"><label>Teacher Remark</label><input type=\"text\" data-remark-input=\"" + item.id + "\" value=\"" + escapeAttribute(item.remarks || "") + "\" placeholder=\"Add a remark\" /></div>" +
            "<div class=\"button-row\">" +
            "<button type=\"button\" class=\"btn success\" data-teacher-action=\"Approved\" data-id=\"" + item.id + "\">✓ Approve</button>" +
            "<button type=\"button\" class=\"btn danger\" data-teacher-action=\"Rejected\" data-id=\"" + item.id + "\">✕ Reject</button>" +
            "<button type=\"button\" class=\"btn warn\" data-teacher-action=\"Correction Requested\" data-id=\"" + item.id + "\">↺ Request Correction</button>" +
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
    score: approved.reduce((sum, item) => sum + safeMark(getSubmissionEffectiveMarks(item)), 0),
    maxScore: approved.reduce((sum, item) => sum + getSubmissionScoreCapacity(item), 0)
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
    renderRecentActivityPanel(approved, "Approved Submissions for Evaluation", 5) +
    "<section class=\"panel\"><div class=\"button-row\"><button type=\"button\" class=\"btn primary\" data-page-jump=\"evaluation\">◌ Go to Evaluation</button></div></section>"
  );
}

function renderEvaluatorEvaluationPage() {
  const approvedSubmissions = submissions
    .filter((item) => item.status === "Approved")
    .sort((a, b) => b.id - a.id);

  const pendingSubmissions = approvedSubmissions.filter((item) => !Boolean(item.evaluatorVerified));
  const completedSubmissions = approvedSubmissions.filter((item) => Boolean(item.evaluatorVerified));

  return (
    "<section class=\"section-header\">" +
    "<div><h1>Evaluation</h1><p class=\"muted\">One action per item. Verify pending submissions and review completed ones.</p></div>" +
    "</section>" +
    renderEvaluatorQueueSection("Pending", "pending", pendingSubmissions, "No pending submissions right now.") +
    renderEvaluatorQueueSection("Completed", "completed", completedSubmissions, "No completed submissions yet.")
  );
}

function renderEvaluatorQueueSection(title, sectionType, items, emptyMessage) {
  const sectionClass = sectionType === "completed" ? "eval-section eval-section-completed" : "eval-section eval-section-pending";
  const badgeClass = sectionType === "completed" ? "eval-title-badge eval-title-badge-completed" : "eval-title-badge eval-title-badge-pending";
  const cards = items.length
    ? items.map((item) => renderEvaluatorQueueCard(item, sectionType)).join("")
    : "<p class=\"empty-state\">" + escapeHtml(emptyMessage) + "</p>";

  return (
    "<section class=\"panel " + sectionClass + "\">" +
    "<div class=\"eval-section-head\">" +
    "<div><span class=\"" + badgeClass + "\">" + escapeHtml(title) + "</span><h3>" + escapeHtml(title) + " Submissions</h3></div>" +
    "<p class=\"muted\">" + items.length + " item" + (items.length === 1 ? "" : "s") + "</p>" +
    "</div>" +
    (items.length ? "<div class=\"submission-grid eval-grid\">" + cards + "</div>" : cards) +
    "</section>"
  );
}

function renderEvaluatorQueueCard(item, sectionType) {
  const criteriaItem = getCriteriaById(item.criteriaId);
  const student = getStudentById(item.studentId);
  const autoMarks = calculateMarksByRule(item, criteriaItem);
  const currentMarks = Number.isFinite(item.marks) ? item.marks : "";
  const minMarks = getCriteriaMinMarks(criteriaItem, item);
  const maxMarks = getCriteriaMaxMarks(criteriaItem, item);
  const transition = state.evaluatorTransition;
  let transitionClass = "";

  if (transition && transition.submissionId === item.id) {
    if (transition.direction === "to-completed" && sectionType === "completed") {
      transitionClass = " eval-card-enter-completed";
    } else if (transition.direction === "to-pending" && sectionType === "pending") {
      transitionClass = " eval-card-enter-pending";
    }
  }

  const actionHtml = sectionType === "pending"
    ? "<div class=\"field eval-manual-field\"><label for=\"eval-manual-" + item.id + "\">Manual Marks (Optional)</label><input id=\"eval-manual-" + item.id + "\" data-evaluator-manual=\"" + item.id + "\" type=\"number\" min=\"" + minMarks + "\" max=\"" + maxMarks + "\" step=\"0.5\" placeholder=\"Leave blank to use auto marks\" value=\"" + escapeAttribute(currentMarks === autoMarks ? "" : currentMarks) + "\" /></div>" +
      "<div class=\"button-row\"><button type=\"button\" class=\"btn primary full\" data-evaluator-verify-save=\"" + item.id + "\">✔ Verify &amp; Save</button></div>"
    : "<div class=\"meta-list\"><p><strong>Status:</strong> Completed</p><p><strong>Marks:</strong> " + safeMark(getSubmissionEffectiveMarks(item)).toFixed(1) + "</p></div>" +
      "<div class=\"button-row\"><button type=\"button\" class=\"btn ghost\" data-evaluator-edit=\"" + item.id + "\">Edit</button></div>";

  return (
    "<article class=\"submission-card eval-card eval-card-" + sectionType + transitionClass + "\">" +
    "<div class=\"submission-head\"><h4>" + escapeHtml(criteriaItem ? criteriaItem.title : "Removed Item") + "</h4><span class=\"status-pill " + (sectionType === "completed" ? "status-approved" : "status-pending") + "\">" + (sectionType === "completed" ? "Completed" : "Pending") + "</span></div>" +
    "<div class=\"meta-list\">" +
    "<p><strong>Student:</strong> " + escapeHtml(student ? student.name : "Unknown Student") + "</p>" +
    "<p><strong>Class:</strong> " + escapeHtml(student ? student.className : "-") + "</p>" +
    "<p><strong>Category:</strong> " + escapeHtml(getCriteriaCategoryLabel(criteriaItem)) + "</p>" +
    "<p><strong>Description:</strong> " + escapeHtml(item.description) + "</p>" +
    "<p><strong>Proof:</strong> " + escapeHtml(item.proof || "-") + "</p>" +
    "<p><strong>Auto Marks:</strong> " + autoMarks.toFixed(1) + "</p>" +
    "</div>" +
    actionHtml +
    "</article>"
  );
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
    "<hr /><h3>Add Category</h3><form id=\"category-form\" class=\"stack-form\"><div class=\"field\"><label for=\"category-title\">Category Name</label><input id=\"category-title\" name=\"categoryTitle\" type=\"text\" required /></div><div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">＋ Add Category</button></div></form></article>" +
    "<article class=\"panel\"><h3>" + (editingItem ? "Edit Criteria Item" : "Add Criteria Item") + "</h3>" +
    "<form id=\"criteria-item-form\" class=\"stack-form\" data-editing-item=\"" + (editingItem ? editingItem.id : "") + "\">" +
    "<div class=\"field\"><label for=\"criteria-item-category\">Category</label><select id=\"criteria-item-category\" name=\"categoryId\" required>" + categoryOptions + "</select></div>" +
    "<div class=\"field\"><label for=\"criteria-item-title\">Title</label><input id=\"criteria-item-title\" name=\"title\" type=\"text\" required value=\"" + escapeAttribute(editingItem ? editingItem.title : "") + "\" /></div>" +
    "<div class=\"field\"><label for=\"criteria-item-type\">Type</label><select id=\"criteria-item-type\" name=\"type\"><option value=\"fixed\"" + fixedSelected + ">Fixed / Boolean</option><option value=\"count\"" + countSelected + ">Count Based</option><option value=\"range\"" + rangeSelected + ">Range Based</option><option value=\"negative\"" + negativeSelected + ">Negative Marks</option></select></div>" +
    "<div class=\"field\"><label for=\"criteria-item-marks\">Marks (fixed/count/negative)</label><input id=\"criteria-item-marks\" name=\"marks\" type=\"number\" step=\"0.5\" value=\"" + (editingItem && Number.isFinite(editingItem.marks) ? editingItem.marks : "") + "\" /></div>" +
    "<div class=\"field\"><label for=\"criteria-item-rules\">Range Rules (for range type)</label><textarea id=\"criteria-item-rules\" name=\"rules\" placeholder=\"90-100:5, 80-89.99:4\">" + escapeHtml(editingItem ? formatRulesText(editingItem.rules || []) : "") + "</textarea></div>" +
    "<div class=\"button-row\"><button type=\"submit\" class=\"btn primary\">" + (editingItem ? "✎ Update Item" : "＋ Add Item") + "</button><button type=\"button\" id=\"cancel-item-edit\" class=\"btn ghost " + (editingItem ? "" : "hidden") + "\">Cancel</button></div>" +
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

function renderHodDashboard() {
  const performance = buildClassPerformance();
  const metrics = {
    total: submissions.length,
    approved: submissions.filter((item) => item.status === "Approved").length,
    pending: submissions.filter((item) => item.status === "Pending").length,
    rejected: submissions.filter((item) => item.status === "Rejected").length,
    correction: submissions.filter((item) => String(item.status).toLowerCase().indexOf("correction") > -1).length,
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
    navigateToPage(pageJump.dataset.pageJump);
    return;
  }

  const adminActionButton = event.target.closest("button[data-admin-action]");
  if (adminActionButton) {
    handleAdminDashboardAction(String(adminActionButton.dataset.adminAction || ""));
    return;
  }

  if (state.currentRole === "admin" && window.adminUserManagementModule && typeof window.adminUserManagementModule.handleClick === "function") {
    const handledAdminUserClick = window.adminUserManagementModule.handleClick(event, getAdminUserManagementContext());
    if (handledAdminUserClick) {
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

  const editCompletedButton = event.target.closest("button[data-evaluator-edit]");
  if (editCompletedButton) {
    moveEvaluatorSubmissionToPending(Number(editCompletedButton.dataset.evaluatorEdit));
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

  if (state.currentRole === "admin" && window.adminUserManagementModule && typeof window.adminUserManagementModule.handleSubmit === "function") {
    const handledAdminUserSubmit = window.adminUserManagementModule.handleSubmit(event, getAdminUserManagementContext());
    if (handledAdminUserSubmit) {
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

  if (state.currentRole === "admin" && window.adminCriteriaModule && typeof window.adminCriteriaModule.handleChange === "function") {
    const handledAdminChange = window.adminCriteriaModule.handleChange(event, getAdminCriteriaContext());
    if (handledAdminChange) {
      return;
    }
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

function submitStudentSubmission(form) {
  if (!ensureYearEditAllowed("Submission create/update")) {
    return;
  }

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

  const proofFile = form.querySelector("input[name='proof']");
  const proofName = proofFile && proofFile.files && proofFile.files[0] ? proofFile.files[0].name : "proof-file.pdf";

  const nextId = submissions.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
  const newSubmission = {
    id: nextId,
    studentId: state.currentStudentId,
    criteriaId: criteriaId,
    academicYear: state.selectedAcademicYear,
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

  submission.status = nextStatus;
  submission.remarks = remarkValue;

  if (nextStatus === "Approved") {
    submission.marks = calculateMarksByRule(submission, getCriteriaById(submission.criteriaId));
  } else {
    submission.marks = null;
    submission.evaluatorVerified = false;
  }

  showToast("Submission " + submissionId + " marked as " + nextStatus + ".", "success");
  renderPage();
}

function verifyAndSaveEvaluatorSubmission(submissionId) {
  if (!ensureYearEditAllowed("Evaluator marks update")) {
    return;
  }

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

  submission.marks = marks;
  submission.evaluatorVerified = true;
  setEvaluatorTransition(submission.id, "to-completed");
  showToast("Submission verified and saved.", "success");
  renderPage();
}

function moveEvaluatorSubmissionToPending(submissionId) {
  if (!ensureYearEditAllowed("Evaluator status update")) {
    return;
  }

  const submission = submissions.find((item) => item.id === submissionId);
  if (!submission) {
    showToast("Submission not found.", "error");
    return;
  }

  if (submission.status !== "Approved") {
    showToast("Only approved submissions can be moved for evaluator review.", "warning");
    return;
  }

  submission.evaluatorVerified = false;
  setEvaluatorTransition(submission.id, "to-pending");
  showToast("Submission moved to Pending for re-evaluation.", "info");
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

  return "fixed/boolean: " + criteriaItem.marks;
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
  return "Fixed / Boolean";
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
  const approved = items.filter((item) => item.status === "Approved").length;
  const pending = items.filter((item) => item.status === "Pending").length;
  const rejected = items.filter((item) => item.status === "Rejected").length;
  const correction = items.filter((item) => String(item.status).toLowerCase().indexOf("correction") > -1).length;
  const approvedItems = items.filter((item) => item.status === "Approved");
  const score = approvedItems.reduce((sum, item) => sum + safeMark(getSubmissionEffectiveMarks(item)), 0);
  const maxScore = approvedItems.reduce((sum, item) => sum + getSubmissionScoreCapacity(item), 0);

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
  return submissions.filter((item) => item.studentId === studentId && item.status === "Approved");
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
    students: students,
    submissions: submissions,
    roleConfig: roleConfig,
    adminManagedRoleOptions: adminManagedRoleOptions,
    findUserByEmail: findUserByEmail,
    findUserById: findUserById,
    normalizeUserRole: normalizeUserRole,
    getRoleLabel: getRoleLabel,
    getUserActivityCount: getUserActivityCount,
    canDeleteUser: canDeleteUser,
    getNextUserId: getNextUserId,
    addRecentActivity: addRecentActivity,
    escapeHtml: escapeHtml,
    escapeAttribute: escapeAttribute,
    showToast: showToast,
    openConfirmModal: openConfirmModal,
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
      createAcademicYearEntry: createAcademicYearEntry,
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

function createInitialUsers() {
  const studentUsers = students.map((student) => {
    return {
      id: student.id,
      name: student.name,
      email: buildUserEmail(student.name, "student"),
      role: "student",
      department: student.className,
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
      status: "Active",
      linkedStudentId: null
    },
    {
      id: 1002,
      name: "Vinod Kumar",
      email: "vinod.kumar@college.edu",
      role: "evaluator",
      department: "Evaluation Cell",
      status: "Active",
      linkedStudentId: null
    },
    {
      id: 1003,
      name: "Latha Nair",
      email: "latha.nair@college.edu",
      role: "hod",
      department: "IQAC",
      status: "Active",
      linkedStudentId: null
    },
    {
      id: 1004,
      name: "Admin User",
      email: "admin@college.edu",
      role: "admin",
      department: "Administration",
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
