# Portfolio Amplifier Product Guide

## What the product is

Portfolio Amplifier is a project-to-presence workspace for freelancers, studios, and product builders who want to turn finished work into:

- Portfolio case studies
- LinkedIn posts and social distribution copy
- Guided export packs for Behance and Dribbble
- Review monitoring and response drafts

The product keeps all of that work attached to a project record, so storytelling, publishing, and reputation management do not drift into separate tools.

## Why it is required

Most independent professionals already have the raw material for authority building, but the work is fragmented:

- The project details live in scattered notes, screenshots, decks, or Figma files.
- The portfolio write-up is delayed because writing case studies takes too long.
- Social posts are created from scratch every time.
- Review responses are reactive instead of structured.

Portfolio Amplifier solves that by creating one reusable system:

1. Capture project context once.
2. Generate a reusable portfolio narrative.
3. Analyze which channel fits the project best.
4. Create channel-specific drafts from the same source asset.
5. Publish directly where APIs allow it.
6. Fall back to guided export where direct publishing is not reliable.

## Core user flow

1. Sign up or log in with email/password, Google, or LinkedIn.
2. Complete onboarding to capture workspace profile, goals, and channels used.
3. Click New project and upload supporting images, screenshots, PDFs, or other source files.
4. Fill in challenge, solution, results, deliverables, and supporting context.
5. Watch the staged AI build flow move through intake capture, asset organization, story extraction, portfolio composition, and channel analysis.
6. Review the final "How it looks right now" state before opening the full project.
5. Run Smart Analysis in Publish Studio.
6. Generate LinkedIn, Behance, or Dribbble draft content.
7. Connect LinkedIn or Dribbble in Channels.
8. Publish to LinkedIn directly from the dashboard, or export/guided-upload on the other channels.
9. Ingest reviews and generate response drafts in ORM.

## Exact technology stack

### Frontend

- Next.js 14 App Router for the product UI
- React 18 for interactive dashboard flows
- Tailwind CSS for styling
- Lucide React for icons
- Next API catch-all route at `pages/api/[...path].js` to boot the backend inside the Next app

### Backend

- Express application mounted through Next API routes for local/product parity
- Passport for Google OAuth
- Native LinkedIn OAuth flows for both login and channel connection
- JWT-based session tokens for authenticated API access
- Multer for project asset uploads

### Data and storage

- PostgreSQL-compatible relational schema for users, projects, drafts, channels, reviews, and settings
- Supabase Postgres is the intended production database through `DATABASE_URL`
- Supabase Storage is the preferred asset store through:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_STORAGE_BUCKET`
- Vercel Blob is the optional fallback for uploads
- An embedded in-memory Postgres-compatible database is used automatically for local development when no real `DATABASE_URL` is configured, so login and save flows can still run locally

### AI and content generation

- AI-backed draft generation through backend service abstractions in `backend/src/services/ai.js`
- Project build orchestration through `backend/src/services/project-builder.js`
- OpenAI-compatible remote AI support through `AI_API_KEY` with `AI_SERVICE_URL` defaulting to `https://api.openai.com/v1`
- Deterministic fallback behavior when the external AI key is not configured

## Supabase integration model

Supabase is used in two ways:

1. Supabase Postgres
   Use the Supabase transaction pooler or direct Postgres connection string in `DATABASE_URL`. This stores users, onboarding data, projects, generated drafts, channel connections, and review records.

2. Supabase Storage
   Project assets are uploaded to a public bucket and the stored URLs are saved back into the project record.

Important note:
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are not enough by themselves to replace `DATABASE_URL`. The app still needs a Postgres connection string for the relational database layer.

## Authentication model

- Email/password signup and login are handled by the backend user table plus bcrypt password hashes.
- Google OAuth can create or log in a user and then redirect back to the frontend with a JWT token.
- LinkedIn login uses OpenID scopes for account authentication.
- LinkedIn channel connection uses publish scopes so the app can post on behalf of the connected member from Publish Studio.
- The frontend stores the JWT token in local storage and refreshes the current user through `/api/auth/me`.

## LinkedIn publishing model

There are two separate LinkedIn flows:

1. LinkedIn login
   Route family: `/api/auth/linkedin`
   Purpose: sign the user into the product.

2. LinkedIn channel connection for publishing
   Route family: `/api/channels/linkedin/*`
   Purpose: connect the member account that the dashboard will publish from.

Once the channel is connected, Publish Studio can call `/api/amplify/drafts/:draftId/publish` and the backend publishes to LinkedIn UGC Posts using the stored member token.

## API endpoints

All current backend endpoints are mounted under `/api`.

### Health

- `GET /api/health`
- `GET /api/health/db`

### Auth

- `GET /api/auth/providers`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/linkedin`
- `GET /api/auth/linkedin/callback`
- `GET /api/auth/me`
- `POST /api/auth/onboarding`

### Projects

- `GET /api/projects/public/:slug`
- `GET /api/projects`
- `GET /api/projects/:projectId`
- `GET /api/projects/:projectId/build-status`
- `POST /api/projects`
- `POST /api/projects/:projectId/generate-portfolio`
- `PUT /api/projects/:projectId/portfolio`
- `PUT /api/projects/:projectId`
- `DELETE /api/projects/:projectId`

### Amplify / Publish Studio

- `POST /api/amplify/:projectId/analyze`
- `POST /api/amplify/generate-content`
- `GET /api/amplify/:projectId/drafts`
- `GET /api/amplify/drafts/:draftId`
- `PUT /api/amplify/drafts/:draftId`
- `POST /api/amplify/drafts/:draftId/schedule`
- `POST /api/amplify/drafts/:draftId/export`
- `POST /api/amplify/drafts/:draftId/publish`

### Channels

- `GET /api/channels/status`
- `GET /api/channels/:platform/connect-url`
- `GET /api/channels/:platform/setup-guide`
- `GET /api/channels/linkedin/connect`
- `GET /api/channels/linkedin/callback`
- `GET /api/channels/dribbble/connect`
- `GET /api/channels/dribbble/callback`
- `GET /api/channels/behance/export-template`
- `DELETE /api/channels/:platform`

### ORM / Reviews

- `GET /api/orm`
- `GET /api/orm/insights`
- `GET /api/orm/:id`
- `POST /api/orm/ingest`
- `POST /api/orm/:id/respond`
- `POST /api/orm/:id/approve`

### Dashboard

- `GET /api/dashboard/summary`

### Settings

- `GET /api/settings`
- `PUT /api/settings/profile`
- `PUT /api/settings/defaults`
- `DELETE /api/settings/data`

## Main data entities

- `users`
- `user_preferences`
- `workspace_settings`
- `projects`
- `projects.build_stage`
- `projects.build_progress`
- `projects.build_started_at`
- `projects.build_completed_at`
- `projects.last_build_error`
- `portfolios`
- `analysis_results`
- `generated_content`
- `user_channels`
- `reviews`

## Required environment variables

### Minimum for local development with embedded database

- `JWT_SECRET`
- Optional OAuth values if you want Google or LinkedIn auth to run
- Optional Supabase Storage values if you want uploads to go to Supabase instead of local fallback

### Minimum for production with Supabase

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

### Required for LinkedIn

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_AUTH_REDIRECT_URI` for login
- `LINKEDIN_REDIRECT_URI` for publishing-channel connection

## Operational notes

- If `DATABASE_URL` is missing in local development, the app now starts an embedded Postgres-compatible database automatically.
- In production, the app should point to Supabase Postgres through `DATABASE_URL`.
- The New project flow is now backed by persisted build stages, so the UI can show intake, build, and review states from real backend logic.
- Behance intentionally stays export-first in V1.
- Dribbble uses guided upload in V1.
- LinkedIn is the direct publish channel in the current product version.
