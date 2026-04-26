window.criteriaData = [
  {
    id: "cat-academics",
    category: "Academics",
    items: [
      { id: 101, title: "S Grade Course", marks: 5, type: "count" },
      { id: 102, title: "A+ Grade Course", marks: 3, type: "count" },
      { id: 103, title: "A Grade Course", marks: 1, type: "count" },
      { id: 104, title: "Failed Course", marks: -2, type: "negative" },
      {
        id: 105,
        title: "Class Pass Percentage",
        marks: 0,
        type: "range",
        rules: [
          { min: 95, max: 100, marks: 20 },
          { min: 90, max: 94.99, marks: 15 },
          { min: 85, max: 89.99, marks: 10 },
          { min: 80, max: 84.99, marks: 5 }
        ]
      }
    ]
  },
  {
    id: "cat-online-courses",
    category: "Online Courses",
    items: [
      { id: 201, title: "NPTEL Course Completed", marks: 10, type: "count" },
      { id: 202, title: "MOOC Course Completed", marks: 5, type: "count" },
      { id: 203, title: "Other Recognized Online Course", marks: 3, type: "count" }
    ]
  },
  {
    id: "cat-internships",
    category: "Internships",
    items: [
      { id: 301, title: "Offline Internship", marks: 5, type: "count" },
      { id: 302, title: "Online Internship", marks: 3, type: "count" }
    ]
  },
  {
    id: "cat-competitive-exams",
    category: "Competitive Exams",
    items: [
      { id: 401, title: "JRF Qualified", marks: 20, type: "fixed" },
      { id: 402, title: "NET Qualified", marks: 10, type: "fixed" },
      { id: 403, title: "SET Qualified", marks: 5, type: "fixed" }
    ]
  },
  {
    id: "cat-scholarships",
    category: "Scholarships",
    items: [
      { id: 501, title: "International Scholarship", marks: 20, type: "fixed" },
      { id: 502, title: "National Scholarship", marks: 10, type: "fixed" },
      { id: 503, title: "State Scholarship", marks: 5, type: "fixed" }
    ]
  },
  {
    id: "cat-research",
    category: "Research",
    items: [
      { id: 601, title: "Research Publication", marks: 15, type: "count" },
      { id: 602, title: "Patent Filed or Published", marks: 20, type: "count" },
      { id: 603, title: "Funded or Approved Student Project", marks: 10, type: "count" }
    ]
  },
  {
    id: "cat-prizes",
    category: "Prizes",
    items: [
      { id: 701, title: "Outside College Individual First Prize", marks: 10, type: "count" },
      { id: 702, title: "Outside College Individual Second Prize", marks: 8, type: "count" },
      { id: 703, title: "Outside College Individual Third Prize", marks: 5, type: "count" },
      { id: 704, title: "Outside College Group First Prize", marks: 6, type: "count" },
      { id: 705, title: "Outside College Group Second Prize", marks: 4, type: "count" },
      { id: 706, title: "Outside College Group Third Prize", marks: 3, type: "count" },
      { id: 707, title: "Inside College Individual First Prize", marks: 5, type: "count" },
      { id: 708, title: "Inside College Individual Second Prize", marks: 3, type: "count" },
      { id: 709, title: "Inside College Individual Third Prize", marks: 2, type: "count" },
      { id: 710, title: "Inside College Group First Prize", marks: 3, type: "count" },
      { id: 711, title: "Inside College Group Second Prize", marks: 2, type: "count" },
      { id: 712, title: "Inside College Group Third Prize", marks: 1, type: "count" }
    ]
  },
  {
    id: "cat-leadership",
    category: "Leadership",
    items: [
      { id: 801, title: "Class Representative", marks: 10, type: "fixed" },
      { id: 802, title: "Association or Club Office Bearer", marks: 8, type: "fixed" },
      { id: 803, title: "Event Coordinator Role", marks: 5, type: "count" }
    ]
  },
  {
    id: "cat-programs-organized",
    category: "Programs Organized",
    items: [
      { id: 901, title: "Department Level Program Organized", marks: 5, type: "count" },
      { id: 902, title: "Interdepartment Program Organized", marks: 8, type: "count" },
      { id: 903, title: "State or National Level Program Organized", marks: 15, type: "count" }
    ]
  },
  {
    id: "cat-social-responsibility",
    category: "Social Responsibility",
    items: [
      { id: 1001, title: "NSS/NCC/Service Activity Participation", marks: 5, type: "count" },
      { id: 1002, title: "Community Outreach Activity", marks: 3, type: "count" },
      { id: 1003, title: "Blood Donation or Health Camp Participation", marks: 2, type: "count" }
    ]
  },
  {
    id: "cat-career-advancement",
    category: "Career Advancement",
    items: [
      { id: 1101, title: "Placement Offer Received", marks: 20, type: "fixed" },
      { id: 1102, title: "Higher Studies Admission Secured", marks: 15, type: "fixed" },
      { id: 1103, title: "Professional Certification Completed", marks: 8, type: "count" },
      { id: 1104, title: "Career Workshop Participation", marks: 2, type: "count" }
    ]
  },
  {
    id: "cat-documentation",
    category: "Documentation",
    items: [
      { id: 1201, title: "Complete Best Class File Submitted", marks: 10, type: "fixed" },
      { id: 1202, title: "Valid Proof Uploaded for All Claims", marks: 5, type: "fixed" },
      { id: 1203, title: "Late or Incomplete Documentation", marks: -5, type: "negative" }
    ]
  }
];

window.seedSubmissions = [
  {
    id: 1,
    studentId: 1,
    criteriaId: 105,
    description: "Department result sheet shows 93.4% pass for BSc CS A.",
    status: "Approved",
    remarks: "Verified against semester result summary",
    marks: null,
    proof: "bsc_cs_a_pass_percentage_2025.xlsx",
    evaluatorVerified: true,
    evidence: { type: "range", value: 93.4 }
  },
  {
    id: 2,
    studentId: 1,
    criteriaId: 101,
    description: "Five S grades secured across semester courses.",
    status: "Approved",
    remarks: "Grade cards checked",
    marks: null,
    proof: "anika_s_grade_cards.pdf",
    evaluatorVerified: true,
    evidence: { type: "count", count: 5 }
  },
  {
    id: 3,
    studentId: 1,
    criteriaId: 201,
    description: "Completed two NPTEL courses with certificates.",
    status: "Approved",
    remarks: "Certificates valid",
    marks: null,
    proof: "anika_nptel_certificates.zip",
    evaluatorVerified: false,
    evidence: { type: "count", count: 2 }
  },
  {
    id: 4,
    studentId: 1,
    criteriaId: 301,
    description: "Offline internship completed at TechNova Labs.",
    status: "Approved",
    remarks: "Completion letter verified",
    marks: null,
    proof: "technova_internship_letter.pdf",
    evaluatorVerified: true,
    evidence: { type: "count", count: 1 }
  },
  {
    id: 5,
    studentId: 1,
    criteriaId: 601,
    description: "Research paper accepted in a peer-reviewed student journal.",
    status: "Pending",
    remarks: "Awaiting publication proof",
    marks: null,
    proof: "publication_acceptance_mail.pdf",
    evaluatorVerified: false,
    evidence: { type: "count", count: 1 }
  },
  {
    id: 6,
    studentId: 2,
    criteriaId: 102,
    description: "Six A+ grades secured in the latest semester.",
    status: "Approved",
    remarks: "Mark lists verified",
    marks: null,
    proof: "rahul_a_plus_results.pdf",
    evaluatorVerified: true,
    evidence: { type: "count", count: 6 }
  },
  {
    id: 7,
    studentId: 2,
    criteriaId: 202,
    description: "Three MOOC courses completed through Coursera and SWAYAM.",
    status: "Approved",
    remarks: "Certificates checked",
    marks: null,
    proof: "rahul_mooc_certificates.zip",
    evaluatorVerified: true,
    evidence: { type: "count", count: 3 }
  },
  {
    id: 8,
    studentId: 2,
    criteriaId: 402,
    description: "Qualified UGC NET in Computer Science.",
    status: "Approved",
    remarks: "NET score card verified",
    marks: null,
    proof: "rahul_net_scorecard.pdf",
    evaluatorVerified: true,
    evidence: { type: "fixed" }
  },
  {
    id: 9,
    studentId: 2,
    criteriaId: 503,
    description: "State merit scholarship sanctioned for the academic year.",
    status: "Pending",
    remarks: "Sanction order requested",
    marks: null,
    proof: "scholarship_application_ack.pdf",
    evaluatorVerified: false,
    evidence: { type: "fixed" }
  },
  {
    id: 10,
    studentId: 2,
    criteriaId: 1201,
    description: "Best Class file submitted with index and certificates.",
    status: "Approved",
    remarks: "Documentation complete",
    marks: null,
    proof: "rahul_best_class_file.pdf",
    evaluatorVerified: true,
    evidence: { type: "fixed" }
  },
  {
    id: 11,
    studentId: 3,
    criteriaId: 105,
    description: "Class pass percentage for BCom B is 88.2%.",
    status: "Approved",
    remarks: "Department report checked",
    marks: null,
    proof: "bcom_b_pass_percentage.xlsx",
    evaluatorVerified: true,
    evidence: { type: "range", value: 88.2 }
  },
  {
    id: 12,
    studentId: 3,
    criteriaId: 103,
    description: "Eight A grades secured by the class.",
    status: "Approved",
    remarks: "Verified with consolidated mark list",
    marks: null,
    proof: "sara_a_grade_summary.pdf",
    evaluatorVerified: true,
    evidence: { type: "count", count: 8 }
  },
  {
    id: 13,
    studentId: 3,
    criteriaId: 302,
    description: "Two online internship certificates submitted.",
    status: "Correction Requested",
    remarks: "One certificate missing organization seal",
    marks: null,
    proof: "sara_online_internships.zip",
    evaluatorVerified: false,
    evidence: { type: "count", count: 2 }
  },
  {
    id: 14,
    studentId: 3,
    criteriaId: 707,
    description: "First prize in the college finance quiz.",
    status: "Approved",
    remarks: "Prize certificate verified",
    marks: null,
    proof: "finance_quiz_first_prize.pdf",
    evaluatorVerified: false,
    evidence: { type: "count", count: 1 }
  },
  {
    id: 15,
    studentId: 4,
    criteriaId: 201,
    description: "One NPTEL course completed.",
    status: "Approved",
    remarks: "Certificate valid",
    marks: null,
    proof: "arjun_nptel_certificate.pdf",
    evaluatorVerified: true,
    evidence: { type: "count", count: 1 }
  },
  {
    id: 16,
    studentId: 4,
    criteriaId: 1101,
    description: "Placement offer received from FinEdge Analytics.",
    status: "Approved",
    remarks: "Offer letter verified",
    marks: null,
    proof: "finedge_offer_letter.pdf",
    evaluatorVerified: true,
    evidence: { type: "fixed" }
  },
  {
    id: 17,
    studentId: 4,
    criteriaId: 104,
    description: "One course failed in semester result.",
    status: "Approved",
    remarks: "Negative mark applied as per rule",
    marks: null,
    proof: "arjun_semester_result.pdf",
    evaluatorVerified: true,
    evidence: { type: "negative", count: 1 }
  },
  {
    id: 18,
    studentId: 4,
    criteriaId: 1002,
    description: "Three community outreach sessions conducted.",
    status: "Pending",
    remarks: "Attendance sheet under review",
    marks: null,
    proof: "community_outreach_attendance.pdf",
    evaluatorVerified: false,
    evidence: { type: "count", count: 3 }
  },
  {
    id: 19,
    studentId: 5,
    criteriaId: 601,
    description: "Two student research articles published.",
    status: "Approved",
    remarks: "Publication links verified",
    marks: null,
    proof: "nisha_publications.pdf",
    evaluatorVerified: true,
    evidence: { type: "count", count: 2 }
  },
  {
    id: 20,
    studentId: 5,
    criteriaId: 903,
    description: "Coordinated one national level literary seminar.",
    status: "Approved",
    remarks: "Brochure and report verified",
    marks: null,
    proof: "national_literary_seminar_report.pdf",
    evaluatorVerified: true,
    evidence: { type: "count", count: 1 }
  },
  {
    id: 21,
    studentId: 5,
    criteriaId: 705,
    description: "Second prize in outside-college group theatre event.",
    status: "Approved",
    remarks: "Certificate checked",
    marks: null,
    proof: "group_theatre_second_prize.pdf",
    evaluatorVerified: false,
    evidence: { type: "count", count: 1 }
  },
  {
    id: 22,
    studentId: 5,
    criteriaId: 1203,
    description: "Documentation submitted after department deadline.",
    status: "Correction Requested",
    remarks: "Final proof bundle pending",
    marks: null,
    proof: "late_documentation_note.pdf",
    evaluatorVerified: false,
    evidence: { type: "negative", count: 1 }
  },
  {
    id: 23,
    studentId: 6,
    criteriaId: 401,
    description: "Qualified JRF in English.",
    status: "Approved",
    remarks: "JRF certificate verified",
    marks: null,
    proof: "vikram_jrf_certificate.pdf",
    evaluatorVerified: true,
    evidence: { type: "fixed" }
  },
  {
    id: 24,
    studentId: 6,
    criteriaId: 602,
    description: "One patent application filed for a language-learning tool.",
    status: "Approved",
    remarks: "Patent filing receipt verified",
    marks: null,
    proof: "language_tool_patent_receipt.pdf",
    evaluatorVerified: true,
    evidence: { type: "count", count: 1 }
  },
  {
    id: 25,
    studentId: 6,
    criteriaId: 801,
    description: "Served as class representative for BA English C.",
    status: "Approved",
    remarks: "Class teacher confirmed",
    marks: null,
    proof: "class_representative_confirmation.pdf",
    evaluatorVerified: true,
    evidence: { type: "fixed" }
  },
  {
    id: 26,
    studentId: 6,
    criteriaId: 105,
    description: "Class pass percentage for BA English C is 82.5%.",
    status: "Approved",
    remarks: "Result statement verified",
    marks: null,
    proof: "ba_english_c_pass_percentage.xlsx",
    evaluatorVerified: true,
    evidence: { type: "range", value: 82.5 }
  },
  {
    id: 27,
    studentId: 6,
    criteriaId: 203,
    description: "Online certificate from an unrecognized provider.",
    status: "Rejected",
    remarks: "Provider not approved under criteria",
    marks: null,
    proof: "unrecognized_online_course.pdf",
    evaluatorVerified: false,
    evidence: { type: "count", count: 1 }
  }
];
