# Portfolio Amplifier V1

A local full-stack prototype for the product flow:

Onboard -> Create Project -> Build Portfolio -> Run Analysis -> Generate Platform Content -> Connect Channels -> Publish / Export -> Monitor Reviews -> Respond

## Stack

- Frontend: Next.js App Router + Tailwind CSS
- Backend: Node.js + Express + PostgreSQL
- Auth: Email/password + Google OAuth scaffold
- Publishing: LinkedIn + Dribbble OAuth scaffolds, Behance export-first flow

## Local Run

### 1. Frontend

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3001`.

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run migrate
npm run dev
```

Backend runs on `http://localhost:3000`.

## Environment Files

- Frontend example: [.env.example](/E:/GPT%20Builder/.env.example)
- Backend example: [backend/.env.example](/E:/GPT%20Builder/backend/.env.example)

## Key Routes

- Marketing: `/`
- Signup: `/signup`
- Login: `/login`
- Onboarding: `/onboarding`
- Dashboard: `/dashboard`
- Projects: `/dashboard/projects`
- Publish Studio: `/dashboard/publish-studio`
- Reviews & Ratings: `/dashboard/reviews`
- Channels: `/dashboard/channels`

## Backend APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/onboarding`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:projectId/generate-portfolio`
- `POST /api/amplify/:projectId/analyze`
- `POST /api/amplify/generate-content`
- `GET /api/channels/status`
- `GET /api/channels/behance/export-template`
- `GET /api/orm`
- `POST /api/orm/ingest`
- `POST /api/orm/:id/respond`

## Notes

- Behance is intentionally modeled as export-first in V1.
- The cloned GSD for Antigravity workflow is installed into this workspace before implementation.
- Manual fallback copies were placed in `C:\Users\ajay\.codex\skills\gsd-planner` and `C:\Users\ajay\.codex\skills\gsd-verifier` because the bundled skill installer requires Python on this machine.
