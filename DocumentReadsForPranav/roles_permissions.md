# Role Permissions

## Can a user have multiple roles?
Yes. The system uses a join table (public.user_roles) with a composite primary key (user_id, role_id). A single user_id can appear in multiple rows with different role_id values. Permissions are additive based on role checks.

## Admin (role: admin)
### Database (RLS)
- Full read/write on: roles, user_roles, levels, contests, contest_access, contest_graders, contest_problems, leaderboards, ratings, rating_history.
- Read on: contests (all), submissions, grades, grade_parts, submission_versions.
- Read on: audit_logs, ip_logs, anti_cheat_events, submission_similarity.
- Read on: users (all).

### API
- Create/edit contests: POST /api/contests
- Attach problems to contest: POST /api/contest-problems
- Assign graders: POST /api/admin-assign-grader
- Finalize contests: POST /api/contest-finalize
- Recalculate ratings: POST /api/admin-recalculate-ratings
- Override ratings: POST /api/admin-override-rating
- Update contest states: POST /api/contest-tick
- Create/edit problems (also allowed): POST /api/problems
- Grade submissions (also allowed): POST /api/grading

## Problem Manager (role: problem_manager)
### Database (RLS)
- Full read/write on: problems, problem_parts.
- Read on: contests, contest_problems.

### API
- Create/edit problems: POST /api/problems

## Grader (role: grader)
### Database (RLS)
- Read on: submissions for contests they are assigned to (contest_graders).
- Read/write on: grades and grade_parts for submissions in assigned contests.

### API
- Grade submissions: POST /api/grading

## Regular authenticated user
### Database (RLS)
- Read on: contests (public or allowed), levels, problems, problem_parts.
- Create/update own contest_sessions.
- Create/update own submissions while contest window is open.
- Read own submissions and submission_versions.
- Read own grades.
- Insert anti_cheat_events and ip_logs (self only).

### API
- Join contests: POST /api/contest-join
- Save/submit solutions: POST /api/submissions
- View submission versions: GET /api/submission-versions
- View leaderboards: GET /api/leaderboards
- View rating history: GET /api/ratings
- Log anti-cheat events: POST /api/anti-cheat-log
