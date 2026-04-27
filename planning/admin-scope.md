# Admin Scope and Gap Analysis

## Goal
Define what the Admin role already does in this UI-only prototype and what still needs to be built so the admin experience stays aligned with the rest of the stakeholder workflow.

## Prototype Context
- This is a frontend-only prototype.
- There is no backend, no real authentication, and no server-side persistence yet.
- The admin UI should stay in sync with the same data used by Student, Teacher, Evaluator, and HOD/IQAC views.
- The shared prototype data currently comes from `data.js`, `page-bootstrap.js`, and the shared renderer in `script.js`.

## What Admin Has Now

### Dashboard Overview
- Sees an admin dashboard summary.
- Can view system snapshot metrics such as:
  - total criteria categories
  - total criteria items
  - selected academic year
- Can see general workflow status cards that reflect the current prototype dataset.

### Academic Year Control
- Can switch the active academic year from the criteria management page.
- The selected year is shown in the top bar and in the admin dashboard snapshot.

### Criteria Category Management
- Can add a new criteria category.
- Can see existing categories grouped in a table.
- Duplicate category names are blocked.

### Criteria Item Management
- Can add criteria items under a selected category.
- Can edit an existing criteria item.
- Can delete a criteria item.
- Can move a criteria item to another category while editing.
- Can define item types that the prototype already supports:
  - fixed
  - count based
  - range based
  - negative marks
- Can enter range rules in text form for range-based criteria.
- Can see a readable rule summary for each item.

### Safety Checks Already Present
- Criteria items used by submissions cannot be deleted.
- Range rules must be valid before an item can be saved.
- Negative items cannot use positive marks.
- Duplicate category titles are rejected.

## Completed Admin Scope

### Persistence and Shared Sync
- Completed as a planning item.
- The admin scope now treats criteria, academic year, and submission state as shared data across stakeholder views.
- See [completed/persistence-and-shared-sync.md](completed/persistence-and-shared-sync.md).

### Admin Edit Coverage
- Completed as a planning item.
- The admin scope now records category rename, archive/delete safety, reorder support, and bulk edit as covered admin requirements.
- See [completed/admin-edit-coverage.md](completed/admin-edit-coverage.md).

### Governance and Audit
- Completed as a planning item.
- The admin scope now includes audit trail, version history, and rollback planning for admin changes.
- See [completed/governance-and-audit.md](completed/governance-and-audit.md).

### Stakeholder Coordination
- Completed as a planning item.
- The admin scope now ties admin updates to student, teacher, evaluator, and HOD/IQAC views so everyone reads the same effective rules and counts.
- See [completed/stakeholder-coordination.md](completed/stakeholder-coordination.md).

### Reporting and Controls
- Completed as a planning item.
- The admin scope now captures reporting, export/import, pending workflow summaries, and the permission model gap.
- See [completed/reporting-and-controls.md](completed/reporting-and-controls.md).

## Completed Major Features

### Academic Year Lifecycle
- Completed as a planning item.
- The admin scope now covers year creation, activation and deactivation, one active year at a time, and protecting prior-year data.
- See [completed/academic-year-lifecycle.md](completed/academic-year-lifecycle.md).

### Criteria Structure and History
- Completed as a planning item.
- The admin scope now covers the Criterion to Sub-criterion hierarchy, academic-year-based loading, criteria history, and max-marks display.
- See [completed/criteria-structure-and-history.md](completed/criteria-structure-and-history.md).

### Criteria Locking
- Completed as a planning item.
- The admin scope now includes a lock action, confirmation before locking, and edit blocking after evaluation begins.
- See [completed/criteria-locking.md](completed/criteria-locking.md).

### User and Role Management
- Completed as a planning item.
- The admin scope now covers user creation, role assignment, editing and deleting users, and role or department filters.
- See [completed/user-and-role-management.md](completed/user-and-role-management.md).

### Admin Dashboard Controls
- Completed as a planning item.
- The admin scope now covers total classes, submission status, evaluation progress, and active academic year visibility.
- See [completed/admin-dashboard-controls.md](completed/admin-dashboard-controls.md).

### Usability and Safety Improvements
- Completed as a planning item.
- The admin scope now covers duplicate handling, stronger validation, dependency warnings, and clear feedback for critical admin actions.
- See [completed/usability-and-safety-improvements.md](completed/usability-and-safety-improvements.md).

## Implementation Backlog

The items below remain the code implementation backlog for the admin UI.

### Must Have
- Persist criteria and academic year changes.
- Add category rename.
- Add category archive/delete with safety checks.
- Add a clear save/publish action for admin configuration.
- Keep the admin data model synchronized with the other role dashboards.
- Support academic year creation and activation controls.
- Add criteria locking before evaluation starts.
- Add user and role management screens.

### Should Have
- Search and filter criteria items.
- Better validation for range rules and marks values.
- Change history for criteria and academic year edits.
- Basic export of criteria configuration for review and backup.

### Nice to Have
- Reorder categories and criteria items.
- Duplicate item detection within a category.
- Draft vs published admin configuration states.
- Admin notes or comments for stakeholder handoff.

## Data Sync Notes
- For this prototype, admin should be treated as the source of criteria truth.
- Student, Teacher, Evaluator, and HOD/IQAC pages should read from the same seeded data and the same updated criteria state.
- If a real backend is added later, criteria and submissions should move to one shared API so every role sees the same live data.

## Summary
The current admin UI already covers the core prototype actions for criteria and academic year management. The next work should focus on persistence, shared data sync, auditability, and the missing admin controls needed to make the role feel complete across the rest of the stakeholder workflow.
