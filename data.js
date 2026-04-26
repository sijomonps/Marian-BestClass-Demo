window.criteriaData = [
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
          { min: 80, max: 89.99, marks: 4 },
          { min: 70, max: 79.99, marks: 3 },
          { min: 60, max: 69.99, marks: 2 }
        ]
      },
      {
        id: 302,
        category: "Class Performance",
        title: "Prizes (1st Place)",
        type: "count",
        marks: 4
      }
    ]
  },
  {
    id: "cat-governance",
    category: "Governance & Compliance",
    items: [
      { id: 401, category: "Governance & Compliance", title: "Documentation Available", type: "boolean", marks: 25 },
      { id: 402, category: "Governance & Compliance", title: "Discipline Issue", type: "fixed", marks: -10 }
    ]
  },
  {
    id: "cat-career",
    category: "Career Readiness",
    items: [
      { id: 501, category: "Career Readiness", title: "Internship (Offline)", type: "fixed", marks: 5 }
    ]
  }
];

window.seedSubmissions = [
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
  },
  {
    id: 2,
    studentId: 2,
    criteriaId: 102,
    description: "A+ grade secured in semester results.",
    status: "Approved",
    remarks: "Verified",
    marks: null,
    proof: "sem_result_rahul.pdf",
    evaluatorVerified: true,
    evidence: { type: "fixed" }
  },
  {
    id: 3,
    studentId: 3,
    criteriaId: 102,
    description: "A+ grade secured in semester results.",
    status: "Pending",
    remarks: "Awaiting teacher confirmation",
    marks: null,
    proof: "sem_result_sara.pdf",
    evaluatorVerified: false,
    evidence: { type: "fixed" }
  },
  {
    id: 4,
    studentId: 1,
    criteriaId: 501,
    description: "Completed one offline internship.",
    status: "Approved",
    remarks: "Internship letter checked",
    marks: null,
    proof: "internship_letter.pdf",
    evaluatorVerified: true,
    evidence: { type: "fixed" }
  },
  {
    id: 5,
    studentId: 4,
    criteriaId: 202,
    description: "Completed two MOOC courses.",
    status: "Approved",
    remarks: "Certificates attached",
    marks: null,
    proof: "mooc_certificates.zip",
    evaluatorVerified: false,
    evidence: { type: "count", count: 2 }
  },
  {
    id: 6,
    studentId: 5,
    criteriaId: 302,
    description: "Won one first-place prize.",
    status: "Correction Requested",
    remarks: "Attach event circular",
    marks: null,
    proof: "prize_photo.jpg",
    evaluatorVerified: false,
    evidence: { type: "count", count: 1 }
  },
  {
    id: 7,
    studentId: 6,
    criteriaId: 301,
    description: "Class pass percentage report submitted.",
    status: "Approved",
    remarks: "Department report validated",
    marks: null,
    proof: "pass_percentage_report.xlsx",
    evaluatorVerified: true,
    evidence: { type: "range", value: 92 }
  }
];