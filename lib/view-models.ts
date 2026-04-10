import {
  channelConnections,
  getProjectBlueprint,
  type ChannelConnection,
  type ProjectBlueprint
} from "@/lib/workflow-data";
import { parseJsonValue, parseStringList } from "@/lib/utils";

export function formatDisplayDate(value?: string | null) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function mapStatusLabel(status?: string | null) {
  switch (status) {
    case "draft":
      return "Draft";
    case "structuring":
      return "Structuring";
    case "ready":
      return "Ready to amplify";
    case "published":
      return "Published";
    case "scheduled":
      return "Scheduled";
    case "analyzing":
      return "Analyzing";
    default:
      return status ? status[0].toUpperCase() + status.slice(1) : "Draft";
  }
}

export function normalizeProjectRow(row: any) {
  const assets = parseJsonValue<any[]>(row.assets_url, []);
  const deliverables = parseStringList(row.deliverables);
  const testimonials = parseStringList(row.testimonials);
  const portfolioContent = parseJsonValue<Record<string, unknown> | null>(row.content_json, null);
  const blueprint = getProjectBlueprint(String(row.id), row, row.analysis);
  const outcomes =
    blueprint.results.length > 0
      ? blueprint.results
      : ["Project story in progress", "Proof point pending", "Publish analysis not run yet"];

  return {
    id: String(row.id),
    title: row.title,
    client: row.client_name || "Client story",
    category: row.category || "General project",
    role: row.professional_role || row.role || row.account_type || "Lead contributor",
    completedOn: formatDisplayDate(row.updated_at || row.created_at),
    summary: blueprint.heroSummary,
    angle:
      blueprint.platformRecommendations[0]?.angle ||
      "Outcome-led narrative",
    status: mapStatusLabel(row.status),
    rawStatus: row.status,
    channels: [],
    outcomes,
    assets: assets.length,
    reach: row.status === "published" ? "Live" : "Pending",
    lastGenerated: formatDisplayDate(row.updated_at || row.created_at),
    challengeText: row.challenge_text,
    solutionText: row.solution_text,
    resultsText: row.results_text,
    deliverables,
    testimonials,
    assetsUrl: assets,
    portfolioContent,
    buildStage: row.build_stage || null,
    buildProgress: typeof row.build_progress === "number" ? row.build_progress : 0,
    buildStartedAt: row.build_started_at || null,
    buildCompletedAt: row.build_completed_at || null,
    lastBuildError: row.last_build_error || null,
    blueprint
  };
}

export function normalizeProjectDetail(detail: {
  project: any;
  drafts?: any[];
  analysis?: any;
  buildStatus?: any;
}) {
  const project = detail.project;
  const normalized = normalizeProjectRow({
    ...project,
    analysis: detail.analysis
  });

  const drafts = (detail.drafts || []).map((draft) => normalizeGeneratedDraft(draft));
  const blueprint = getProjectBlueprint(normalized.id, project, detail.analysis);

  return {
    ...normalized,
    drafts,
    analysis: detail.analysis,
    buildStatus: detail.buildStatus || null,
    blueprint
  };
}

export function normalizeGeneratedDraft(row: any) {
  const data = parseJsonValue<Record<string, any>>(row.draft_data, {});
  const tags = Array.isArray(data.tags)
    ? data.tags
    : Array.isArray(data.hashtags)
      ? data.hashtags
      : typeof data.tags === "string"
        ? data.tags.split(",").map((item: string) => item.trim()).filter(Boolean)
        : typeof data.hashtags === "string"
          ? data.hashtags.split(" ").filter(Boolean)
          : [];

  return {
    id: row.platform,
    recordId: row.id ? String(row.id) : null,
    label:
      row.platform === "linkedin"
        ? "LinkedIn"
        : row.platform === "behance"
          ? "Behance"
          : row.platform === "googlemybusiness"
            ? "Google"
            : "Dribbble",
    tone: row.tone || "Professional",
    fit: data.why_this_works || "Generated from the current project asset.",
    connected: Boolean(row.external_post_id || row.status === "published"),
    headline: data.headline || data.hook || row.platform,
    body: data.body || data.caption || "",
    cta: data.cta || "",
    tags,
    scheduledAt: row.scheduled_for ? formatDisplayDate(row.scheduled_for) : null,
    status: row.status || null,
    publishedAt: row.published_at || null,
    externalPostId: row.external_post_id || null
  };
}

export function normalizeReviewRow(row: any) {
  return {
    id: String(row.id),
    client: row.reviewer_name,
    projectId: row.project_id ? String(row.project_id) : "",
    source: row.source_platform,
    submittedAt: formatDisplayDate(row.created_at),
    sentiment: row.sentiment,
    rating: row.rating,
    content: row.review_text,
    response: row.response_draft
  };
}

export function mergeChannelState(rows: any[]) {
  return channelConnections.map((channel): ChannelConnection => {
    const live = rows.find((row) => row.platform === channel.id);

    if (!live) {
      if (channel.id === "behance") {
        return channel;
      }

      return {
        ...channel,
        canPublishDirect: false,
        status: "Not connected",
        lastSync: "Not connected yet",
        fallback:
          channel.id === "linkedin"
            ? "Connect first to publish directly."
            : "Connect first for guided upload support."
      };
    }

    const scopeLabels = Array.isArray(live.scope) && live.scope.length
      ? live.scope
      : channel.permissions;
    const status = live.capability_state || channel.status;
    const linkedAccount = live.linked_account || null;
    const descriptionSuffix =
      linkedAccount && status !== "Export only"
        ? ` Connected as ${linkedAccount}.`
        : "";

    return {
      ...channel,
      mode: live.mode || live.setup_mode || channel.mode,
      canPublishDirect: Boolean(live.can_publish),
      linkedAccount,
      status,
      lastSync: live.last_validated_at
        ? `Validated ${formatDisplayDate(live.last_validated_at)}`
        : live.expires_at || live.token_expires_at
          ? `Token expires ${formatDisplayDate(live.expires_at || live.token_expires_at)}`
          : channel.lastSync,
      description: `${channel.description}${descriptionSuffix}`.trim(),
      permissions: scopeLabels,
      fallback: live.fallback_behavior || channel.fallback
    };
  });
}

export function getProjectBlueprintForView(project: any, analysis?: any): ProjectBlueprint {
  return getProjectBlueprint(String(project.id), project, analysis);
}
