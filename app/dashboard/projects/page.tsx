"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  FileImage,
  GalleryVertical,
  LayoutPanelTop,
  Link2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  UploadCloud
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, createProject, fetchProjects } from "@/lib/api";
import { projects as seedProjects } from "@/lib/data";
import { normalizeProjectRow } from "@/lib/view-models";

type ProjectCardStatus =
  | "Draft"
  | "Structuring"
  | "Ready to amplify"
  | "Scheduled"
  | "Published"
  | "Analyzing";

type FilterStatus = "All" | ProjectCardStatus;
type BuilderMode = "intake" | "building" | "complete";
type BuilderStageKey =
  | "intake_captured"
  | "assets_uploaded"
  | "story_structuring"
  | "portfolio_composed"
  | "platform_analysis"
  | "ready_for_review";

interface UploadedAssetPreview {
  id: string;
  name: string;
  sizeLabel: string;
  typeLabel: string;
  previewUrl: string | null;
  isImage: boolean;
}

interface ProjectCard {
  id: string;
  title: string;
  client: string;
  category: string;
  role: string;
  completedOn: string;
  summary: string;
  angle: string;
  status: ProjectCardStatus;
  channels: string[];
  outcomes: string[];
  assets: number;
  reach: string;
  lastGenerated: string;
  blueprint?: any;
  rawStatus?: string;
  challengeText?: string;
  solutionText?: string;
  resultsText?: string;
  deliverables?: string[];
  testimonials?: string[];
  portfolioContent?: any;
  buildStage?: string | null;
  buildProgress?: number;
  buildStartedAt?: string | null;
  buildCompletedAt?: string | null;
  lastBuildError?: string | null;
  buildStatus?: any;
}

const filterOptions: FilterStatus[] = [
  "All",
  "Draft",
  "Structuring",
  "Ready to amplify",
  "Scheduled",
  "Published"
];

const stageOrder: BuilderStageKey[] = [
  "intake_captured",
  "assets_uploaded",
  "story_structuring",
  "portfolio_composed",
  "platform_analysis",
  "ready_for_review"
];

const initialProjects: ProjectCard[] = seedProjects.map((project) => ({
  ...project,
  status: project.status as ProjectCardStatus
}));

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBuilderStages(projectTitle: string, assetCount: number, deliverableCount: number) {
  return [
    {
      key: "intake_captured" as const,
      label: "Intake captured",
      progress: 12,
      description: `Saving the brief for ${projectTitle || "your project"} so the backend can build from one source of truth.`
    },
    {
      key: "assets_uploaded" as const,
      label: "Assets organized",
      progress: 28,
      description: assetCount
        ? `Cataloguing ${assetCount} uploaded asset${assetCount === 1 ? "" : "s"} and any links you attached.`
        : "Preparing the written brief and source links for the builder."
    },
    {
      key: "story_structuring" as const,
      label: "Story extracted",
      progress: 54,
      description: "Pulling out the challenge, solution, results, and strongest proof from your inputs."
    },
    {
      key: "portfolio_composed" as const,
      label: "Portfolio composed",
      progress: 78,
      description: deliverableCount
        ? `Turning the story into a portfolio-ready layout around ${deliverableCount} core deliverable${deliverableCount === 1 ? "" : "s"}.`
        : "Turning the story into a hero summary, proof points, and a cleaner section order."
    },
    {
      key: "platform_analysis" as const,
      label: "Channel fit analyzed",
      progress: 92,
      description: "Checking which portfolio angles and channels are strongest once the draft is assembled."
    },
    {
      key: "ready_for_review" as const,
      label: "Ready for review",
      progress: 100,
      description: "The project is ready to review, refine, and move into Publish Studio."
    }
  ];
}

export default function ProjectsPage() {
  const { token, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<ProjectCard[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterStatus>("All");
  const [creating, setCreating] = useState(false);
  const [builderMode, setBuilderMode] = useState<BuilderMode>("intake");
  const [builderStageKey, setBuilderStageKey] = useState<BuilderStageKey>("intake_captured");
  const [builderProgress, setBuilderProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [assetPreviews, setAssetPreviews] = useState<UploadedAssetPreview[]>([]);
  const [recentProject, setRecentProject] = useState<ProjectCard | null>(null);

  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [category, setCategory] = useState("");
  const [industry, setIndustry] = useState("");
  const [timeline, setTimeline] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");
  const [results, setResults] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [testimonials, setTestimonials] = useState("");

  const deferredQuery = useDeferredValue(query);

  function toProjectCard(project: any): ProjectCard {
    const normalized = normalizeProjectRow(project);

    return {
      ...normalized,
      status: normalized.status as ProjectCardStatus
    };
  }

  function resetForm() {
    setTitle("");
    setClientName("");
    setCategory("");
    setIndustry("");
    setTimeline("");
    setSourceUrl("");
    setChallenge("");
    setSolution("");
    setResults("");
    setDeliverables("");
    setTestimonials("");
    setFiles([]);
  }

  function resetBuilder() {
    setBuilderMode("intake");
    setBuilderStageKey("intake_captured");
    setBuilderProgress(0);
    setCreating(false);
    setError(null);
    setRecentProject(null);
    resetForm();
  }

  useEffect(() => {
    const nextPreviews = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      typeLabel: file.type ? file.type.split("/")[0].toUpperCase() : "FILE",
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      isImage: file.type.startsWith("image/")
    }));

    setAssetPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => {
        if (preview.previewUrl) {
          URL.revokeObjectURL(preview.previewUrl);
        }
      });
    };
  }, [files]);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      if (!token || !isAuthenticated) {
        return;
      }

      try {
        const result = await fetchProjects(token);

        if (!active) {
          return;
        }

        const liveProjects: ProjectCard[] = result.projects.map((project) => toProjectCard(project));
        setProjects(liveProjects);
        setActiveProjectId((current) => current || liveProjects[0]?.id || "");
      } catch (err) {
        if (!active) {
          return;
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, [isAuthenticated, token]);

  const filteredProjects = projects.filter((project) => {
    const matchesStatus = status === "All" || project.status === status;
    const matchesQuery =
      !deferredQuery ||
      project.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      project.summary.toLowerCase().includes(deferredQuery.toLowerCase());

    return matchesStatus && matchesQuery;
  });

  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? filteredProjects[0] ?? projects[0];

  const builderStages = useMemo(() => {
    const deliverableCount = parseCommaList(deliverables).length;
    const stages = getBuilderStages(title.trim() || "your project", assetPreviews.length, deliverableCount);
    const currentIndex = stageOrder.indexOf(builderStageKey);

    return stages.map((stage, index) => ({
      ...stage,
      state:
        builderMode === "complete"
          ? "completed"
          : index < currentIndex
            ? "completed"
            : index === currentIndex
              ? "current"
              : "upcoming"
    }));
  }, [assetPreviews.length, builderMode, builderStageKey, deliverables, title]);

  const activeBuilderStage =
    builderStages.find((stage) => stage.key === builderStageKey) || builderStages[0];

  async function handleCreateProject() {
    if (!title.trim() || !challenge.trim() || !solution.trim()) {
      setError("Add at least a title, challenge, and solution before generating the case study.");
      return;
    }

    setCreating(true);
    setBuilderMode("building");
    setBuilderStageKey("intake_captured");
    setBuilderProgress(12);
    setError(null);
    setRecentProject(null);

    const trackedStages = getBuilderStages(
      title.trim(),
      assetPreviews.length,
      parseCommaList(deliverables).length
    );

    const buildRequest = (async () => {
      if (!token || !isAuthenticated) {
        const now = new Date().toISOString();
        const projectId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
        const portfolioDraft = {
          hero_summary: `${title.trim()} distilled into a cleaner portfolio narrative for ${clientName.trim() || "your next client review"}.`,
          challenge: challenge.trim(),
          solution: solution.trim(),
          results:
            results.trim() ||
            "Project story, proof, and visual structure are ready for review.",
          deliverables: parseCommaList(deliverables),
          proof_points: [
            results.trim() || "AI generated a first pass of the proof stack.",
            assetPreviews.length
              ? `${assetPreviews.length} uploaded asset${assetPreviews.length === 1 ? "" : "s"} queued for the gallery.`
              : "Add visual proof to sharpen the gallery order.",
            "Recommended next step: review the draft, then branch into channel content."
          ],
          testimonial_prompt:
            parseCommaList(testimonials)[0] ||
            "Add the strongest client quote or qualitative proof here.",
          status: "generated"
        };

        const draftProject = toProjectCard({
          id: projectId,
          title: title.trim(),
          client_name: clientName.trim() || "New client",
          category: category.trim() || "Fresh intake",
          industry: industry.trim() || null,
          timeline: timeline.trim() || null,
          source_url: sourceUrl.trim() || null,
          status: "ready",
          challenge_text: challenge.trim(),
          solution_text: solution.trim(),
          results_text: results.trim() || null,
          deliverables: parseCommaList(deliverables),
          testimonials: parseCommaList(testimonials),
          assets_url: files.map((file, index) => ({
            originalName: file.name,
            url: assetPreviews[index]?.previewUrl || "",
            storage: "local"
          })),
          content_json: portfolioDraft,
          created_at: now,
          updated_at: now,
          build_stage: "ready_for_review",
          build_progress: 100,
          build_started_at: now,
          build_completed_at: now
        });

        return {
          normalizedProject: {
            ...draftProject,
            portfolioContent: portfolioDraft
          }
        };
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("client_name", clientName);
      formData.append("category", category);
      formData.append("industry", industry);
      formData.append("timeline", timeline);
      formData.append("source_url", sourceUrl);
      formData.append("challenge", challenge);
      formData.append("solution", solution);
      formData.append("results", results);
      formData.append("deliverables", deliverables);
      formData.append("testimonials", testimonials);
      files.forEach((file) => formData.append("assets", file));

      const result = await createProject(token, formData);
      const normalized = toProjectCard({
        ...result.project,
        content_json: result.portfolioDraft,
        analysis: result.analysis
      });

      return {
        normalizedProject: {
          ...normalized,
          buildStatus: result.buildStatus || null,
          portfolioContent: result.portfolioDraft
        }
      };
    })();

    try {
      for (const stage of trackedStages.slice(1, -1)) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setBuilderStageKey(stage.key);
        setBuilderProgress(stage.progress);
      }

      const { normalizedProject } = await buildRequest;

      setBuilderStageKey("ready_for_review");
      setBuilderProgress(100);
      setProjects((current) => [normalizedProject, ...current]);
      setActiveProjectId(normalizedProject.id);
      setRecentProject(normalizedProject);

      await new Promise((resolve) => setTimeout(resolve, 260));
      setBuilderMode("complete");
    } catch (err) {
      setBuilderMode("intake");
      setBuilderStageKey("intake_captured");
      setBuilderProgress(0);
      setError(err instanceof ApiError ? err.message : "Unable to create the project");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title="Projects are the home for portfolio building"
        description="Capture the challenge, visuals, and proof here first. The backend now builds the portfolio draft and analysis from this intake so Publish Studio starts with a stronger source asset."
        badge={isAuthenticated ? "live workspace" : "demo mode"}
        actions={
          <Button onClick={resetBuilder} variant={builderMode === "intake" ? "outline" : "primary"}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Project library</CardTitle>
                <CardDescription>
                  Browse drafts, queue items, and published case studies from one workspace.
                </CardDescription>
              </div>
              <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:max-w-xl">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search title, client, or summary"
                    className="pl-11"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    status === option
                      ? "bg-ink-900 text-white"
                      : "border border-border bg-white/80 text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => startTransition(() => setStatus(option))}
                >
                  {option}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                className={`w-full rounded-3xl border p-5 text-left transition ${
                  activeProject?.id === project.id
                    ? "border-coral-300 bg-coral-50/70 shadow-glow"
                    : "border-border bg-white/75 hover:-translate-y-0.5 hover:shadow-panel"
                }`}
                onClick={() => setActiveProjectId(project.id)}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold">{project.title}</h3>
                      <Badge
                        variant={
                          project.status === "Published"
                            ? "success"
                            : project.status === "Structuring"
                              ? "warning"
                              : project.status === "Scheduled"
                                ? "info"
                                : "outline"
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">{project.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{project.client}</Badge>
                      <Badge variant="outline">{project.role}</Badge>
                      <Badge variant="outline">{project.completedOn}</Badge>
                    </div>
                  </div>
                  <div className="min-w-[180px] rounded-3xl bg-white/80 p-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Angle</span>
                      <span className="font-semibold">{project.angle}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Channels</span>
                      <span className="font-semibold">
                        {project.channels.length ? project.channels.join(", ") : "Pending"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Assets</span>
                      <span className="font-semibold">{project.assets}</span>
                    </div>
                    {project.buildProgress ? (
                      <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-coral-400 to-sand-300"
                            style={{ width: `${project.buildProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            {builderMode === "intake" ? (
              <>
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>Create a new project</CardTitle>
                      <CardDescription>
                        Start with the upload and project intake. The backend will save the brief,
                        organize assets, generate the portfolio draft, and attach channel analysis.
                      </CardDescription>
                    </div>
                    <Badge variant="outline">4-step intake</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {[
                      "Upload assets",
                      "Add project context",
                      "AI portfolio build",
                      "Review how it looks"
                    ].map((step, index) => (
                      <div key={step} className="rounded-2xl border border-border bg-white/80 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Step {index + 1}
                        </p>
                        <p className="mt-2 text-sm font-semibold">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 rounded-3xl border border-dashed border-coral-200 bg-coral-50/60 p-5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-coral-600">
                        <UploadCloud className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold">Upload the proof first</p>
                        <p className="text-sm text-muted-foreground">
                          Add screenshots, mockups, exported decks, PDFs, or visuals that should shape
                          the gallery and final portfolio draft.
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={(event) => setFiles(Array.from(event.target.files || []))}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-foreground"
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          icon: FileImage,
                          label: "Images",
                          detail: assetPreviews.length
                            ? `${assetPreviews.length} file(s) queued`
                            : "Add the visuals the AI should look at first"
                        },
                        {
                          icon: Link2,
                          label: "Links",
                          detail: sourceUrl ? "Source URL added" : "Add a source URL if available"
                        },
                        {
                          icon: CalendarRange,
                          label: "Timeline",
                          detail: timeline || "Add dates or launch notes"
                        }
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl bg-white/80 p-4">
                          <item.icon className="h-4 w-4 text-coral-600" />
                          <p className="mt-3 text-sm font-semibold">{item.label}</p>
                          <p className="mt-1 text-xs leading-6 text-muted-foreground">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                    {assetPreviews.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {assetPreviews.map((asset) => (
                          <div key={asset.id} className="overflow-hidden rounded-3xl border border-border bg-white">
                            <div className="relative aspect-[1.45/1] bg-muted/70">
                              {asset.previewUrl ? (
                                <Image
                                  src={asset.previewUrl}
                                  alt={asset.name}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                  <FileImage className="h-7 w-7" />
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 px-4 py-3">
                              <p className="truncate text-sm font-semibold">{asset.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {asset.typeLabel} · {asset.sizeLabel}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Project title</label>
                      <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="NeoBank rebrand" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Client / brand</label>
                      <Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="NeoBank" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Category</label>
                      <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Brand identity, dashboard, website..." />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Industry</label>
                      <Input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Fintech, SaaS, healthcare..." />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Timeline</label>
                      <Input value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="6 weeks, Q1 launch, sprint 4..." />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Source URL</label>
                      <Input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://project-link-or-repo.com" />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Challenge / problem</label>
                    <Textarea
                      value={challenge}
                      onChange={(event) => setChallenge(event.target.value)}
                      placeholder="What problem did the client face? What was at stake? What goal needed to be achieved?"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Solution / approach</label>
                    <Textarea
                      value={solution}
                      onChange={(event) => setSolution(event.target.value)}
                      placeholder="Describe the strategy, process, execution, and differentiator."
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Results / proof points</label>
                    <Textarea
                      value={results}
                      onChange={(event) => setResults(event.target.value)}
                      placeholder="Add metrics, business impact, before / after shifts, or ROI if available."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Deliverables</label>
                      <Input
                        value={deliverables}
                        onChange={(event) => setDeliverables(event.target.value)}
                        placeholder="Brand identity, website, UI/UX, ad creatives..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Testimonials</label>
                      <Input
                        value={testimonials}
                        onChange={(event) => setTestimonials(event.target.value)}
                        placeholder="Paste a quote or short testimonial snippet"
                      />
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
                      {error}
                    </div>
                  ) : null}

                  <Button
                    size="lg"
                    className="w-full"
                    disabled={!title.trim() || !challenge.trim() || !solution.trim() || creating}
                    onClick={handleCreateProject}
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Start AI portfolio build
                  </Button>
                </CardContent>
              </>
            ) : null}

            {builderMode === "building" ? (
              <>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>Building your portfolio draft</CardTitle>
                      <CardDescription>
                        The project is now moving through the backend build pipeline instead of the old
                        one-step generator.
                      </CardDescription>
                    </div>
                    <Badge variant="warning">AI build running</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-[28px] bg-ink-900 p-6 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="dark-kicker">Current project</p>
                        <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                          {title.trim() || "Untitled project"}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-white/76">
                          {activeBuilderStage.description}
                        </p>
                      </div>
                      <Loader2 className="mt-1 h-5 w-5 animate-spin" />
                    </div>
                    <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-coral-400 to-sand-300 transition-all duration-500"
                        style={{ width: `${builderProgress}%` }}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/78">
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                        {builderProgress}% complete
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                        {assetPreviews.length} asset{assetPreviews.length === 1 ? "" : "s"}
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                        {clientName.trim() || "Client story"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-3xl border border-border bg-white/85 p-5">
                      <p className="kicker">Uploaded source set</p>
                      <div className="mt-4 space-y-3">
                        {assetPreviews.length ? (
                          assetPreviews.slice(0, 3).map((asset) => (
                            <div key={asset.id} className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3">
                              <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white">
                                {asset.previewUrl ? (
                                  <Image
                                    src={asset.previewUrl}
                                    alt={asset.name}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-muted-foreground">
                                    <FileImage className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{asset.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {asset.typeLabel} · {asset.sizeLabel}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                            No upload was attached, so the builder is using the written project brief and any source URL you supplied.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-border bg-white/85 p-5">
                      <p className="kicker">Backend build stages</p>
                      <div className="mt-4 space-y-3">
                        {builderStages.map((stage) => (
                          <div
                            key={stage.key}
                            className={`rounded-2xl border px-4 py-4 ${
                              stage.state === "completed"
                                ? "border-tide-200 bg-tide-50/60"
                                : stage.state === "current"
                                  ? "border-coral-200 bg-coral-50/70"
                                  : "border-border bg-muted/60"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                  stage.state === "completed"
                                    ? "bg-tide-700 text-white"
                                    : stage.state === "current"
                                      ? "bg-coral-600 text-white"
                                      : "bg-white text-muted-foreground"
                                }`}
                              >
                                {stage.state === "completed" ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : stage.state === "current" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <span className="text-xs font-semibold">{stage.progress}</span>
                                )}
                              </span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold">{stage.label}</p>
                                  <Badge variant="outline">{stage.progress}%</Badge>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                  {stage.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : null}

            {builderMode === "complete" && recentProject ? (
              <>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>How it looks right now</CardTitle>
                      <CardDescription>
                        The intake is complete, the backend build finished, and this draft is ready for review.
                      </CardDescription>
                    </div>
                    <Badge variant="success">Ready for review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-[28px] bg-ink-900 p-6 text-white">
                    <p className="dark-kicker">Hero summary</p>
                    <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight">
                      {recentProject.portfolioContent?.hero_summary || recentProject.summary}
                    </h3>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {recentProject.outcomes.slice(0, 3).map((outcome) => (
                        <span
                          key={outcome}
                          className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/82"
                        >
                          {outcome}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-coral-50 p-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-coral-600">
                          <LayoutPanelTop className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Challenge</p>
                          <p className="text-sm text-muted-foreground">What the story leads with</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-foreground">
                        {recentProject.portfolioContent?.challenge || recentProject.challengeText}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-tide-50 p-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-tide-700">
                          <GalleryVertical className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Solution</p>
                          <p className="text-sm text-muted-foreground">How the work is framed</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-foreground">
                        {recentProject.portfolioContent?.solution || recentProject.solutionText}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-sand-50 p-5">
                    <p className="kicker">Proof points and next actions</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(recentProject.portfolioContent?.proof_points || recentProject.outcomes).map((item: string) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-tide-700" />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link href={`/dashboard/projects/${recentProject.id}`} className={buttonStyles({})}>
                      Open project
                    </Link>
                    <Link
                      href={`/dashboard/publish-studio?project=${recentProject.id}`}
                      className={buttonStyles({ variant: "outline" })}
                    >
                      Move to Publish Studio
                    </Link>
                    <Button variant="ghost" onClick={resetBuilder}>
                      Start another intake
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : null}
          </Card>

          {activeProject ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{activeProject.title}</CardTitle>
                    <CardDescription>
                      Auto-structured view of the currently selected project.
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{activeProject.angle}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl bg-coral-50 p-5">
                  <p className="kicker">Challenge</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {activeProject.blueprint?.challenge ||
                      activeProject.challengeText ||
                      "Distill the core problem into a story that is credible enough for clients and concise enough for social distribution."}
                  </p>
                </div>
                <div className="rounded-3xl bg-tide-50 p-5">
                  <p className="kicker">Solution</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {activeProject.blueprint?.solution ||
                      activeProject.solutionText ||
                      "Pull proof, process, and visuals into one narrative spine that can feed case studies and channel-specific copy."}
                  </p>
                </div>
                <div className="rounded-3xl bg-sand-50 p-5">
                  <p className="kicker">Outcome</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeProject.outcomes.map((outcome) => (
                      <span
                        key={outcome}
                        className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-semibold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-tide-600" />
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl bg-muted/70 p-5">
                  <p className="kicker">Recommended next step</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Open the project detail to refine the case study, then move into Publish Studio
                    once the proof and visuals feel sharp.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {activeProject.channels.length ? (
                      activeProject.channels.map((channel) => (
                        <Badge key={channel} variant="outline">
                          {channel}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="warning">
                        <Sparkles className="h-3.5 w-3.5" />
                        Channels pending analysis
                      </Badge>
                    )}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/projects/${activeProject.id}`}
                      className={buttonStyles({ size: "sm" })}
                    >
                      Open project
                    </Link>
                    <Link
                      href={`/dashboard/publish-studio?project=${activeProject.id}`}
                      className={buttonStyles({ variant: "outline", size: "sm" })}
                    >
                      Amplify in Publish Studio
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}

