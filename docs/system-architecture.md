# System Architecture

## High-Level Flow

1. Admin defines criteria
2. Student submits activity
3. Teacher verifies submission
4. Evaluator verifies and assigns marks
5. System calculates score
6. HOD/IQAC reviews performance

## Architecture Type
- Frontend: HTML, CSS, JavaScript (Static prototype)
- No backend (for demo)
- State handled in JavaScript

## Modules
- Authentication (role-based)
- Submission module
- Verification module
- Evaluation module
- Scoring engine
- Dashboard & reports

## Data Flow

Student → Teacher → Evaluator → System → Dashboard → Ranking