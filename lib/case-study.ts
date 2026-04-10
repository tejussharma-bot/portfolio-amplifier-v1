import { parseJsonValue, parseStringList } from "@/lib/utils";

export type AssetSourceType = "uploaded" | "url" | "fetched_reference";

export interface AssetSource {
  sourceType: AssetSourceType;
  url: string;
  label: string;
  originalName?: string;
  mimetype?: string | null;
  size?: number | null;
  storage?: string;
}

export interface ConversationMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  fieldKey?: string;
}

export interface CaseStudyDocument {
  title: string;
  clientName: string;
  category: string;
  industry: string;
  timeline: string;
  tags: string[];
  sourceUrl: string;
  heroSummary: string;
  challenge: string;
  solution: string;
  results: string;
  deliverables: string[];
  testimonial: string;
  proofPoints: string[];
}

export interface CaseStudyExportRecord {
  format: "png" | "jpg" | "pdf";
  createdAt: string;
  fileName: string;
}

export interface CaseStudyWorkspace {
  document: CaseStudyDocument;
  themeId: string;
  messages: ConversationMessage[];
  assets: AssetSource[];
  exportHistory: CaseStudyExportRecord[];
  publishReadiness: string;
}

export interface CaseStudyTheme {
  id: string;
  name: string;
  label: string;
  categoryLabel: string;
  heroClassName: string;
  panelClassName: string;
  accentClassName: string;
  chipClassName: string;
}

export const caseStudyThemes: CaseStudyTheme[] = [
  {
    id: "luxury",
    name: "Luxury",
    label: "For premium, brand-led narratives",
    categoryLabel: "Luxury Arts",
    heroClassName: "bg-[radial-gradient(circle_at_35%_20%,rgba(131,245,255,0.45),transparent_28%),linear-gradient(140deg,#0b1f2c_0%,#123748_38%,#1d7c93_100%)] text-white",
    panelClassName: "bg-[#eef7fb]",
    accentClassName: "bg-white/12 text-white",
    chipClassName: "bg-white/14 text-white/90"
  },
  {
    id: "bfsi",
    name: "BFSI",
    label: "For strategic, trust-building launches",
    categoryLabel: "Financial Systems",
    heroClassName: "bg-[radial-gradient(circle_at_25%_20%,rgba(98,129,255,0.4),transparent_25%),linear-gradient(135deg,#111827_0%,#18253f_42%,#3950a4_100%)] text-white",
    panelClassName: "bg-[#eef2ff]",
    accentClassName: "bg-white/10 text-white",
    chipClassName: "bg-white/12 text-white/88"
  },
  {
    id: "hospitality",
    name: "Hospitality",
    label: "For place-making and guest experiences",
    categoryLabel: "Hospitality Design",
    heroClassName: "bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.32),transparent_24%),linear-gradient(140deg,#5d3522_0%,#8f5c35_48%,#d1a977_100%)] text-white",
    panelClassName: "bg-[#fff7ef]",
    accentClassName: "bg-white/14 text-white",
    chipClassName: "bg-white/16 text-white/92"
  },
  {
    id: "creative",
    name: "Creative",
    label: "For bold cultural or editorial work",
    categoryLabel: "Creative Systems",
    heroClassName: "bg-[radial-gradient(circle_at_65%_25%,rgba(255,214,130,0.36),transparent_22%),linear-gradient(135deg,#2b0d4f_0%,#5c1d88_36%,#ef5a5a_100%)] text-white",
    panelClassName: "bg-[#fff1f3]",
    accentClassName: "bg-white/12 text-white",
    chipClassName: "bg-white/12 text-white/90"
  },
  {
    id: "tech",
    name: "Tech",
    label: "For product and platform launches",
    categoryLabel: "Technology",
    heroClassName: "bg-[radial-gradient(circle_at_25%_20%,rgba(148,255,228,0.35),transparent_24%),linear-gradient(135deg,#08121d_0%,#0c2634_42%,#0c7f8f_100%)] text-white",
    panelClassName: "bg-[#eefbfd]",
    accentClassName: "bg-white/12 text-white",
    chipClassName: "bg-white/10 text-white/88"
  },
  {
    id: "retail",
    name: "Retail",
    label: "For commerce, growth, and launch stories",
    categoryLabel: "Retail Experience",
    heroClassName: "bg-[radial-gradient(circle_at_68%_18%,rgba(255,224,168,0.36),transparent_25%),linear-gradient(135deg,#18152d_0%,#2f2856_42%,#e05f44_100%)] text-white",
    panelClassName: "bg-[#fff4f1]",
    accentClassName: "bg-white/12 text-white",
    chipClassName: "bg-white/12 text-white/90"
  }
];

function createId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

export function buildSuggestedTags(document: Partial<CaseStudyDocument>) {
  return Array.from(
    new Set(
      [
        document.category,
        document.industry,
        document.clientName,
        document.timeline
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  ).slice(0, 4);
}

function inferAssetKind(item: any) {
  const mimetype = String(item?.mimetype || "").toLowerCase();
  const url = String(item?.url || item?.downloadUrl || item?.path || "");

  if (mimetype.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(url)) {
    return "image";
  }

  return "file";
}

export function normalizeAssetSources(value: unknown): AssetSource[] {
  const parsed = parseJsonValue<any[]>(value, Array.isArray(value) ? value : []);
  const source = Array.isArray(parsed) && parsed.length ? parsed : Array.isArray(value) ? value : [];
  const normalizedAssets: Array<AssetSource | null> = source
    .map((item) => {
      if (typeof item === "string") {
        return {
          sourceType: "url" as const,
          url: item,
          label: item.replace(/^https?:\/\//, "")
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const url = String(item.url || item.downloadUrl || item.path || "");

      if (!url) {
        return null;
      }

      return {
        sourceType: (item.sourceType || item.storage || "uploaded") as AssetSourceType,
        url,
        label: String(item.originalName || item.label || item.url || item.path || "Asset"),
        originalName: item.originalName || undefined,
        mimetype: item.mimetype || null,
        size: typeof item.size === "number" ? item.size : null,
        storage: item.storage || undefined
      };
    });

  return normalizedAssets.filter((item): item is AssetSource => item !== null);
}

export function getPreviewImage(assets: AssetSource[]) {
  return assets.find((asset) => inferAssetKind(asset) === "image") || null;
}

function buildFallbackConversation(document: CaseStudyDocument, assets: AssetSource[]) {
  const messages: ConversationMessage[] = [
    {
      id: createId("message", 0),
      role: "assistant",
      content: "We turned your intake into a polished case study draft. You can keep refining the story, switch themes, and export when it feels ready."
    }
  ];

  const fields: Array<[keyof CaseStudyDocument, string]> = [
    ["title", document.title],
    ["clientName", document.clientName],
    ["category", document.category],
    ["timeline", document.timeline],
    ["challenge", document.challenge],
    ["solution", document.solution],
    ["results", document.results],
    ["testimonial", document.testimonial]
  ];

  fields.forEach(([fieldKey, value], index) => {
    if (!value) {
      return;
    }

    messages.push({
      id: createId("message", index + 1),
      role: "user",
      content: value,
      fieldKey
    });
  });

  if (assets.length) {
    messages.push({
      id: createId("message", messages.length),
      role: "assistant",
      content: `Attached ${assets.length} visual asset${assets.length === 1 ? "" : "s"} so the preview can stay grounded in the real project.`
    });
  }

  if (document.tags.length) {
    messages.push({
      id: createId("message", messages.length),
      role: "assistant",
      content: `Captured positioning tags: ${document.tags.join(", ")}.`
    });
  }

  return messages;
}

export function getCaseStudyTheme(themeId?: string) {
  return caseStudyThemes.find((theme) => theme.id === themeId) || caseStudyThemes[0];
}

export function buildCaseStudyWorkspace(project: any): CaseStudyWorkspace {
  const content = parseJsonValue<Record<string, any>>(project?.portfolioContent || project?.content_json, {});
  const assets = normalizeAssetSources(content.asset_sources || project?.assetsUrl || project?.assets_url);
  const proofPoints = parseStringList(content.proof_points || project?.resultsText || project?.results_text);
  const deliverables = parseStringList(content.deliverables || project?.deliverables);
  const testimonials = parseStringList(project?.testimonials);
  const messages = parseJsonValue<ConversationMessage[]>(content.conversation_messages, []);
  const exportHistory = parseJsonValue<CaseStudyExportRecord[]>(content.export_history, []);
  const tags = parseStringList(content.tags);

  const document: CaseStudyDocument = {
    title: String(project?.title || content.title || "Untitled case study"),
    clientName: String(project?.client || project?.client_name || ""),
    category: String(project?.category || content.category || "Case Study"),
    industry: String(project?.industry || content.industry || ""),
    timeline: String(project?.timeline || content.timeline || ""),
    tags: tags.length
      ? tags
      : buildSuggestedTags({
          clientName: String(project?.client || project?.client_name || ""),
          category: String(project?.category || content.category || "Case Study"),
          industry: String(project?.industry || content.industry || ""),
          timeline: String(project?.timeline || content.timeline || "")
        }),
    sourceUrl: String(project?.source_url || content.source_url || ""),
    heroSummary: String(
      content.hero_summary ||
        project?.summary ||
        `A case study for ${project?.title || "your latest project"}`
    ),
    challenge: String(
      content.challenge ||
        project?.challengeText ||
        project?.challenge_text ||
        "Clarify the original challenge, what was at stake, and what needed to change."
    ),
    solution: String(
      content.solution ||
        project?.solutionText ||
        project?.solution_text ||
        "Describe the strategy, the approach, and the decisions that shaped the final work."
    ),
    results: String(
      content.results ||
        project?.resultsText ||
        project?.results_text ||
        "Capture the outcomes, proof points, and measurable shifts that made this work matter."
    ),
    deliverables,
    testimonial: String(
      content.testimonial ||
        content.testimonial_prompt ||
        testimonials[0] ||
        "Add the strongest client quote or qualitative proof here."
    ),
    proofPoints: proofPoints.length
      ? proofPoints
      : [
          "Highlight one measurable shift near the top of the story.",
          "Anchor the gallery in real assets, not placeholder visuals.",
          "Use the case study as the source of truth before rephrasing for channels."
        ]
  };

  return {
    document,
    themeId: String(content.theme_id || "luxury"),
    messages: messages.length ? messages : buildFallbackConversation(document, assets),
    assets,
    exportHistory,
    publishReadiness: String(content.publish_readiness || project?.status || "draft")
  };
}

export function serializeCaseStudyContent(
  existingContent: Record<string, unknown> | null | undefined,
  workspace: CaseStudyWorkspace
) {
  return {
    ...(existingContent || {}),
    hero_summary: workspace.document.heroSummary,
    challenge: workspace.document.challenge,
    solution: workspace.document.solution,
    results: workspace.document.results,
    deliverables: workspace.document.deliverables,
    tags: workspace.document.tags,
    proof_points: workspace.document.proofPoints,
    testimonial: workspace.document.testimonial,
    testimonial_prompt: workspace.document.testimonial,
    theme_id: workspace.themeId,
    conversation_messages: workspace.messages,
    asset_sources: workspace.assets,
    export_history: workspace.exportHistory,
    publish_readiness: workspace.publishReadiness,
    preview_json: {
      title: workspace.document.title,
      client_name: workspace.document.clientName,
      category: workspace.document.category,
      industry: workspace.document.industry,
      timeline: workspace.document.timeline,
      tags: workspace.document.tags,
      source_url: workspace.document.sourceUrl,
      hero_summary: workspace.document.heroSummary,
      challenge: workspace.document.challenge,
      solution: workspace.document.solution,
      results: workspace.document.results,
      deliverables: workspace.document.deliverables,
      testimonial: workspace.document.testimonial,
      proof_points: workspace.document.proofPoints
    }
  };
}
