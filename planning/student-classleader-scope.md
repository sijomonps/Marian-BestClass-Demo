# Student and Class Leader Scope (UI Prototype)

## Goal
This document defines clear role boundaries for Student and Class Leader (including DQC-style responsibilities) and a low-conflict implementation plan for this UI-only prototype.

## Project Constraints
- Only two active user roles for now:
  - Student
  - Class Leader
- UI-only prototype (no backend, no real authentication)
- Keep code changes minimal and focused to reduce merge conflicts
- Prefer changing only role-relevant files and avoid broad refactors

## Stakeholders and Responsibilities

### Student
- Enter activity details before deadline
- Upload proof/evidence (certificate/image/file/link)
- Submit activity for verification
- Edit submission when feedback is provided
- View criteria-wise status and marks

### Class Leader (DQC-style role for this prototype)
- Perform all Student actions
- Review submissions from all students in class
- Add feedback/remarks
- Update status (Approved, Rejected, Correction Requested)
- Edit and delete entries when correction/admin cleanup is needed (prototype CRUD authority)
- Monitor criteria-wise completion and progress overview

## Clear Distinction Between Student and Class Leader

### Scope of Data Access
- Student:
  - Can see only own submissions
- Class Leader:
  - Can see submissions from all students

### Action Permissions
- Student:
  - Create submission
  - Update own submission when allowed (especially after feedback)
  - Delete own draft/pending submission (if we enable this)
- Class Leader:
  - Create submission (same as student)
  - Update any submission in class
  - Delete any submission in class
  - Change review status and add remarks

### Status/Marks Visibility
- Student:
  - View own status and marks
- Class Leader:
  - View status and marks for all students
  - Manage status transitions for review workflow

## Proposed UI-Only Workflow
1. User selects role on login screen (Student or Class Leader).
2. Student dashboard:
   - Add new activity with proof
   - List only own activities
   - Edit allowed records based on status
   - See status and marks
3. Class Leader dashboard:
   - View all student activities
   - Create/Edit/Delete any activity
   - Add remarks
   - Set status: Approved/Rejected/Correction Requested
4. Data storage:
   - Use localStorage for persistence in browser (prototype-safe)

## Conflict-Safe File Change Plan
To reduce conflicts, we should keep changes targeted:
- Primary files to touch:
  - index.html (role options, role labels)
  - script.js (role config, permission logic, dashboard rendering, localStorage helpers)
- Optional file:
  - style.css (only if class leader UI needs small visual changes)
- Files to avoid touching for now:
  - admin.html
  - evaluator.html
  - hod.html
  - ranking.html
  - teacher.html
  - student.html

## Implementation Plan (Incremental)

### Phase 1: Role Restriction and Entry Point
- Limit role selector to Student and Class Leader only
- Normalize role key naming to avoid ambiguity (for example: student, classleader)
- Ensure topbar/sidebar labels match selected role

### Phase 2: Data Model and Persistence
- Add localStorage read/write wrapper for submissions
- Keep a stable submission schema:
  - id
  - studentId
  - criteriaId
  - description
  - proof
  - status
  - remarks
  - marks
  - createdAt
  - updatedAt

### Phase 3: Student Experience
- Show only own records
- Add create form
- Allow edit after feedback (Correction Requested) and maybe Pending
- Show criteria-wise status and marks summary

### Phase 4: Class Leader Experience
- Show all student submissions
- Enable full CRUD for class submissions
- Enable status and remark updates
- Keep all actions in one dashboard to reduce UI complexity

### Phase 5: Prototype Validation
- Test role-switch flow
- Test create/edit/delete paths
- Test status/marks visibility boundaries
- Test localStorage reload persistence

## Questions for You
1. Should Class Leader be allowed to assign marks directly, or only status and remarks?
2. Can Student delete submissions after they are already Approved, or only while Pending/Correction Requested?
3. Should Class Leader edit only submissions from the same class, or all demo students in current dataset?
4. Do we keep both labels “Class Leader” and “DQC Member” visible, or use only one label in UI?
5. For proof upload in UI-only mode, is storing filename enough, or do you want file preview metadata too?
6. Should we keep existing non-target roles hidden (not deleted) to avoid large diffs, or remove them fully from login options now?

## Next Step After Your Approval
After you confirm this plan, implementation will start with minimal-diff edits only in targeted files, beginning with role restriction and permissions.
