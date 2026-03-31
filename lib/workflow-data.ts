export type PlatformId = "linkedin" | "behance" | "dribbble";

export interface PlatformRecommendation {
  platform: PlatformId;
  label: string;
  score: number;
  reason: string;
  angle: string;
  format: string;
  cta: string;
  state: "primary" | "secondary" | "export";
}

export interface ChannelConnection {
  id: PlatformId;
  name: string;
  status: "Connected" | "Needs reconnect" | "Not connected" | "Export mode";
  description: string;
  permissions: string[];
  lastSync: string;
  fallback: string;
  checklist: string[];
}

export interface ProjectBlueprint {
  objective: string;
  tone: string;
  template: string;
  completion: number;
  readiness: number;
  heroSummary: string;
  challenge: string;
  solution: string;
  deliverables: string[];
  results: string[];
  testimonial: {
    quote: string;
    attribution: string;
  };
  gallery: string[];
  aiSuggestions: string[];
  platformRecommendations: PlatformRecommendation[];
  assetRecommendations: {
    hero: string;
    carousel: string[];
    avoid: string[];
  };
  publishChecklist: string[];
}

export const publishObjectives = [
  "Get clients",
  "Build authority",
  "Show design process",
  "Showcase outcome"
] as const;

export const voiceModes = [
  "Professional",
  "Insightful",
  "Creative",
  "Founder-like"
] as const;

export const channelConnections: ChannelConnection[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    status: "Not connected",
    description: "Primary authority channel for ROI-led project stories and discovery CTAs.",
    permissions: ["Sign In with LinkedIn", "Share on LinkedIn"],
    lastSync: "Connect to enable direct publishing",
    fallback: "Connect first, then publish directly from Publish Studio.",
    checklist: [
      "Keep the redirect URI aligned with the backend callback route.",
      "Connect the LinkedIn account you want to publish from.",
      "Reconnect when the access token nears expiry.",
      "Use for business-impact angles and founder-facing copy."
    ]
  },
  {
    id: "behance",
    name: "Behance",
    status: "Export mode",
    description: "Process-rich case study destination with a guided manual export path for V1.",
    permissions: ["Structured export template", "Manual media checklist"],
    lastSync: "Export template refreshed today",
    fallback: "Generate long-form copy, cover text, and asset order for manual paste.",
    checklist: [
      "Use the generated case-study sections and cover headline.",
      "Upload the strongest hero frame first.",
      "Paste proof points in the same order as the generated outline."
    ]
  },
  {
    id: "dribbble",
    name: "Dribbble",
    status: "Not connected",
    description: "Visual-first teaser channel for polished hero shots and short captions.",
    permissions: ["Public profile", "Shot upload"],
    lastSync: "Connect to enable guided upload setup",
    fallback: "Connect first, or copy shot caption and tags manually.",
    checklist: [
      "Connect the Dribbble account you want to publish from.",
      "Reconnect OAuth before attempting direct publishing.",
      "Lead with one hero screen instead of a full narrative.",
      "Route traffic back to the hosted portfolio or Behance story."
    ]
  }
];

export const notificationFeed = [
  {
    title: "Publishing fallback ready",
    body: "Behance remains export-only, so the case-study template is packaged with assets and copy."
  },
  {
    title: "Two channels recommended",
    body: "Commerce Ops Dashboard should launch on LinkedIn first, with Behance as a follow-up deep dive."
  },
  {
    title: "Review reply pending approval",
    body: "A negative review draft is ready, but still needs a human sign-off before it is saved."
  }
] as const;

export const responseTonePresets = [
  "Professional and concise",
  "Premium and calm",
  "Warm and appreciative",
  "Apologetic without overcommitting"
] as const;

export const projectBlueprints: Record<string, ProjectBlueprint> = {
  "neobank-rebrand": {
    objective: "Build authority",
    tone: "Professional",
    template: "Outcome-led case study",
    completion: 92,
    readiness: 95,
    heroSummary:
      "A fintech rebrand designed to sharpen trust, increase conversion confidence, and give the team a clearer launch story.",
    challenge:
      "NeoBank looked visually modern, but the brand system did not support trust-heavy signup decisions or investor-facing narrative clarity.",
    solution:
      "We rebuilt the identity around confidence cues, modular campaign components, and a tighter product-launch story that could work across onboarding, social, and fundraising surfaces.",
    deliverables: [
      "Brand strategy",
      "Visual identity",
      "Launch art direction",
      "Product onboarding screens",
      "Campaign asset system"
    ],
    results: [
      "40% signup lift after launch",
      "3x social engagement during rollout",
      "Sharper investor narrative for fundraising conversations"
    ],
    testimonial: {
      quote:
        "The new brand gave us language we could finally sell with. Launch engagement spiked and investors noticed immediately.",
      attribution: "Sarah Johnson, NeoBank"
    },
    gallery: [
      "Hero lockup with product frame",
      "Before / after onboarding sequence",
      "Campaign launch grid",
      "Trust and typography system close-ups"
    ],
    aiSuggestions: [
      "Lead with measurable impact before visual craft.",
      "Keep the portfolio hero summary under 45 words for faster scanning.",
      "Use the testimonial as the bridge between solution and results."
    ],
    platformRecommendations: [
      {
        platform: "linkedin",
        label: "LinkedIn",
        score: 94,
        reason: "Strong business outcome and a founder-relevant story arc.",
        angle: "Strategy plus measurable growth impact",
        format: "Long-form post with carousel",
        cta: "Invite discovery calls or portfolio views.",
        state: "primary"
      },
      {
        platform: "behance",
        label: "Behance",
        score: 89,
        reason: "The identity system has enough visual depth for a process-rich case study.",
        angle: "Brand system breakdown",
        format: "Multi-section project display",
        cta: "Drive to the full process narrative.",
        state: "secondary"
      },
      {
        platform: "dribbble",
        label: "Dribbble",
        score: 73,
        reason: "High-quality hero visuals work, but narrative depth matters more than teaser speed here.",
        angle: "Polished launch frames",
        format: "Shot teaser",
        cta: "Link back to the full case study.",
        state: "secondary"
      }
    ],
    assetRecommendations: {
      hero: "Use the warm hero lockup with the signup frame and headline overlay.",
      carousel: [
        "Start with the launch hero, then the before / after onboarding comparison.",
        "Follow with the modular identity system and campaign rollout grid.",
        "Close with one quantified outcome slide."
      ],
      avoid: [
        "Do not lead with pure logo explorations.",
        "Avoid duplicating color-swatch slides across channels."
      ]
    },
    publishChecklist: [
      "Hosted portfolio page approved",
      "LinkedIn headline and CTA edited",
      "Hero image selected for each channel",
      "Testimonial signed off for public use"
    ]
  },
  "commerce-ops-dashboard": {
    objective: "Get clients",
    tone: "Insightful",
    template: "Operational clarity story",
    completion: 78,
    readiness: 86,
    heroSummary:
      "A dashboard redesign that replaced fragmented retail workflows with one decision surface for inventory, fulfillment, and support.",
    challenge:
      "MarketFlow teams were working across disconnected tools, which made operational exceptions hard to see and even harder to resolve quickly.",
    solution:
      "We mapped the operational bottlenecks, redesigned the workflow around exceptions instead of raw reporting, and built a clearer action hierarchy for cross-functional teams.",
    deliverables: [
      "Workflow audit",
      "Dashboard IA",
      "Responsive UI system",
      "Exception-state patterns",
      "Pilot rollout support"
    ],
    results: [
      "27% faster workflows",
      "11 fewer support tickets per week",
      "Pilot expansion approved"
    ],
    testimonial: {
      quote:
        "The dashboard finally made our inventory conversations actionable instead of reactive.",
      attribution: "Operations Lead, MarketFlow"
    },
    gallery: [
      "Exception-first hero view",
      "Inventory and support comparison states",
      "Decision-card anatomy",
      "Pilot rollout usage notes"
    ],
    aiSuggestions: [
      "Make the challenge more specific by naming the five replaced workflows.",
      "Pair every screen with one business implication, not just a UI note.",
      "Use the pilot expansion approval as the closing proof point."
    ],
    platformRecommendations: [
      {
        platform: "linkedin",
        label: "LinkedIn",
        score: 92,
        reason: "This project sells systems thinking and measurable operational leverage.",
        angle: "Operational bottlenecks turned into business clarity",
        format: "Insight-led post with annotated images",
        cta: "Invite ops and product leaders to compare notes.",
        state: "primary"
      },
      {
        platform: "behance",
        label: "Behance",
        score: 88,
        reason: "The process is strong enough for a richer UX narrative once the visuals are sequenced.",
        angle: "Workflow mapping and dashboard anatomy",
        format: "Detailed product case study",
        cta: "Drive readers into the full redesign story.",
        state: "secondary"
      },
      {
        platform: "dribbble",
        label: "Dribbble",
        score: 61,
        reason: "The work is strong, but the business story matters more than a teaser shot.",
        angle: "One polished dashboard frame",
        format: "Single-shot teaser",
        cta: "Link back to the long-form case study.",
        state: "secondary"
      }
    ],
    assetRecommendations: {
      hero: "Lead with the exception-state dashboard frame that shows urgency and clarity at once.",
      carousel: [
        "Show the fragmented old workflow first.",
        "Move into the new dashboard with annotations on decision speed.",
        "Close with support-ticket and pilot expansion proof."
      ],
      avoid: [
        "Avoid generic chart close-ups without context.",
        "Skip frames that require product-domain explanation to make sense."
      ]
    },
    publishChecklist: [
      "Challenge block mentions the fragmented workflow clearly",
      "LinkedIn draft uses one quantified result in the opening hook",
      "Behance export outline is approved",
      "Dribbble stays optional until the hero visuals are polished"
    ]
  },
  "pulse-mobile-kit": {
    objective: "Show design process",
    tone: "Creative",
    template: "Design-system breakdown",
    completion: 84,
    readiness: 80,
    heroSummary:
      "A reusable mobile UI kit created to speed delivery, improve accessibility, and reduce inconsistency across product squads.",
    challenge:
      "Pulse teams were moving quickly, but they were recreating patterns and missing accessibility consistency across mobile work.",
    solution:
      "We turned the most common flows into reusable components, documented accessibility logic directly in the kit, and created rules that protected speed without introducing UI drift.",
    deliverables: [
      "Mobile design tokens",
      "Reusable component kit",
      "Accessibility annotations",
      "Prototype-ready templates"
    ],
    results: [
      "54 reusable components",
      "AA accessibility baseline",
      "2-day faster prototyping"
    ],
    testimonial: {
      quote:
        "The kit made the next prototype cycle feel dramatically calmer. We stopped rebuilding the same screens over and over.",
      attribution: "Product Design Manager, Pulse Health"
    },
    gallery: [
      "Component grid hero",
      "Accessibility annotation overlays",
      "Screen assemblies",
      "Token and spacing rules"
    ],
    aiSuggestions: [
      "Let the visuals carry the story on Dribbble.",
      "Use one paragraph to explain why accessibility was designed into the system from day one.",
      "Show a before / after assembly example in the portfolio preview."
    ],
    platformRecommendations: [
      {
        platform: "dribbble",
        label: "Dribbble",
        score: 93,
        reason: "The visual polish and modular craft land immediately in a teaser format.",
        angle: "Component craft and clarity",
        format: "Shot teaser with tags",
        cta: "Route viewers to the case-study breakdown.",
        state: "primary"
      },
      {
        platform: "behance",
        label: "Behance",
        score: 90,
        reason: "The system logic and accessibility rules make a strong process narrative.",
        angle: "Design-system logic and accessibility",
        format: "Full case study",
        cta: "Invite deeper exploration of rules and outcomes.",
        state: "secondary"
      },
      {
        platform: "linkedin",
        label: "LinkedIn",
        score: 76,
        reason: "Useful for authority building, but the project is strongest when it stays visual.",
        angle: "Accessibility-first design systems",
        format: "Short thought-leadership post",
        cta: "Invite design-system conversations.",
        state: "secondary"
      }
    ],
    assetRecommendations: {
      hero: "Choose the cleanest component grid with one assembled mobile screen for context.",
      carousel: [
        "Start with the polished UI kit overview.",
        "Follow with accessibility notes and token logic.",
        "End with a rapid prototype example."
      ],
      avoid: [
        "Avoid overloaded annotation screens as the first impression.",
        "Do not mix too many device frames in one teaser."
      ]
    },
    publishChecklist: [
      "Hero frame selected for Dribbble",
      "Accessibility paragraph edited for clarity",
      "Behance section order approved",
      "LinkedIn authority angle kept concise"
    ]
  },
  "cloudlift-dev-portal": {
    objective: "Build authority",
    tone: "Founder-like",
    template: "Developer-experience transformation",
    completion: 88,
    readiness: 90,
    heroSummary:
      "A developer portal redesign that reduced onboarding friction and turned documentation into a better activation surface.",
    challenge:
      "CloudLift had technically strong docs, but the portal experience left developers unsure of the next step and kept support volume high.",
    solution:
      "We overhauled the information architecture, simplified the onboarding path, and reframed the portal around developer progress instead of content volume.",
    deliverables: [
      "Documentation IA",
      "Portal UX flows",
      "Activation surfaces",
      "Onboarding decision paths"
    ],
    results: [
      "22% activation lift",
      "38% fewer onboarding questions",
      "New partner demo booked"
    ],
    testimonial: {
      quote:
        "The portal finally started behaving like a growth surface instead of just a documentation shelf.",
      attribution: "Platform Lead, CloudLift"
    },
    gallery: [
      "Portal hero and quick-start path",
      "Docs IA comparison",
      "Activation checkpoint screens",
      "Partner-ready onboarding flow"
    ],
    aiSuggestions: [
      "Lead with activation lift before talking about docs IA.",
      "Keep the case study anchored in business enablement, not just UX cleanup.",
      "Use one screen annotation to show how onboarding questions dropped."
    ],
    platformRecommendations: [
      {
        platform: "linkedin",
        label: "LinkedIn",
        score: 91,
        reason: "The project reads as strategic product thinking with strong business relevance.",
        angle: "Developer experience as growth leverage",
        format: "Authority-building post",
        cta: "Invite platform and DX teams into the conversation.",
        state: "primary"
      },
      {
        platform: "behance",
        label: "Behance",
        score: 79,
        reason: "The IA and UX process can support a detailed follow-up story.",
        angle: "Portal IA and onboarding flow",
        format: "Structured case study",
        cta: "Drive into the complete portal story.",
        state: "secondary"
      },
      {
        platform: "dribbble",
        label: "Dribbble",
        score: 58,
        reason: "The value is more strategic than visual-first, so teaser utility is limited.",
        angle: "One clean onboarding screen",
        format: "Optional teaser",
        cta: "Link back to the richer write-up.",
        state: "secondary"
      }
    ],
    assetRecommendations: {
      hero: "Use the portal quick-start view with the activation path visible above the fold.",
      carousel: [
        "Lead with the simplified onboarding path.",
        "Show the IA before / after comparison next.",
        "Finish with activation and support metrics."
      ],
      avoid: [
        "Avoid dense sitemap graphics as the opening frame.",
        "Do not over-explain documentation taxonomy in social copy."
      ]
    },
    publishChecklist: [
      "Activation metric appears in the opening hook",
      "Hosted case study link copied for CTA usage",
      "Portal hero frame exported",
      "Behance outline kept secondary to LinkedIn launch"
    ]
  }
};

function normalizeList(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (item && typeof item === "object") {
        const candidate =
          "originalName" in item
            ? (item as { originalName?: string }).originalName
            : "path" in item
              ? (item as { path?: string }).path
              : undefined;

        return candidate || JSON.stringify(item);
      }

      return String(item);
    });
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildRecommendationsFromAnalysis(analysis?: any): PlatformRecommendation[] {
  const scores = analysis?.platform_scores || analysis;

  if (!scores || typeof scores !== "object") {
    return [
      {
        platform: "linkedin",
        label: "LinkedIn",
        score: 82,
        reason: "Good default fit for authority building and business impact.",
        angle: "Challenge plus measurable outcome",
        format: "Long-form post",
        cta: "Invite portfolio views or calls",
        state: "primary"
      },
      {
        platform: "behance",
        label: "Behance",
        score: 76,
        reason: "Works when the project has enough process and visual depth.",
        angle: "Case-study narrative",
        format: "Project display",
        cta: "Guide readers into the full story",
        state: "secondary"
      },
      {
        platform: "dribbble",
        label: "Dribbble",
        score: 68,
        reason: "Best when there is one strong visual worth teasing.",
        angle: "Hero visual teaser",
        format: "Shot teaser",
        cta: "Link back to the portfolio",
        state: "secondary"
      }
    ];
  }

  return (["linkedin", "behance", "dribbble"] as PlatformId[]).map((platform, index) => {
    const item = scores[platform] || {};

    return {
      platform,
      label:
        platform === "linkedin"
          ? "LinkedIn"
          : platform === "behance"
            ? "Behance"
            : "Dribbble",
      score: Number(item.score || 70),
      reason: item.reason || "Recommended from the current project proof set.",
      angle: item.angle || "Outcome-led story",
      format: item.format || "Post",
      cta: item.cta || "Invite the next conversation.",
      state: index === 0 ? "primary" : "secondary"
    };
  });
}

export function getProjectBlueprint(
  projectId: string,
  projectData?: {
    title?: string;
    client_name?: string;
    category?: string;
    challenge_text?: string;
    solution_text?: string;
    results_text?: string;
    deliverables?: unknown;
    testimonials?: unknown;
    assets_url?: unknown;
    content_json?: any;
    status?: string;
  },
  analysis?: any
): ProjectBlueprint {
  if (projectBlueprints[projectId]) {
    return projectBlueprints[projectId];
  }

  const content = projectData?.content_json || {};
  const results = normalizeList(content.proof_points).length
    ? normalizeList(content.proof_points)
    : normalizeList(projectData?.results_text || "Project outcomes are still being refined.");
  const deliverables = normalizeList(content.deliverables).length
    ? normalizeList(content.deliverables)
    : normalizeList(projectData?.deliverables || ["Case study", "Channel content"]);
  const gallery = normalizeList(projectData?.assets_url).length
    ? normalizeList(projectData?.assets_url).map((item) => `Uploaded asset: ${item}`)
    : ["Hero visual", "Supporting screen", "Outcome proof"];

  return {
    objective: "Get clients",
    tone: "Professional",
    template: "Generated case study",
    completion: projectData?.status === "published" ? 100 : 72,
    readiness: analysis ? 86 : 64,
    heroSummary:
      content.hero_summary ||
      `Case study: ${projectData?.title || "Untitled project"} for ${projectData?.client_name || "a client"}`,
    challenge:
      content.challenge ||
      projectData?.challenge_text ||
      "Clarify the original problem, what was at stake, and the goal the client needed to reach.",
    solution:
      content.solution ||
      projectData?.solution_text ||
      "Explain the strategy, process, execution path, and the differentiator behind the work.",
    deliverables,
    results,
    testimonial: {
      quote:
        normalizeList(projectData?.testimonials)[0] ||
        content.testimonial_prompt ||
        "Add a client quote or qualitative outcome to strengthen this proof asset.",
      attribution: projectData?.client_name || "Client"
    },
    gallery,
    aiSuggestions: [
      "Tighten the hero summary before publishing.",
      "Add one measurable proof point near the top of the story.",
      "Use the portfolio asset as the source of truth before generating channel copy."
    ],
    platformRecommendations: buildRecommendationsFromAnalysis(analysis),
    assetRecommendations: {
      hero: "Lead with the cleanest summary visual or strongest project hero frame.",
      carousel: [
        "Start with the hero frame and project title.",
        "Move into one process or before / after proof block.",
        "Close with the clearest outcome or testimonial."
      ],
      avoid: [
        "Avoid opening with contextless detail crops.",
        "Do not repeat the same proof point across every slide."
      ]
    },
    publishChecklist: [
      "Hero summary edited",
      "One proof point highlighted",
      "Primary channel selected",
      "CTA reviewed"
    ]
  };
}
