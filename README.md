# 🎓 Best Class Evaluation & Verification System (Prototype)

## 📌 Project Overview

This is a **static frontend prototype** of a college system designed to manage and evaluate the **Best Class Competition**.

The system simulates how students submit activities, teachers verify them, evaluators assign marks, and the institution ranks classes based on performance.

⚠️ This is **NOT a full application** — it is only a **UI prototype (no backend, no database)** built to understand system flow and planning.

---

## 🎯 Purpose of This Project

* Understand the complete workflow of the system
* Visualize how different user roles interact
* Plan features before building the real application
* Demonstrate the idea to teachers / college

---

## 👥 User Roles (Simulated)

The system includes multiple roles:

* 👨‍🎓 Student
* 👩‍🏫 Class Teacher
* 🧑‍💼 Evaluation Team
* 🧑‍💻 Admin
* 🏫 HOD / IQAC

👉 You can switch roles using the dropdown in the UI.

---

## 🧩 Features Included

### 🔐 Login Page

* Simple login UI (no real authentication)

---

### 👨‍🎓 Student Dashboard

* View submitted activities
* Check status (Pending / Approved / Rejected)
* View marks after evaluation
* Add new submission

---

### 👩‍🏫 Teacher Dashboard

* View student submissions
* Approve / Reject / Request correction
* Add remarks

---

### 🧑‍💼 Evaluation Dashboard

* Pending and completed evaluation sections
* Single-step `Verify & Save` workflow
* Optional manual override with auto-mark fallback

---

### 🧑‍💻 Admin Panel

* Add / Edit / Delete criteria
* Set maximum marks
* Select academic year

---

### 🏫 HOD / IQAC Dashboard

* View class-wise performance
* Analyze scores, percentiles, and grades

---

### 🏆 Ranking Dashboard

* Leaderboard of classes
* Sorted by performance
* Top classes highlighted

---

## 🛠️ Tech Stack

* HTML
* CSS
* JavaScript (Vanilla)
* Dummy data (Hardcoded JSON)

---

## 📁 Project Structure

```
project-folder/
│
├── index.html
├── style.css
├── script.js
├── data.js
├── page-bootstrap.js
├── roles/
│   ├── student/
│   ├── teacher/
│   ├── evaluator/
│   ├── admin/
│   └── hod/
└── README.md
```

---

## ⚙️ How to Run

1. Download or clone the repository
2. Open the folder
3. Double-click `index.html`

👉 The project will run directly in your browser

---

## 📊 Important Notes

* No backend is used
* No real database
* No authentication system
* All data is stored temporarily in JavaScript

---

## 🚀 Future Improvements

This prototype can be converted into a full system by adding:

* Backend (Django / Node.js)
* Database (PostgreSQL / MySQL)
* Authentication system
* File upload (certificates, proofs)
* Real-time notifications
* Advanced analytics dashboard

---

## 💡 Key Concepts Demonstrated

* Role-based system design
* Multi-level workflow (submission → verification → evaluation)
* Dynamic criteria handling
* Ranking and grading logic

---

## 🙌 Author

**Sijomon**
Aspiring Full-Stack Developer 🚀

---

## ⭐ Final Note

This project is a **starting step** toward building a complete real-world college management system.

It helps in understanding the structure before moving into backend development.

---
