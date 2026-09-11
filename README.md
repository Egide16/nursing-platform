# Knowledge Cornerstone — Training & Inspections Platform (Sample)

This is a working sample built to show the data model and core flows for
review — not a finished, production-hardened app. It's meant to be read,
clicked through locally, and marked up with what to change.

## Stack

- **Next.js 14** (App Router) — one codebase for pages, API routes, and
  server actions.
- **PostgreSQL** via **Prisma** — the schema is the clearest place to see
  every entity and relationship (`prisma/schema.prisma`).
- **NextAuth (Auth.js)** with email/password credentials — swappable for
  SSO later without touching the data model.
- **Tailwind CSS** for styling, **pdf-lib** for certificate PDFs.

## Roles

- **Student** — takes courses in order, downloads certificates.
- **Company Admin** — belongs to one company (a group-home operator);
  manages that company's group homes, residents, and staff/students.
- **Inspector** — Knowledge Cornerstone staff who run inspections against any group
  home.
- **Super Admin** — Knowledge Cornerstone staff with full access (can also inspect).

## Deploying to AWS

Terraform for the actual AWS infrastructure (ECS Fargate, RDS, ALB, etc.)
lives in `terraform/` in this same repo, with its own
[`terraform/README.md`](terraform/README.md). The `Dockerfile` and
`.github/workflows/` at the repo root are part of that deployment story
too — see `terraform/README.md` for the full setup walkthrough.

## Getting it running locally

1. `npm install`
2. Create a Postgres database and set `DATABASE_URL` in `.env`
   (copy `.env.example`). Also set `NEXTAUTH_SECRET`
   (`openssl rand -base64 32`).
3. `npx prisma migrate dev --name init`
4. `npm run seed` — creates 3 courses (CRMA, Insulin Administration,
   First Aid), one inspection checklist template, 2 sample companies
   with group homes and residents, and one login per role. The seed
   script prints the demo password and the four seeded emails when it
   finishes.
5. `npm run dev` — visit `http://localhost:3000` and log in as any
   seeded user.

## What's actually implemented

- **Sequential course unlocking, enforced server-side.** The lock state
  lives in the database (`CourseProgress.status`), and the quiz is
  graded on the server in `api/courses/[courseId]/submit` — the client
  never sees which option is correct, and a locked or already-completed
  course can't be resubmitted no matter what the client sends.
- **Certificates** are generated on course completion with an
  expiration date (`Course.validityMonths`, currently 24/12/24 for the
  three seeded courses) and are downloadable as a real PDF
  (`lib/certificate-pdf.ts`).
- **Expiration is visible everywhere it matters**: the student
  dashboard, the company admin's staff overview, and an admin-wide
  "expiring within 60 days" list.
- **Companies → group homes → residents** is a real hierarchy a company
  admin manages themselves (add a group home, add residents to it, add
  staff/students).
- **Inspections** are checklist-based: an inspector picks a group home
  and a checklist template, which copies that template's items onto a
  new `Inspection` (so editing a template later doesn't rewrite past
  visits). Each item is scored Pass/Fail/N-A with notes, and a score is
  computed as Pass ÷ (Pass + Fail), excluding N-A.

## Deliberately stubbed or simplified — flag what you want changed

- **No `prisma/migrations/` history yet.** The schema is applied with
  `prisma db push` (syncs the database straight to `schema.prisma`)
  rather than versioned migration files — that's why step 3 above uses
  `migrate dev`, which generates that folder the first time it's run
  against a real database. Once it exists, commit it, and switch
  `deploy.yml` and `terraform/README.md`'s bootstrap step over to
  `prisma migrate deploy` for real migration history going forward.
- **Course content is seed-only.** There's no admin UI yet for editing
  course text, adding modules, or writing quiz questions — that all
  lives in `prisma/seed.ts`. Worth building if course content changes
  often.
- **Checklist templates are seed-only too** — one template ("Standard
  Group Home Inspection") is created by the seed script. No UI yet to
  create a second template or edit an existing one.
- **One linear course sequence for everyone.** Right now every student
  follows the same order (CRMA → Insulin → First Aid). If different
  companies or roles need different required courses, or some courses
  should run in parallel rather than strictly sequentially, the data
  model supports it but the UI doesn't yet.
- **Company admins create students with a temporary password directly**
  (no invite email / forced reset on first login). Fine for a pilot,
  not for real staff onboarding.
- **No email notifications** — nothing currently emails a student or
  company admin as a certificate approaches expiration, even though the
  data needed to trigger that is already there.
- **No file uploads** — inspections are text/checkbox only; no photo
  attachments per checklist item.
- **No audit trail** on edits (who changed what, when) beyond what
  `updatedAt`/`createdAt` timestamps give you.
- Auth is email/password only; no password reset flow yet.

## Decisions made so far

1. **CRMA is issued by the State of Maine**; Insulin Administration and
   First Aid are issued directly by Knowledge Cornerstone. Reflected in
   `Course.issuingAuthority` — shown on the certificate itself, and
   swapped in automatically wherever the company name would otherwise
   appear.
2. **CRMA also tracks a real state license number**, separate from our
   own training-completion certificate — `Course.requiresExternalLicense`
   and `CourseProgress.licenseNumber`/`licenseIssuedAt`. A company admin
   fills this in once the student actually receives it (company
   overview page); it's null until then, and the certificate says so
   plainly rather than implying a number that doesn't exist yet.
3. **Inspections are always logged after the fact** — no scheduling or
   future-dated visits. Matches how `Inspection.visitDate` already
   works (defaults to creation time, not user-editable).
4. **Inspection results are visible to the company admin directly in
   the platform** — a read-only view (`/company/inspections/[id]`),
   not a separate report or email.
5. **No mid-cycle retakes and no per-company course requirements** —
   every company follows the same three-course sequence, and a
   completed course is only retaken at its natural expiration. Both
   could be added later if that changes.
