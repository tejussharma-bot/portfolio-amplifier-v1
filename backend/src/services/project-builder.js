const { analyzeProjectFit, generatePortfolioDraft } = require("./ai");

const PROJECT_BUILD_STAGES = [
  {
    key: "intake_captured",
    label: "Intake captured",
    progress: 12
  },
  {
    key: "assets_uploaded",
    label: "Assets organized",
    progress: 28
  },
  {
    key: "story_structuring",
    label: "Story extracted",
    progress: 54
  },
  {
    key: "portfolio_composed",
    label: "Portfolio composed",
    progress: 78
  },
  {
    key: "platform_analysis",
    label: "Channel fit analyzed",
    progress: 92
  },
  {
    key: "ready_for_review",
    label: "Ready for review",
    progress: 100
  }
];

function parseArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return [];
}

function getAssetCount(project) {
  return parseArray(project?.assets_url).length;
}

function getDeliverableCount(project) {
  return parseArray(project?.deliverables).length;
}

function getProjectStage(stageKey) {
  return (
    PROJECT_BUILD_STAGES.find((stage) => stage.key === stageKey) ||
    PROJECT_BUILD_STAGES[0]
  );
}

function getStageDescription(stageKey, project) {
  const assetCount = getAssetCount(project);
  const deliverableCount = getDeliverableCount(project);
  const title = project?.title || "your project";

  switch (stageKey) {
    case "intake_captured":
      return `Saved the intake brief for ${title} so the AI builder can work from one structured source.`;
    case "assets_uploaded":
      return assetCount
        ? `Catalogued ${assetCount} uploaded asset${assetCount === 1 ? "" : "s"} and linked references for the build.`
        : "Prepared the written brief and external references for the build.";
    case "story_structuring":
      return `Extracting the challenge, solution, proof, and differentiators for ${title}.`;
    case "portfolio_composed":
      return deliverableCount
        ? `Turning the story into a portfolio draft with ${deliverableCount} key deliverable${deliverableCount === 1 ? "" : "s"}.`
        : "Turning the story into a portfolio draft with a clear hero, proof points, and section order.";
    case "platform_analysis":
      return "Scoring LinkedIn, Behance, and Dribbble fit so distribution starts from the right angle.";
    case "ready_for_review":
      return "The portfolio draft is ready to review, polish, and move into Publish Studio.";
    default:
      return "Project build is in progress.";
  }
}

function createProjectBuildStatus(project) {
  const stageKey =
    project?.build_stage ||
    (["ready", "published", "scheduled"].includes(String(project?.status || ""))
      ? "ready_for_review"
      : "intake_captured");
  const currentStage = getProjectStage(stageKey);
  const ready =
    ["ready", "published", "scheduled"].includes(String(project?.status || "")) ||
    Boolean(project?.build_completed_at);
  const currentIndex = PROJECT_BUILD_STAGES.findIndex((stage) => stage.key === currentStage.key);
  const progress = Number.isFinite(Number(project?.build_progress))
    ? Number(project.build_progress)
    : currentStage.progress;

  return {
    stage: currentStage.key,
    stageLabel: currentStage.label,
    stageDescription: getStageDescription(currentStage.key, project),
    progress,
    startedAt: project?.build_started_at || null,
    completedAt: project?.build_completed_at || null,
    error: project?.last_build_error || null,
    assetCount: getAssetCount(project),
    deliverableCount: getDeliverableCount(project),
    stages: PROJECT_BUILD_STAGES.map((stage, index) => ({
      ...stage,
      description: getStageDescription(stage.key, project),
      state: ready
        ? "completed"
        : index < currentIndex
          ? "completed"
          : index === currentIndex
            ? project?.last_build_error
              ? "error"
              : "current"
            : "upcoming"
    }))
  };
}

async function updateProjectBuildState(executor, projectId, stageKey, options = {}) {
  const stage = getProjectStage(stageKey);
  const progress = Number.isFinite(Number(options.progress))
    ? Number(options.progress)
    : stage.progress;
  const status =
    options.status || (stageKey === "ready_for_review" ? "ready" : "structuring");
  const completed =
    typeof options.completed === "boolean"
      ? options.completed
      : stageKey === "ready_for_review";
  const errorMessage = options.error || null;

  const result = await executor.query(
    `UPDATE projects
     SET status = $1,
         build_stage = $2,
         build_progress = $3,
         build_started_at = COALESCE(build_started_at, CURRENT_TIMESTAMP),
         build_completed_at = CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE build_completed_at END,
         last_build_error = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [status, stageKey, progress, completed, errorMessage, projectId]
  );

  return result.rows[0];
}

async function markProjectBuildFailed(executor, projectId, error) {
  const message = String(error?.message || error || "Project build failed");
  const result = await executor.query(
    `UPDATE projects
     SET status = 'draft',
         build_stage = 'story_structuring',
         last_build_error = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [message, projectId]
  );

  return result.rows[0];
}

async function buildProjectOutputs(project, options = {}) {
  const objective = options.objective || "Get clients";
  const tone = options.tone || "Professional";
  const portfolioDraft = await generatePortfolioDraft(project);
  const analysis = await analyzeProjectFit(project, { objective, tone });
  const recommendedAngles = Object.entries(analysis).map(([platform, details]) => ({
    platform,
    angle: details.angle,
    cta: details.cta
  }));

  return {
    portfolioDraft,
    analysis,
    objective,
    tone,
    recommendedAngles
  };
}

module.exports = {
  PROJECT_BUILD_STAGES,
  buildProjectOutputs,
  createProjectBuildStatus,
  markProjectBuildFailed,
  updateProjectBuildState
};
