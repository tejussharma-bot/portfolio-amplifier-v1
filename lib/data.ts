export type ProjectStatus = "Draft" | "Analyzing" | "Scheduled" | "Published";
export type ReviewSentiment = "positive" | "neutral" | "negative";

export interface Project {
  id: string;
  title: string;
  client: string;
  category: string;
  role: string;
  completedOn: string;
  summary: string;
  angle: string;
  status: ProjectStatus;
  channels: string[];
  outcomes: string[];
  assets: number;
  reach: string;
  lastGenerated: string;
}

export interface Review {
  id: string;
  client: string;
  projectId: string;
  source: string;
  submittedAt: string;
  sentiment: ReviewSentiment;
  rating: number;
  content: string;
  response: string | null;
}

export interface ChannelDraft {
  id: "linkedin" | "behance" | "dribbble";
  label: string;
  tone: string;
  fit: string;
  connected: boolean;
  headline: string;
  body: string;
  cta: string;
  tags: string[];
  scheduledAt: string | null;
}

export const productLoop = [
  {
    title: "Create",
    description: "Ingest messy files, links, PDFs, and screenshots into a usable project brief.",
    accent: "from-coral-400 to-coral-600"
  },
  {
    title: "Analyze",
    description: "Detect the strongest angle, map platform fit, and turn proof into narrative.",
    accent: "from-tide-400 to-tide-600"
  },
  {
    title: "Distribute",
    description: "Generate polished posts for LinkedIn, Behance, and Dribbble from one source asset.",
    accent: "from-sand-400 to-sand-600"
  },
  {
    title: "Monitor",
    description: "Centralize reviews, classify sentiment, and draft responses before reputation slips.",
    accent: "from-ink-400 to-ink-700"
  }
] as const;

export const heroMetrics = [
  { label: "Time-to-Portfolio", value: "20 min", detail: "down from 4 hours" },
  { label: "AI Acceptance", value: "70%+", detail: "used with light edits" },
  { label: "Distribution Coverage", value: "3 channels", detail: "from one project asset" }
] as const;

export const personas = [
  {
    name: "Alex",
    role: "Freelance Designer",
    pain: "Hates writing case studies and posts only when a client reminds them.",
    promise: "Structured storytelling, visual-first project pages, and one-click social adaptation."
  },
  {
    name: "Sarah",
    role: "Agency Owner",
    pain: "Needs to show ROI fast while protecting team reputation across clients.",
    promise: "Impact-oriented narratives, shareable proof, and a review inbox with AI replies."
  },
  {
    name: "Devon",
    role: "Developer",
    pain: "Has strong work but no visual portfolio and a weak authority voice online.",
    promise: "Authority angles that translate repo work into credibility-driven LinkedIn content."
  }
] as const;

export const enterpriseGuardrails = [
  "Every user-facing query is designed around data isolation by user ID.",
  "Async AI jobs are modeled as queue work, not blocking HTTP requests.",
  "Delete-my-data flows are accounted for across storage and database records.",
  "Structured logs, retry policies, and fallback publish paths protect the critical loop."
] as const;

export const dashboardMetrics = [
  {
    label: "Activation rate",
    value: "46%",
    detail: "+8 pts vs beta week one"
  },
  {
    label: "Time to first draft",
    value: "7m 42s",
    detail: "beating the < 10m KPI"
  },
  {
    label: "Distribution rate",
    value: "58%",
    detail: "analysis to publish/export"
  },
  {
    label: "API cost / user",
    value: "$0.34",
    detail: "under monthly target"
  }
] as const;

export const projects: Project[] = [
  {
    id: "neobank-rebrand",
    title: "NeoBank Rebrand",
    client: "NeoBank",
    category: "Brand system / fintech",
    role: "Lead Designer",
    completedOn: "Mar 14, 2026",
    summary:
      "Full identity refresh with launch visuals, product story, and onboarding funnel assets.",
    angle: "Business ROI",
    status: "Published",
    channels: ["LinkedIn", "Behance"],
    outcomes: ["40% signup lift", "3x launch engagement", "2 sales-qualified leads"],
    assets: 18,
    reach: "18.4K",
    lastGenerated: "2 hours ago"
  },
  {
    id: "commerce-ops-dashboard",
    title: "Commerce Ops Dashboard",
    client: "MarketFlow",
    category: "Product design / SaaS",
    role: "Product Designer",
    completedOn: "Mar 13, 2026",
    summary:
      "Analytics dashboard redesign that turned fragmented inventory data into one operating console.",
    angle: "Operational clarity",
    status: "Analyzing",
    channels: [],
    outcomes: ["27% faster workflows", "11 fewer support tickets / week", "Pilot expansion approved"],
    assets: 11,
    reach: "Pending",
    lastGenerated: "In queue"
  },
  {
    id: "pulse-mobile-kit",
    title: "Pulse Mobile UI Kit",
    client: "Pulse Health",
    category: "Design system / mobile",
    role: "Systems Designer",
    completedOn: "Mar 11, 2026",
    summary:
      "Reusable mobile component kit with health-focused accessibility and rapid prototyping support.",
    angle: "Design craft",
    status: "Draft",
    channels: ["Dribbble"],
    outcomes: ["54 reusable components", "AA accessibility baseline", "2 day faster prototyping"],
    assets: 26,
    reach: "4.1K",
    lastGenerated: "Yesterday"
  },
  {
    id: "cloudlift-dev-portal",
    title: "CloudLift Dev Portal",
    client: "CloudLift",
    category: "Developer experience / platform",
    role: "Product Strategist",
    completedOn: "Mar 8, 2026",
    summary:
      "Developer portal with docs IA overhaul and onboarding flows targeted at reducing drop-off.",
    angle: "Authority building",
    status: "Scheduled",
    channels: ["LinkedIn"],
    outcomes: ["22% activation lift", "38% fewer onboarding questions", "New partner demo booked"],
    assets: 9,
    reach: "7.6K",
    lastGenerated: "Scheduled for tomorrow"
  }
];

export const activityFeed = [
  "Inngest queued a fresh analysis job for Commerce Ops Dashboard.",
  "LinkedIn copy for NeoBank Rebrand was published 2 hours ago.",
  "A negative review from E-commerce Co is waiting for approval.",
  "Behance draft for Pulse Mobile UI Kit saved for later."
] as const;

export const launchChecklist = [
  { label: "Critical path tests", done: true },
  { label: "OAuth fallback copy flow", done: true },
  { label: "Sentry + uptime monitors", done: false },
  { label: "Legal pages published", done: false }
] as const;

export const reviews: Review[] = [
  {
    id: "review-1",
    client: "Sarah Johnson",
    projectId: "neobank-rebrand",
    source: "Email forward",
    submittedAt: "Mar 15, 2026",
    sentiment: "positive",
    rating: 5,
    content:
      "The new brand gave us language we could finally sell with. Launch engagement spiked and investors noticed immediately.",
    response:
      "Thank you, Sarah. Partnering with NeoBank on a brand that could carry both trust and momentum was a highlight for our team. We are thrilled the rollout translated into stronger engagement and investor confidence."
  },
  {
    id: "review-2",
    client: "Tech Startup Inc",
    projectId: "pulse-mobile-kit",
    source: "Google review",
    submittedAt: "Mar 14, 2026",
    sentiment: "neutral",
    rating: 3,
    content:
      "Strong final design work. The process could have used tighter milestone communication, but the kit itself is solid and useful.",
    response: null
  },
  {
    id: "review-3",
    client: "E-commerce Co",
    projectId: "commerce-ops-dashboard",
    source: "Manual paste",
    submittedAt: "Mar 13, 2026",
    sentiment: "negative",
    rating: 2,
    content:
      "Quality was acceptable, but timing slipped and we missed a launch window. We needed more visibility into progress earlier.",
    response: null
  },
  {
    id: "review-4",
    client: "CloudLift",
    projectId: "cloudlift-dev-portal",
    source: "Capterra",
    submittedAt: "Mar 12, 2026",
    sentiment: "positive",
    rating: 5,
    content:
      "They understood our developer audience quickly and translated complexity into a crisp self-serve portal.",
    response:
      "Thank you for the trust. Translating technical complexity into a smoother developer onboarding experience was exactly the challenge we hoped to solve with you."
  }
];

export const projectDistributions: Record<string, ChannelDraft[]> = {
  "neobank-rebrand": [
    {
      id: "linkedin",
      label: "LinkedIn",
      tone: "Professional, authority-led, outcome-first",
      fit: "Best for ROI proof and founder-facing storytelling.",
      connected: true,
      headline: "How a rebrand helped NeoBank lift signups by 40%",
      body:
        "Most rebrands stop at visuals. This one had to move product trust, investor confidence, and new-user conversion at the same time.\n\nWe rebuilt the story from positioning through launch assets, then connected the identity system to onboarding and campaign creative.\n\nResult: signups climbed 40%, social engagement tripled, and the team had a sharper pitch for the next funding conversation.",
      cta: "Happy to share the case study framework we used for turning brand work into measurable growth proof.",
      tags: ["#BrandStrategy", "#Fintech", "#DesignOps", "#PortfolioAmplifier"],
      scheduledAt: null
    },
    {
      id: "behance",
      label: "Behance",
      tone: "Narrative, visual craft, process-rich",
      fit: "Best for deeper case studies with assets and before/after context.",
      connected: false,
      headline: "NeoBank Brand System",
      body:
        "A full-spectrum identity system for a fintech startup competing in a trust-sensitive market.\n\nScope\n- Brand strategy\n- Visual identity\n- Campaign art direction\n- Product launch screens\n\nOutcome\nA modular system that improved recognition, conversion confidence, and launch momentum.",
      cta: "Explore the complete challenge, system, and outcome story.",
      tags: ["Brand Identity", "Fintech", "Art Direction", "Case Study"],
      scheduledAt: "Tomorrow · 09:30"
    },
    {
      id: "dribbble",
      label: "Dribbble",
      tone: "Compact, craft-led, teaser format",
      fit: "Best for high-signal snapshots that push viewers into the full case study.",
      connected: false,
      headline: "NeoBank launch frames",
      body:
        "A few frames from a brand system built to make a fintech startup feel sharper, warmer, and easier to trust.",
      cta: "Full process write-up available in the Behance case study.",
      tags: ["branding", "fintech", "identity", "launch"],
      scheduledAt: null
    }
  ],
  "commerce-ops-dashboard": [
    {
      id: "linkedin",
      label: "LinkedIn",
      tone: "Systems-thinking, operational, insight-led",
      fit: "Strongest match because the work is cross-functional and outcome-heavy.",
      connected: true,
      headline: "Designing one dashboard to replace five fragmented retail workflows",
      body:
        "MarketFlow had inventory, fulfillment, and support teams living in different spreadsheets and tools.\n\nWe mapped the operational bottlenecks, redesigned the decision flow, and built a dashboard system around exception handling instead of raw reporting.\n\nThat reduced weekly support churn and made the pilot strong enough to earn expansion approval.",
      cta: "If you are turning internal tools into real business leverage, I would love to compare notes.",
      tags: ["#SaaSDesign", "#Operations", "#B2BProduct", "#UXStrategy"],
      scheduledAt: null
    },
    {
      id: "behance",
      label: "Behance",
      tone: "Process-heavy, UX craft",
      fit: "Useful as a detailed follow-up once visuals are polished.",
      connected: false,
      headline: "Commerce Ops Console",
      body:
        "A dashboard redesign focused on operational visibility, reduced support demand, and faster action loops for retail teams.",
      cta: "Dive into the workflow mapping and component logic.",
      tags: ["Dashboard", "B2B", "Data UX", "Operations"],
      scheduledAt: null
    },
    {
      id: "dribbble",
      label: "Dribbble",
      tone: "Visual teaser",
      fit: "Lower priority until the hero views are curated.",
      connected: false,
      headline: "MarketFlow dashboard cards",
      body:
        "A tighter dashboard language for teams making inventory calls under pressure.",
      cta: "Full breakdown coming soon.",
      tags: ["dashboard", "analytics", "saas", "ui"],
      scheduledAt: null
    }
  ],
  "pulse-mobile-kit": [
    {
      id: "linkedin",
      label: "LinkedIn",
      tone: "Accessibility-first authority",
      fit: "Good for design-system leadership and team process framing.",
      connected: true,
      headline: "Building a mobile UI kit around accessibility before aesthetics drifted",
      body:
        "Pulse needed speed, but speed without consistency was creating avoidable rework.\n\nWe created a mobile system with accessibility baked in at the component level so teams could prototype faster without introducing design debt.",
      cta: "Always happy to talk about design systems that serve both pace and quality.",
      tags: ["#DesignSystem", "#MobileDesign", "#Accessibility", "#HealthTech"],
      scheduledAt: null
    },
    {
      id: "behance",
      label: "Behance",
      tone: "Process and craft",
      fit: "Secondary fit because the visuals are strong enough for a full case study.",
      connected: false,
      headline: "Pulse Mobile UI Kit",
      body:
        "A reusable mobile kit created to speed prototyping, improve accessibility coverage, and reduce inconsistency across product squads.",
      cta: "See the system rules and accessibility decisions in detail.",
      tags: ["UI Kit", "Mobile", "Accessibility", "System Design"],
      scheduledAt: null
    },
    {
      id: "dribbble",
      label: "Dribbble",
      tone: "Visual-first",
      fit: "Best channel for this project because the craft carries instantly.",
      connected: false,
      headline: "Pulse mobile components",
      body:
        "A clean mobile component set built for speed, clarity, and accessibility.",
      cta: "More screens coming soon.",
      tags: ["ui kit", "mobile", "app design", "system"],
      scheduledAt: null
    }
  ],
  "cloudlift-dev-portal": [
    {
      id: "linkedin",
      label: "LinkedIn",
      tone: "Developer authority, strategic clarity",
      fit: "Primary channel because the value is part UX, part business enablement.",
      connected: true,
      headline: "Turning a developer portal into a growth surface",
      body:
        "CloudLift's portal was technically solid, but onboarding friction kept slowing adoption.\n\nWe reworked the information architecture and activation path so developers could find the right next step faster and support load would shrink at the same time.",
      cta: "Good DX is often a revenue conversation in disguise.",
      tags: ["#DeveloperExperience", "#ProductStrategy", "#DocsUX", "#Platform"],
      scheduledAt: "Thursday · 11:00"
    },
    {
      id: "behance",
      label: "Behance",
      tone: "Case-study depth",
      fit: "Useful, but less critical than LinkedIn for this audience.",
      connected: false,
      headline: "CloudLift Developer Portal",
      body:
        "A portal redesign focused on faster activation, fewer onboarding questions, and better developer self-serve flow.",
      cta: "Explore the IA and activation strategy.",
      tags: ["Developer Portal", "Docs UX", "Platform", "IA"],
      scheduledAt: null
    },
    {
      id: "dribbble",
      label: "Dribbble",
      tone: "Teaser visuals",
      fit: "Optional once hero screens are refined.",
      connected: false,
      headline: "CloudLift portal onboarding",
      body:
        "Portal screens designed to make developer onboarding feel far less intimidating.",
      cta: "Full breakdown coming soon.",
      tags: ["portal", "developer", "ux", "saas"],
      scheduledAt: null
    }
  ]
};

export const settingsIntegrations = [
  {
    name: "LinkedIn",
    status: "Connected",
    detail: "OAuth token refreshed 3 days ago",
    tone: "success" as const
  },
  {
    name: "Behance",
    status: "Export mode",
    detail: "Structured manual publish flow active",
    tone: "info" as const
  },
  {
    name: "Dribbble",
    status: "Copy mode",
    detail: "OAuth not configured yet",
    tone: "warning" as const
  },
  {
    name: "Google Reviews Inbox",
    status: "Manual ingest",
    detail: "Forwarding address active",
    tone: "info" as const
  }
];
