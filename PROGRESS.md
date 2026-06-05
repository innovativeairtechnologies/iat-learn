# IAT Learn — Project Progress

## What this is
A Trainual replacement for Innovative Air Technologies. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase. Runs on port 3001. There is a separate forms portal at `../iat-forms-portal` — do not touch it from this project.

---

## Session: 2026-06-04 — Phase 1 Complete

### What was built today

**Week 4 — Tiptap Rich-Text Step Editor**
- Installed Tiptap v3 (`@tiptap/react`, `@tiptap/starter-kit`, + 5 extensions)
- Created `/admin/content/[subjectId]/topics/[topicId]/steps/[stepId]` — full step editor page
- Toolbar: bold, italic, underline, strikethrough, H1–H3, bullet/ordered lists, blockquote, inline code, code block, HR, link, image (URL), YouTube embed
- Auto-save with 1.5s debounce — Saving / Saved / Unsaved indicator in sticky header
- Publish toggle, inline title + estimated minutes editing (save on blur)
- Featured video field with YouTube/Vimeo embed preview
- Step title in `SubjectEditor` is now a link to the step editor; pencil icon navigates there too

**Week 5 — Employee Subject Browser**
- `/learn` — subject grid with category filter tabs, topic/step counts, total time estimate
- `/learn/[subjectId]` — subject overview with numbered topic/step tree and "Start Learning" CTA
- `/learn/[subjectId]/steps/[stepId]` — step reader with sticky sidebar (topic/step tree, active highlight), read-only Tiptap content renderer, featured video embed, prev/next step navigation
- TopNav "Learn" link unlocked (was marked Soon)
- Admin dashboard updated: live published subjects count, Phase Card Weeks 1–5 marked done

**Week 6 — Progress Tracking + File Attachments**
- Migration `003_week6_progress.sql` — creates `user_step_progress` table and `step-attachments` Supabase Storage bucket ✅ already run
- `StepProgressTracker` client component: auto-starts `in_progress` on page load, saves time every 30s, sends beacon on tab close, "Mark Complete" button
- Step reader sidebar: green checkmarks on completed steps
- Step editor: file upload → Supabase Storage → `step_attachments` record; list with delete
- Employee dashboard: live stats (available subjects, completed steps, points) + "Browse Library" CTA replaces coming-soon banner
- Admin Phase Card: 6/6 complete (100%)

**Bug fixes made today**
- `lib/api-auth.ts` — `requireAdmin()` was using the regular Supabase client for role lookup, hitting a circular RLS dependency and silently returning 403. Fixed to use `createAdminClient()` (service role) for both the role check and all downstream operations. This was causing all category/subject/topic/step creates to silently fail.
- `app/(admin)/admin/content/page.tsx` and `[subjectId]/page.tsx` — were mixing `createClient()` (user JWT + RLS) for categories with `createAdminClient()` for everything else. The `cat_read` RLS policy returns zero rows for the `anon` role, so categories were invisible after navigation. Fixed: all admin page queries now use `createAdminClient()` exclusively.
- Added `export const dynamic = 'force-dynamic'` to the content page and `revalidatePath('/admin/content')` to category/subject write routes to prevent Next.js Data Cache from serving stale data.
- Fixed pre-existing ESLint error in employee dashboard (unescaped apostrophe blocking production builds).
- Added spacing between "Featured Video" and "Attachments" cards in the step editor.

---

## Current state — Phase 1 is feature-complete

### What works end-to-end
- Admin can invite users, manage departments, create categories/subjects/topics/steps
- Rich-text step editor with attachments and video
- Employees can browse subjects, read steps, mark steps complete, track time
- Progress persists across sessions

### What's marked "Soon" (Phase 2 scope)
- Admin sidebar: **Paths**, **Reports**
- Employee top nav: **My Paths**, **Leaderboard**

---

## Session: 2026-06-05 — Phase 2 Complete

### What was built today

**Points system**
- Step completion now awards 10 points (first completion only) via `/api/progress/[stepId]`

**Leaderboard** (`/leaderboard`)
- Employee page ranking all active users by points
- Highlights current user's position; crown/medal icons for top 3
- Callout card if you're outside top 3 showing your rank

**Employee Profile** (`/profile`)
- Stats: points, rank, steps completed, total time spent
- Recent completions list
- Department and role display

**Subject Assignments**
- `subject_assignments` table — assign subjects to specific users or departments
- If no assignments exist for a subject → visible to all (backwards compatible)
- Admin: "Visibility" card on subject editor with user/dept selector
- Employee: `/learn` filters subjects by assignment

**Learning Paths** (admin + employee)
- `paths`, `path_subjects`, `path_enrollments` tables
- Admin: `/admin/paths` — create/edit/delete/publish paths, select ordered subjects
- Employee: `/paths` — path grid; `/paths/[id]` — step-by-step progress view with enroll/unenroll

**Admin Reports** (`/admin/reports`)
- Summary stats: active employees, learners, total completions, total time
- Per-subject completion bar chart with started/completed counts
- Top learners leaderboard
- Recent completions feed

**Cover Images**
- `subject-covers` Supabase Storage bucket
- Upload UI on subject editor page (below topics list)
- Stored as `cover_image_url` on subject (was already in schema)

**Quizzes**
- `quiz_questions`, `quiz_options`, `quiz_attempts` tables
- Admin: quiz editor below step content — add questions with multiple-choice options, mark correct answer
- Employee: quiz shown on step reader when `requires_quiz = true`; must score ≥80% to unlock Mark Complete
- Pass auto-completes the step

**Notifications**
- `lib/email.ts` — Resend email helper (no-ops if key is placeholder)
- Assignment email sent to directly-assigned users

**Navigation**
- Admin sidebar: Paths and Reports unlocked (removed "Soon")
- Employee top nav: My Paths and Leaderboard unlocked

**Migration**
- `004_phase2.sql` — all Phase 2 tables + RLS + subject-covers storage bucket

---

## Phase 2 — What's next

These are the natural next features to build. Pick up from here in the next session:

### High priority
1. **Assign subjects to employees** — right now all published subjects are visible to all employees. Phase 2 needs a `subject_assignments` table (or department-based assignment) so admins can control who sees what.
2. **Learning paths** — ordered sequences of subjects. Needs a `paths` and `path_subjects` table. Admin builds a path, employees follow it in order.
3. **Points / gamification** — the `points` column exists on `user_profiles` but nothing awards them yet. Hook into step completion to award points.

### Medium priority
4. **Reports page** (admin) — completion rates per subject, per employee, time-spent analytics. Can be built once there's meaningful `user_step_progress` data.
5. **Leaderboard** (employee) — ranks employees by points. Simple query on `user_profiles.points`.
6. **Quiz/knowledge check on steps** — `requires_quiz` column already exists on steps, just needs UI and a `quiz_questions` table.

### Nice to have
7. **Subject cover images** — `cover_image_url` column exists on subjects, just needs an upload UI (same Supabase Storage pattern as attachments).
8. **Employee profile page** — `/profile` route is linked in the top nav dropdown but doesn't exist yet.
9. **Notifications** — email when assigned a new subject, reminder if not started.

---

## Key technical notes for next session

### Always use `createAdminClient()` on admin pages
Never mix `createClient()` (user JWT) with `createAdminClient()` on the same admin server page. The RLS `authenticated` role check can silently return zero rows if the JWT has any lapse. All admin server pages should use `createAdminClient()` for every `.from()` query.

### Dev server management
The user cannot run terminal commands — opening a terminal breaks the CSS. Always manage the dev server through Claude Code tools:
1. `Get-NetTCPConnection -LocalPort 3001` → get PID
2. PowerShell: `Stop-Process -Id <PID> -Force`
3. Bash: `cd "C:\Users\JacobY\iat-learn" && npm run dev` with `run_in_background: true`

### SQL migrations
User runs migrations manually in Supabase Dashboard → SQL Editor. Always generate a new numbered file in `supabase/migrations/` and tell the user to run it before testing the feature. Migration files so far:
- `001_week1_schema.sql` — departments, user_profiles, invitations
- `002_week3_content.sql` — categories, subjects, topics, steps, step_attachments
- `003_week6_progress.sql` — user_step_progress, step-attachments storage bucket

### Design system
All colors use CSS custom properties (`var(--brand)`, `var(--surface)`, `var(--text-1)`, etc.) defined in `globals.css`. Never hardcode colors. Event handlers cannot go in Server Components — use the `.hover-surface` CSS utility or extract to a client component.

### Supabase clients
- `lib/supabase/client.ts` — browser client (client components)
- `lib/supabase/server.ts` — server client with user JWT (use only for `auth.getUser()` in admin pages)
- `lib/supabase/admin.ts` — service role, bypasses RLS (use for all data queries on admin pages)
