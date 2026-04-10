# Portfolio Amplifier

## Turn client work into winning case studies and shareable launch-ready campaigns.

Portfolio Amplifier is the fast track from raw project work to polished portfolio story, AI-driven channel content, and ready-to-publish distribution.

It is built for freelancers, studios, and product teams who want to stop leaving marketing to the end of a project.

---

## What this product does

### Build a stronger project story
- Capture client impact and proof points in one structured project workflow
- Create a living case study that updates as the project grows
- Automatically turn project details into polished portfolio content

### Generate publish-ready content
- AI-powered social copy for LinkedIn, Behance, Dribbble, and Google
- Tone, format, and channel recommendations baked into every draft
- Asset sourcing from uploaded files, external URLs, and reference imagery

### Publish with confidence
- Channel scoring and distribution guidance show where your work will land best
- Export-friendly Behance output, guided Dribbble uploads, and LinkedIn publish readiness
- Built-in review and response workflows keep client feedback moving

### Launch faster, with less busywork
- Guided onboarding gets new work flowing quickly
- Project creation wizard simplifies case study setup
- Demo-ready mode means stakeholders can preview the product immediately

---

## Product highlights

### Publish Studio
A single workspace for platform analysis, draft generation, asset guidance, and publishing readiness.

### Project Workbench
Turn client projects into rich portfolio stories with challenge > solution > results structure, deliverable capture, and proof-point tracking.

### AI-powered storytelling
Use intelligent prompts to generate crisp social posts while preserving your project voice and impact.

### Review + response workflows
Keep client feedback in one place and auto-generate response drafts for faster issue resolution.

---

## Why users love it

- Saves time by turning project notes into complete portfolio drafts
- Helps teams stay consistent across channels and customer stories
- Makes publishing feel less like a chore and more like a product launch
- Brings clarity to what content belongs on LinkedIn, Behance, and Dribbble

---

## Experience map

1. **Onboard** — define your profile, goals, and channel presence
2. **Create a project** — add the brief, challenge, solution, results, and assets
3. **Build portfolio** — generate structured case study content and proof points
4. **Analyze fit** — get recommended channel angles and distribution advice
5. **Generate content** — produce platform-specific copy and asset recommendations
6. **Publish / export** — prepare direct posts, guided uploads, or export-ready assets
7. **Monitor reviews** — collect feedback and auto-draft smart responses

---

## Core features

- Guided onboarding and workspace setup
- Modern case-study builder with step-by-step project creation
- AI content generation for marketing-ready social copy
- Platform-specific strategy recommendations
- Asset sourcing and reference imagery guidance
- Review inbox with AI-assisted response drafts
- LinkedIn, Behance, Dribbble, and Google publishing workflows
- Demo-friendly mode for instant previews

---

## Product structure

- `app/` — Next.js app pages and layouts for the product experience
- `components/` — UI building blocks and dashboard screens
- `lib/` — client-side API, workflow data, demo content, and view models
- `backend/` — Express API, auth, database, and AI services
- `docs/` — product guides, runbooks, and reference materials

---

## Quick start

### Frontend
```bash
npm install
copy .env.example .env.local
npm run dev
```

Open the app at `http://localhost:3001`.

### Backend
```bash
cd backend
npm install
copy .env.example .env
npm run migrate
npm run dev
```

API runs at `http://localhost:3000`.

---

## Production setup

- Use one Vercel project for the frontend and API
- Connect a PostgreSQL database via `DATABASE_URL`
- Store uploads in Supabase Storage or another cloud bucket
- Set `AI_API_KEY` and `AI_SERVICE_URL` for your chosen generative AI provider
- Keep `NEXT_PUBLIC_API_URL` unset in production so the frontend uses same-domain API routing

---

## Built with

- Next.js + TypeScript + Tailwind CSS
- React for fast UI interactions
- Express + PostgreSQL for backend persistence
- AI services for content and image prompt generation
- OAuth-ready auth for Google, LinkedIn, and Dribbble

---

## Launch status

The app is designed as a production-ready portfolio workflow with rapid onboarding, AI-driven content generation, and publishing workflow support.

If you want, I can also add a short product landing section and feature cards for the public homepage next. 