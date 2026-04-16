const roleConfig = {
  student: {
    label: "Student",
    navLabel: "My Dashboard",
    heading: "Student Dashboard"
  },
  teacher: {
    label: "Class Teacher",
    navLabel: "Review Queue",
    heading: "Class Teacher Dashboard"
  },
  evaluator: {
    label: "Evaluator",
    navLabel: "Evaluation Desk",
    heading: "Evaluation Team Dashboard"
  },
  admin: {
    label: "Admin",
    navLabel: "Criteria Management",
    heading: "Admin Panel"
  },
  hod: {
    label: "HOD / IQAC",
    navLabel: "Performance View",
    heading: "HOD / IQAC Dashboard"
  }
};

const academicYears = ["2025-2026", "2024-2025", "2023-2024"];

const students = [
  { id: 1, name: "Anika Sharma", className: "BSc CS A", department: "Computer Science" },
  { id: 2, name: "Rahul Menon", className: "BSc CS A", department: "Computer Science" },
  { id: 3, name: "Sara Joseph", className: "BCom B", department: "Commerce" },
  { id: 4, name: "Arjun Das", className: "BCom B", department: "Commerce" },
  { id: 5, name: "Nisha Iyer", className: "BA English C", department: "English" },
  { id: 6, name: "Vikram Patel", className: "BA English C", department: "English" }
];
// Track selected department for evaluator
state.selectedDepartment = null;
function getDepartments() {
  return Array.from(new Set(students.map(s => s.department)));
}

function getStudentsByDepartment(dept) {
  return students.filter(s => s.department === dept);
}

let criteria = [
  { id: 1, name: "Sports", maxMarks: 10 },
  { id: 2, name: "Arts", maxMarks: 15 },
  { id: 3, name: "NSS / Social Service", maxMarks: 20 },
  { id: 4, name: "Innovation Project", maxMarks: 25 }
];

let submissions = [
  {
    id: 1,
    studentId: 1,
    criteriaId: 1,
    description: "Inter-college football runner-up participation.",
    status: "Approved",
    remarks: "Strong participation",
    marks: 8,
    proof: "football_certificate.pdf"
  },
  {
    id: 2,
    studentId: 1,
    criteriaId: 2,
    description: "Classical dance performance in annual arts fest.",
    status: "Pending",
    remarks: "",
    marks: null,
    proof: "dance_photo.jpg"
  },
  {
    id: 3,
    studentId: 2,
    criteriaId: 3,
    description: "Participated in local clean-up drive.",
    status: "Rejected",
    remarks: "Need coordinator signature",
    marks: null,
    proof: "drive_report.docx"
  },
  {
    id: 4,
    studentId: 3,
    criteriaId: 4,
    description: "Built IoT attendance system prototype.",
    status: "Approved",
    remarks: "Excellent demo",
    marks: 22,
    proof: "iot_project.pptx"
  },
  {
    id: 5,
    studentId: 4,
    criteriaId: 2,
    description: "Won poster design competition at district level.",
    status: "Correction Requested",
    remarks: "Attach event brochure",
    marks: null,
    proof: "poster.jpg"
  },
  {
    id: 6,
    studentId: 5,
    criteriaId: 1,
    description: "Reached finals in athletics sprint.",
    status: "Pending",
    remarks: "",
    marks: null,
    proof: "athletics_photo.png"
  },
  {
    id: 7,
    studentId: 6,
    criteriaId: 3,
    description: "Volunteered in blood donation camp.",
    status: "Approved",
    remarks: "Verified by coordinator",
    marks: 17,
    proof: "volunteer_letter.pdf"
  }
];

const state = {
  loggedIn: false,
  currentRole: "student",
  activePage: "dashboard",
  currentStudentId: 1,
  selectedAcademicYear: academicYears[0],
  editingCriteriaId: null,
  showSubmissionForm: false
};

const ui = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  bindEvents();
  renderAuthState();
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
  ui.pageContent = document.getElementById("page-content");
  ui.toastContainer = document.getElementById("toast-container");
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

    state.activePage = button.dataset.page;
    renderSidebar();
    renderPage();
    ui.sidebar.classList.remove("open");
  });

  ui.pageContent.addEventListener("click", handlePageClick);
  ui.pageContent.addEventListener("submit", handlePageSubmit);
  ui.pageContent.addEventListener("change", handlePageChange);

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      ui.sidebar.classList.remove("open");
    }
  });
}

function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(ui.loginForm);
  const email = String(formData.get("email") || "").trim();
  const role = String(formData.get("role") || "student");

  // Debug: log login attempt
  console.log("Login attempt", { email, role });

  // For demo: allow any email/password, just require a role
  if (!role) {
    showToast("Please select a role.", "error");
    return;
  }

  state.loggedIn = true;
  state.activePage = "dashboard";
  state.currentRole = role;
  ui.loginForm.reset();

  renderAuthState();
  showToast("Login successful. Prototype mode active.", "success");
}

function handleRoleSwitch(event) {
  state.currentRole = event.target.value;
  state.activePage = "dashboard";
  state.editingCriteriaId = null;
  state.showSubmissionForm = false;

  renderSidebar();
  renderPage();
  ui.sidebar.classList.remove("open");
  showToast("Role switched to " + roleConfig[state.currentRole].label + ".", "info");
}

function handleLogout() {
  state.loggedIn = false;
  state.activePage = "dashboard";
  state.editingCriteriaId = null;
  state.showSubmissionForm = false;
  ui.sidebar.classList.remove("open");
  renderAuthState();
  showToast("Logged out from prototype session.", "info");
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
  renderPage();
}

function renderSidebar() {
  const roleMeta = roleConfig[state.currentRole];
  ui.sidebarRoleLabel.textContent = roleMeta.label;

  const navItems = [
    { page: "dashboard", label: roleMeta.navLabel },
    { page: "ranking", label: "Ranking Dashboard" }
  ];

  ui.sidebarNav.innerHTML = navItems
    .map((item) => {
      const activeClass = item.page === state.activePage ? "active" : "";
      return (
        "<li>" +
        "<button type=\"button\" class=\"nav-item " + activeClass + "\" data-page=\"" + item.page + "\">" +
        escapeHtml(item.label) +
        "</button>" +
        "</li>"
      );
    })
    .join("");
}

function renderPage() {
  if (state.activePage === "ranking") {
    ui.topbarHeading.textContent = "Ranking Dashboard";
    ui.topbarSubheading.textContent = "Live class leaderboard by score";
    ui.pageContent.innerHTML = renderRankingDashboard();
    return;
  }

  const roleMeta = roleConfig[state.currentRole];
  ui.topbarHeading.textContent = roleMeta.heading;
  ui.topbarSubheading.textContent = "Academic Year " + state.selectedAcademicYear;

  if (state.currentRole === "student") {
    ui.pageContent.innerHTML = renderStudentDashboard();
    return;
  }

  if (state.currentRole === "teacher") {
    ui.pageContent.innerHTML = renderTeacherDashboard();
    return;
  }

  if (state.currentRole === "evaluator") {
    ui.pageContent.innerHTML = renderEvaluatorDashboard();
    return;
  }

  if (state.currentRole === "admin") {
    ui.pageContent.innerHTML = renderAdminDashboard();
    return;
  }

  ui.pageContent.innerHTML = renderHodDashboard();
}

function renderStudentDashboard() {
  const student = getStudentById(state.currentStudentId);
  const mySubmissions = submissions
    .filter((item) => item.studentId === state.currentStudentId)
    .sort((a, b) => b.id - a.id);

  const approvedCount = mySubmissions.filter((item) => item.status === "Approved").length;
  const totalMarks = mySubmissions.reduce((sum, item) => sum + safeMark(item.marks), 0);

  const tableRows = mySubmissions.length
    ? mySubmissions
        .map((item) => {
          const itemCriteria = getCriteriaById(item.criteriaId);
          return (
            "<tr>" +
            "<td>" + escapeHtml(itemCriteria ? itemCriteria.name : "Removed Criteria") + "</td>" +
            "<td>" + escapeHtml(item.description) + "</td>" +
            "<td><span class=\"status-pill " + getStatusClass(item.status) + "\">" + escapeHtml(item.status) + "</span></td>" +
            "<td>" + (Number.isFinite(item.marks) ? item.marks : "-") + "</td>" +
            "<td>" + escapeHtml(item.remarks || "-") + "</td>" +
            "</tr>"
          );
        })
        .join("")
    : "<tr><td colspan=\"5\" class=\"empty-row\">No submissions yet.</td></tr>";

  const criteriaOptions = criteria
    .map((item) => {
      return "<option value=\"" + item.id + "\">" + escapeHtml(item.name) + " (Max " + item.maxMarks + ")</option>";
    })
    .join("");

  return (
    "<section class=\"section-header\">" +
    "<div>" +
    "<h1>Student Dashboard</h1>" +
    "<p class=\"muted\">" +
    escapeHtml(student ? student.name : "Demo Student") +
    " | " +
    escapeHtml(student ? student.className : "Class") +
    "</p>" +
    "</div>" +
    "</section>" +

    "<section class=\"cards-grid stats-grid\">" +
    "<article class=\"stat-card\"><p>Total Submissions</p><h3>" + mySubmissions.length + "</h3></article>" +
    "<article class=\"stat-card\"><p>Approved</p><h3>" + approvedCount + "</h3></article>" +
    "<article class=\"stat-card\"><p>Total Marks</p><h3>" + totalMarks.toFixed(1) + "</h3></article>" +
    "</section>" +

    "<section class=\"panel\">" +
    "<div class=\"panel-head\">" +
    "<h3>Submitted Activities</h3>" +
    "<button type=\"button\" id=\"toggle-submission-form\" class=\"btn primary\">" +
    (state.showSubmissionForm ? "Close Form" : "Add Submission") +
    "</button>" +
    "</div>" +
    "<div class=\"table-wrap\">" +
    "<table>" +
    "<thead><tr><th>Criteria</th><th>Description</th><th>Status</th><th>Marks</th><th>Remark</th></tr></thead>" +
    "<tbody>" + tableRows + "</tbody>" +
    "</table>" +
    "</div>" +
    "</section>" +

    "<section class=\"panel " + (state.showSubmissionForm ? "" : "hidden") + "\">" +
    "<h3>New Submission</h3>" +
    "<form id=\"student-submission-form\" class=\"stack-form two-col\">" +
    "<div class=\"field\">" +
    "<label for=\"submission-criteria\">Select Criteria</label>" +
    "<select id=\"submission-criteria\" name=\"criteriaId\" required>" + criteriaOptions + "</select>" +
    "</div>" +
    "<div class=\"field\">" +
    "<label for=\"submission-proof\">Upload Proof</label>" +
    "<input id=\"submission-proof\" name=\"proof\" type=\"file\" required />" +
    "</div>" +
    "<div class=\"field full-span\">" +
    "<label for=\"submission-description\">Description</label>" +
    "<textarea id=\"submission-description\" name=\"description\" placeholder=\"Describe the activity\" required></textarea>" +
    "</div>" +
    "<div class=\"button-row full-span\">" +
    "<button type=\"submit\" class=\"btn primary\">Submit</button>" +
    "</div>" +
    "</form>" +
    "</section>"
  );
}

function renderTeacherDashboard() {
  const reviewQueue = [...submissions].sort((a, b) => b.id - a.id);

  const cards = reviewQueue.length
    ? reviewQueue
        .map((item) => {
          const student = getStudentById(item.studentId);
          const itemCriteria = getCriteriaById(item.criteriaId);
          return (
            "<article class=\"submission-card\">" +
            "<div class=\"submission-head\">" +
            "<h4>" + escapeHtml(student ? student.name : "Unknown Student") + "</h4>" +
            "<span class=\"status-pill " + getStatusClass(item.status) + "\">" + escapeHtml(item.status) + "</span>" +
            "</div>" +

            "<div class=\"meta-list\">" +
            "<p><strong>Class:</strong> " + escapeHtml(student ? student.className : "-") + "</p>" +
            "<p><strong>Criteria:</strong> " + escapeHtml(itemCriteria ? itemCriteria.name : "Removed Criteria") + "</p>" +
            "<p><strong>Description:</strong> " + escapeHtml(item.description) + "</p>" +
            "<p><strong>Proof:</strong> " + escapeHtml(item.proof || "-") + "</p>" +
            "</div>" +

            "<div class=\"field\">" +
            "<label>Teacher Remark</label>" +
            "<input type=\"text\" data-remark-input=\"" + item.id + "\" value=\"" + escapeAttribute(item.remarks || "") + "\" placeholder=\"Add a remark\" />" +
            "</div>" +

            "<div class=\"button-row\">" +
            "<button type=\"button\" class=\"btn success\" data-teacher-action=\"Approved\" data-id=\"" + item.id + "\">Approve</button>" +
            "<button type=\"button\" class=\"btn danger\" data-teacher-action=\"Rejected\" data-id=\"" + item.id + "\">Reject</button>" +
            "<button type=\"button\" class=\"btn warn\" data-teacher-action=\"Correction Requested\" data-id=\"" + item.id + "\">Request Correction</button>" +
            "</div>" +
            "</article>"
          );
        })
        .join("")
    : "<div class=\"panel\"><p class=\"empty-state\">No submissions available for review.</p></div>";

  return (
    "<section class=\"section-header\">" +
    "<div>" +
    "<h1>Class Teacher Dashboard</h1>" +
    "<p class=\"muted\">Review student submissions and update status with remarks.</p>" +
    "</div>" +
    "</section>" +
    "<section class=\"submission-grid\">" + cards + "</section>"
  );
}

function renderEvaluatorDashboard() {
  // Department selection UI
  const departments = getDepartments();
  let deptButtons = departments.map(dept => {
    const active = state.selectedDepartment === dept ? 'active' : '';
    return `<button type="button" class="btn ghost ${active}" data-eval-dept="${dept}">${escapeHtml(dept)}</button>`;
  }).join(' ');

  let content = `<section class="section-header">
    <div>
      <h1>Evaluation Team Dashboard</h1>
      <p class="muted">Select a department to view students and assign marks.</p>
      <div class="button-row">${deptButtons}</div>
    </div>
  </section>`;

  if (!state.selectedDepartment) {
    content += '<section class="panel"><p class="empty-state">Select a department to view students.</p></section>';
    return content;
  }

  // Show students in selected department
  const studentsInDept = getStudentsByDepartment(state.selectedDepartment);
  if (!studentsInDept.length) {
    content += '<section class="panel"><p class="empty-state">No students in this department.</p></section>';
    return content;
  }

  // For each student, show their approved submissions for marking
  studentsInDept.forEach(student => {
    const studentSubs = submissions.filter(item => item.studentId === student.id && item.status === "Approved");
    if (!studentSubs.length) {
      content += `<section class="panel"><h3>${escapeHtml(student.name)} (${escapeHtml(student.className)})</h3><p class="empty-state">No approved submissions for this student.</p></section>`;
      return;
    }
    content += `<section class="panel"><h3>${escapeHtml(student.name)} (${escapeHtml(student.className)})</h3>`;
    studentSubs.forEach(item => {
      const itemCriteria = getCriteriaById(item.criteriaId);
      const maxMarks = itemCriteria ? itemCriteria.maxMarks : 0;
      const currentMarks = Number.isFinite(item.marks) ? item.marks : "";
      content += `<div class="submission-card">
        <div class="submission-head">
          <h4>${escapeHtml(itemCriteria ? itemCriteria.name : "Removed Criteria")}</h4>
          <span class="status-pill status-approved">Approved</span>
        </div>
        <div class="meta-list">
          <p><strong>Description:</strong> ${escapeHtml(item.description)}</p>
          <p><strong>Proof:</strong> ${escapeHtml(item.proof || "-")}</p>
          <p><strong>Max Marks:</strong> ${maxMarks}</p>
        </div>
        <form class="stack-form" data-mark-form="${item.id}">
          <div class="field">
            <label>Enter Marks</label>
            <input name="marks" type="number" min="0" max="${maxMarks}" step="0.5" required value="${currentMarks}" />
          </div>
          <button type="submit" class="btn primary">Save Marks</button>
        </form>
      </div>`;
    });
    content += '</section>';
  });
  return content;
}

function renderAdminDashboard() {
  const editingCriteria = criteria.find((item) => item.id === state.editingCriteriaId) || null;
  const yearOptions = academicYears
    .map((year) => {
      const selected = year === state.selectedAcademicYear ? " selected" : "";
      return "<option value=\"" + year + "\"" + selected + ">" + year + "</option>";
    })
    .join("");

  const criteriaRows = criteria.length
    ? criteria
        .map((item) => {
          return (
            "<tr>" +
            "<td>" + escapeHtml(item.name) + "</td>" +
            "<td>" + item.maxMarks + "</td>" +
            "<td>" +
            "<div class=\"button-row\">" +
            "<button type=\"button\" class=\"btn ghost\" data-criteria-edit=\"" + item.id + "\">Edit</button>" +
            "<button type=\"button\" class=\"btn danger\" data-criteria-delete=\"" + item.id + "\">Delete</button>" +
            "</div>" +
            "</td>" +
            "</tr>"
          );
        })
        .join("")
    : "<tr><td colspan=\"3\" class=\"empty-row\">No criteria found.</td></tr>";

  return (
    "<section class=\"section-header\">" +
    "<div>" +
    "<h1>Admin Panel</h1>" +
    "<p class=\"muted\">Manage criteria and scoring setup for each academic year.</p>" +
    "</div>" +
    "</section>" +

    "<section class=\"cards-grid two-panel-grid\">" +
    "<article class=\"panel\">" +
    "<h3>Academic Year</h3>" +
    "<div class=\"field\">" +
    "<label for=\"academic-year-select\">Select Session</label>" +
    "<select id=\"academic-year-select\">" + yearOptions + "</select>" +
    "</div>" +
    "</article>" +

    "<article class=\"panel\">" +
    "<h3>" + (editingCriteria ? "Edit Criteria" : "Add Criteria") + "</h3>" +
    "<form id=\"criteria-form\" class=\"stack-form\">" +
    "<div class=\"field\">" +
    "<label for=\"criteria-title\">Title</label>" +
    "<input id=\"criteria-title\" name=\"title\" type=\"text\" required value=\"" + escapeAttribute(editingCriteria ? editingCriteria.name : "") + "\" />" +
    "</div>" +
    "<div class=\"field\">" +
    "<label for=\"criteria-max\">Max Marks</label>" +
    "<input id=\"criteria-max\" name=\"maxMarks\" type=\"number\" min=\"1\" required value=\"" + (editingCriteria ? editingCriteria.maxMarks : "") + "\" />" +
    "</div>" +
    "<div class=\"button-row\">" +
    "<button type=\"submit\" class=\"btn primary\">" + (editingCriteria ? "Update Criteria" : "Add Criteria") + "</button>" +
    "<button type=\"button\" id=\"cancel-edit-criteria\" class=\"btn ghost " + (editingCriteria ? "" : "hidden") + "\">Cancel</button>" +
    "</div>" +
    "</form>" +
    "</article>" +
    "</section>" +

    "<section class=\"panel\">" +
    "<h3>Criteria List</h3>" +
    "<div class=\"table-wrap\">" +
    "<table>" +
    "<thead><tr><th>Title</th><th>Max Marks</th><th>Actions</th></tr></thead>" +
    "<tbody>" + criteriaRows + "</tbody>" +
    "</table>" +
    "</div>" +
    "</section>"
  );
}

function renderHodDashboard() {
  const performance = buildClassPerformance().sort((a, b) => b.totalScore - a.totalScore);

  const rows = performance
    .map((entry) => {
      return (
        "<tr>" +
        "<td>" + escapeHtml(entry.className) + "</td>" +
        "<td>" + entry.totalScore.toFixed(1) + "</td>" +
        "<td>" + entry.normalizedScore.toFixed(1) + "</td>" +
        "<td>" + entry.percentile.toFixed(1) + "</td>" +
        "<td><strong>" + entry.grade + "</strong></td>" +
        "</tr>"
      );
    })
    .join("");

  return (
    "<section class=\"section-header\">" +
    "<div>" +
    "<h1>HOD / IQAC Dashboard</h1>" +
    "<p class=\"muted\">Class-wise normalized performance and grade overview.</p>" +
    "</div>" +
    "</section>" +
    "<section class=\"panel\">" +
    "<div class=\"table-wrap\">" +
    "<table>" +
    "<thead><tr><th>Class Name</th><th>Total Score</th><th>Normalized Score</th><th>Percentile</th><th>Grade</th></tr></thead>" +
    "<tbody>" + rows + "</tbody>" +
    "</table>" +
    "</div>" +
    "</section>"
  );
}

function renderRankingDashboard() {
  const ranked = buildClassPerformance().sort((a, b) => {
    if (b.totalScore === a.totalScore) {
      return b.normalizedScore - a.normalizedScore;
    }
    return b.totalScore - a.totalScore;
  });

  const rows = ranked
    .map((entry, index) => {
      const topClass = index === 0 ? "top-1" : index === 1 ? "top-2" : index === 2 ? "top-3" : "";
      return (
        "<article class=\"leaderboard-row " + topClass + "\">" +
        "<div class=\"rank-badge\">#" + (index + 1) + "</div>" +
        "<div>" +
        "<h4>" + escapeHtml(entry.className) + "</h4>" +
        "<p class=\"muted\">Grade " + entry.grade + " | Percentile " + entry.percentile.toFixed(1) + "</p>" +
        "</div>" +
        "<div class=\"leaderboard-metric\">" +
        "<p><strong>Total:</strong> " + entry.totalScore.toFixed(1) + "</p>" +
        "<p><strong>Normalized:</strong> " + entry.normalizedScore.toFixed(1) + "</p>" +
        "</div>" +
        "</article>"
      );
    })
    .join("");

  return (
    "<section class=\"section-header\">" +
    "<div>" +
    "<h1>Class Leaderboard</h1>" +
    "<p class=\"muted\">Top 3 classes are highlighted based on total scores.</p>" +
    "</div>" +
    "</section>" +
    "<section class=\"panel\">" +
    "<div class=\"leaderboard\">" + rows + "</div>" +
    "</section>"
  );
}

function handlePageClick(event) {
    // Evaluator department selection
    const evalDeptBtn = event.target.closest("button[data-eval-dept]");
    if (evalDeptBtn) {
      state.selectedDepartment = evalDeptBtn.dataset.evalDept;
      renderPage();
      return;
    }
  const toggleSubmissionButton = event.target.closest("#toggle-submission-form");
  if (toggleSubmissionButton) {
    state.showSubmissionForm = !state.showSubmissionForm;
    renderPage();
    return;
  }

  const teacherActionButton = event.target.closest("button[data-teacher-action]");
  if (teacherActionButton) {
    const submissionId = Number(teacherActionButton.dataset.id);
    const nextStatus = teacherActionButton.dataset.teacherAction;
    updateTeacherStatus(submissionId, nextStatus);
    return;
  }

  const editCriteriaButton = event.target.closest("button[data-criteria-edit]");
  if (editCriteriaButton) {
    state.editingCriteriaId = Number(editCriteriaButton.dataset.criteriaEdit);
    renderPage();
    return;
  }

  const deleteCriteriaButton = event.target.closest("button[data-criteria-delete]");
  if (deleteCriteriaButton) {
    deleteCriteria(Number(deleteCriteriaButton.dataset.criteriaDelete));
    return;
  }

  const cancelEditButton = event.target.closest("#cancel-edit-criteria");
  if (cancelEditButton) {
    state.editingCriteriaId = null;
    renderPage();
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

  if (form.id === "criteria-form") {
    event.preventDefault();
    submitCriteriaForm(form);
  }
}

function handlePageChange(event) {
  const target = event.target;
  if (target.id === "academic-year-select") {
    state.selectedAcademicYear = target.value;
    ui.topbarSubheading.textContent = "Academic Year " + state.selectedAcademicYear;
    showToast("Academic year updated to " + state.selectedAcademicYear + ".", "info");
  }
}

function submitStudentSubmission(form) {
  if (!criteria.length) {
    showToast("No criteria available. Ask admin to add criteria.", "warning");
    return;
  }

  const formData = new FormData(form);
  const criteriaId = Number(formData.get("criteriaId"));
  const description = String(formData.get("description") || "").trim();
  const proofFile = form.querySelector("input[name='proof']");
  const proofName = proofFile && proofFile.files && proofFile.files[0] ? proofFile.files[0].name : "proof-file.pdf";

  if (!criteriaId || !description) {
    showToast("Please provide criteria and description.", "error");
    return;
  }

  const nextId = submissions.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
  submissions.unshift({
    id: nextId,
    studentId: state.currentStudentId,
    criteriaId: criteriaId,
    description: description,
    status: "Pending",
    remarks: "",
    marks: null,
    proof: proofName
  });

  state.showSubmissionForm = false;
  form.reset();
  renderPage();
  showToast("Submission added successfully.", "success");
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
  }

  renderPage();
  showToast("Submission " + submissionId + " marked as " + nextStatus + ".", "success");
}

function saveEvaluatorMarks(form) {
  const submissionId = Number(form.dataset.markForm);
  const submission = submissions.find((item) => item.id === submissionId);

  if (!submission) {
    showToast("Submission not found.", "error");
    return;
  }

  const itemCriteria = getCriteriaById(submission.criteriaId);
  if (!itemCriteria) {
    showToast("Criteria not found for this submission.", "error");
    return;
  }

  const marksInput = form.querySelector("input[name='marks']");
  const marks = Number(marksInput.value);

  if (!Number.isFinite(marks) || marks < 0) {
    showToast("Marks must be a valid positive number.", "error");
    return;
  }

  if (marks > itemCriteria.maxMarks) {
    showToast("Marks cannot exceed max marks of " + itemCriteria.maxMarks + ".", "error");
    return;
  }

  submission.marks = marks;
  showToast("Marks saved for submission " + submissionId + ".", "success");
  renderPage();
}

function submitCriteriaForm(form) {
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim();
  const maxMarks = Number(formData.get("maxMarks"));

  if (!title || !Number.isFinite(maxMarks) || maxMarks <= 0) {
    showToast("Please enter a valid criteria title and max marks.", "error");
    return;
  }

  if (state.editingCriteriaId) {
    const targetCriteria = criteria.find((item) => item.id === state.editingCriteriaId);
    if (!targetCriteria) {
      showToast("Criteria not found.", "error");
      return;
    }

    targetCriteria.name = title;
    targetCriteria.maxMarks = maxMarks;
    state.editingCriteriaId = null;
    showToast("Criteria updated.", "success");
  } else {
    const nextId = criteria.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
    criteria.push({
      id: nextId,
      name: title,
      maxMarks: maxMarks
    });
    showToast("Criteria added.", "success");
  }

  renderPage();
}

function deleteCriteria(criteriaId) {
  const criteriaInUse = submissions.some((item) => item.criteriaId === criteriaId);
  if (criteriaInUse) {
    showToast("Cannot delete criteria that is used in submissions.", "warning");
    return;
  }

  const oldCount = criteria.length;
  criteria = criteria.filter((item) => item.id !== criteriaId);

  if (criteria.length === oldCount) {
    showToast("Criteria not found.", "error");
    return;
  }

  if (state.editingCriteriaId === criteriaId) {
    state.editingCriteriaId = null;
  }

  renderPage();
  showToast("Criteria deleted.", "success");
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

  submissions.forEach((item) => {
    if (item.status !== "Approved") {
      return;
    }

    const student = getStudentById(item.studentId);
    const itemCriteria = getCriteriaById(item.criteriaId);
    if (!student || !itemCriteria) {
      return;
    }

    const classEntry = classMap.get(student.className);
    if (!classEntry) {
      return;
    }

    classEntry.totalScore += safeMark(item.marks);
    classEntry.maxScore += itemCriteria.maxMarks;
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

function getCriteriaById(id) {
  return criteria.find((item) => item.id === id);
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
  }, 2600);
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