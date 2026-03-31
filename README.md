# Portfolio Amplifier V1

Portfolio Amplifier is a project-to-presence workflow for freelancers, studios, and product-minded service teams. It turns client work into a polished case study, transforms that story into channel-ready content, and centralizes review-response workflows in the same product.

Primary journey:

Onboard -> Create Project -> Build Portfolio -> Run Analysis -> Generate Platform Content -> Connect Channels -> Publish / Export -> Monitor Reviews -> Respond

## What’s Included

- Guided onboarding for account type, professional profile, channel presence, and first-goal setup
- Project-first workspace with case-study generation, proof-point capture, and portfolio drafting
- Publish Studio for visible platform analysis, channel scoring, and content generation
- Channel hub for LinkedIn, Dribbble, and Behance export-mode flows
- Reviews and ratings workspace with AI-assisted response drafts
- Demo-friendly frontend fallback when a live backend session is not available
- Express + PostgreSQL backend with auth, projects, amplify, channel, and ORM routes

## Stack

- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Backend: Node.js + Express + PostgreSQL
- Auth: Email/password + Google OAuth scaffold
- Publishing: LinkedIn + Dribbble OAuth scaffolds, Behance export-first workflow
- AI layer: Mock-first content and analysis services with external AI hooks ready

## App Sections

- `/` marketing landing page
- `/signup` workspace creation
- `/login` sign-in
- `/onboarding` guided onboarding flow
- `/dashboard` mission-control view
- `/dashboard/projects` project library and project creation wizard
- `/dashboard/publish-studio` platform analysis and draft generation
- `/dashboard/reviews` review inbox and AI responses
- `/dashboard/channels` channel connection hub
- `/dashboard/settings` workspace defaults

## Local Development

### Frontend

```bash
npm install
copy .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3001`.

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run migrate
npm run dev
```

Backend runs on `http://localhost:3000`.

## Environment Variables

Frontend example: [E:\GPT Builder\.env.example](E:/GPT%20Builder/.env.example)

```ini
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Backend example: [E:\GPT Builder\backend\.env.example](E:/GPT%20Builder/backend/.env.example)

Core backend variables:

- `PORT`
- `FRONTEND_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `DRIBBBLE_CLIENT_ID`
- `DRIBBBLE_CLIENT_SECRET`
- `AI_SERVICE_URL`
- `AI_API_KEY`

## API Surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/onboarding`
- `GET /api/projects`
- `GET /api/projects/:projectId`
- `POST /api/projects`
- `PUT /api/projects/:projectId/portfolio`
- `POST /api/amplify/:projectId/analyze`
- `POST /api/amplify/generate-content`
- `GET /api/channels/status`
- `GET /api/channels/:platform/connect-url`
- `GET /api/channels/behance/export-template`
- `GET /api/orm`
- `POST /api/orm/:id/respond`
- `POST /api/orm/:id/approve`

## Demo Mode

The frontend supports a seeded demo experience. If a user enters through the demo CTA or browses without a live backend session, onboarding and dashboard flows still work with seeded projects, publish drafts, channel states, and review data.

This makes the app easy to preview on Vercel even before the Express backend is hosted separately.

## Vercel Note

This repository is split into:

- a Next.js frontend at the repo root
- an Express/PostgreSQL backend under `backend/`

The Vercel deployment is best used for the frontend experience. For full live auth, project persistence, publishing, and ORM APIs, host the backend separately and set:

```ini
NEXT_PUBLIC_API_URL=https://your-backend-url
```

Without a hosted backend, the public deploy still supports the demo path and seeded product walkthrough.

## Repository Layout

```text
app/                    Next.js routes and app-shell pages
components/             Shared UI, layout, auth provider, dashboard screens
lib/                    API client, marketing data, demo data, view models
backend/                Express API, routes, middleware, database config, migration
docs/                   Supporting docs and runbooks
```

## Status

- Frontend production build passes
- Backend boots locally with a health endpoint
- Public repo documentation is ready
- Frontend release can be deployed on Vercel

