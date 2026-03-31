"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Linkedin,
  Loader2,
  Palette,
  Send,
  Sparkles
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  analyzeProject,
  fetchBehanceExportTemplate,
  fetchChannelStatus,
  fetchProjectDetail,
  fetchProjects,
  generateContent
} from "@/lib/api";
import {
  projectDistributions,
  projects as seedProjects
} from "@/lib/data";
import {
  getProjectBlueprint,
  publishObjectives,
  voiceModes,
  type ChannelConnection,
  type PlatformId,
  type PlatformRecommendation
} from "@/lib/workflow-data";
import {
  mergeChannelState,
  normalizeGeneratedDraft,
  normalizeProjectDetail,
  normalizeProjectRow
} from "@/lib/view-models";

const platformIcons = {
  linkedin: Linkedin,
  behance: Palette,
  dribbble: Sparkles
};

type StudioProjectStatus =
  | "Draft"
  | "Structuring"
  | "Ready to amplify"
  | "Scheduled"
  | "Published"
  | "Analyzing";

interface StudioProject {
  id: string;
  title: string;
  client: string;
  category: string;
  role: string;
  completedOn: string;
  summary: string;
  angle: string;
  status: StudioProjectStatus;
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
}

const initialProjects: StudioProject[] = seedProjects.map((project) => ({
  ...project,
  status: project.status as StudioProjectStatus
}));

export function PublishStudioPage({
  initialProjectId
}: {
  initialProjectId?: string;
}) {
  const { token, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<StudioProject[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialProjectId && initialProjects.some((project) => project.id === initialProjectId)
      ? initialProjectId
      : initialProjects[0]?.id ?? ""
  );
  const [selectedChannelId, setSelectedChannelId] = useState<PlatformId>("linkedin");
  const [objective, setObjective] =
    useState<(typeof publishObjectives)[number]>("Get clients");
  const [tone, setTone] = useState<(typeof voiceModes)[number]>("Professional");
  const [drafts, setDrafts] = useState(projectDistributions[selectedProjectId] || []);
  const [copied, setCopied] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [channels, setChannels] = useState(mergeChannelState([]));
  const [behanceTemplate, setBehanceTemplate] = useState<any>(null);

  function toStudioProject(project: any): StudioProject {
    const normalized = normalizeProjectRow(project);

    return {
      ...normalized,
      status: normalized.status as StudioProjectStatus
    };
  }

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      if (!token || !isAuthenticated) {
        return;
      }

      try {
        const [projectResult, channelResult] = await Promise.all([
          fetchProjects(token),
          fetchChannelStatus(token)
        ]);

        if (!active) {
          return;
        }

        const liveProjects: StudioProject[] = projectResult.projects.map((project) =>
          toStudioProject(project)
        );
        setProjects(liveProjects);
        setChannels(mergeChannelState(channelResult.channels));

        if (initialProjectId && liveProjects.some((project) => project.id === initialProjectId)) {
          setSelectedProjectId(initialProjectId);
        } else if (liveProjects[0]) {
          setSelectedProjectId(liveProjects[0].id);
        }
      } catch (error) {
        if (!active) {
          return;
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, [initialProjectId, isAuthenticated, token]);

  useEffect(() => {
    let active = true;

    async function loadSelectedProject() {
      if (!selectedProjectId) {
        return;
      }

      if (!token || !isAuthenticated) {
        const seedProject = seedProjects.find((project) => project.id === selectedProjectId) || seedProjects[0];
        setDetail({
          ...seedProject,
          blueprint: getProjectBlueprint(selectedProjectId, {
            title: seedProject.title,
            client_name: seedProject.client,
            category: seedProject.category,
            status: seedProject.status.toLowerCase()
          }),
          analysis: null
        });
        setDrafts(projectDistributions[selectedProjectId] || []);
        setSelectedChannelId((projectDistributions[selectedProjectId] || [])[0]?.id ?? "linkedin");
        return;
      }

      setLoadingProject(true);

      try {
        const result = await fetchProjectDetail(token, selectedProjectId);

        if (!active) {
          return;
        }

        const normalized = normalizeProjectDetail(result);
        setDetail(normalized);
        setDrafts(normalized.drafts.length ? normalized.drafts : []);
        setSelectedChannelId(normalized.drafts[0]?.id ?? "linkedin");
        setObjective(
          publishObjectives.find((item) => item === normalized.blueprint.objective) ??
            "Get clients"
        );
        setTone(
          voiceModes.find((item) => item === normalized.blueprint.tone) ?? "Professional"
        );

        if (!normalized.drafts.some((draft: any) => draft.id === "behance")) {
          const template = await fetchBehanceExportTemplate(token);
          if (active) {
            setBehanceTemplate(template);
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }
      } finally {
        if (active) {
          setLoadingProject(false);
        }
      }
    }

    void loadSelectedProject();

    return () => {
      active = false;
    };
  }, [isAuthenticated, selectedProjectId, token]);

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0];

  const blueprint = useMemo(() => {
    if (detail?.blueprint) {
      return detail.blueprint;
    }

    if (!selectedProject) {
      return null;
    }

    return getProjectBlueprint(String(selectedProject.id), {
      title: selectedProject.title,
      client_name: selectedProject.client,
      category: selectedProject.category,
      status: selectedProject.status.toLowerCase()
    });
  }, [detail, selectedProject]);

  const selectedDraft = drafts.find((draft) => draft.id === selectedChannelId);
  const selectedRecommendation =
    blueprint?.platformRecommendations.find(
      (item: PlatformRecommendation) => item.platform === selectedChannelId
    ) ??
    blueprint?.platformRecommendations[0];
  const selectedConnection =
    channels.find((item: ChannelConnection) => item.id === selectedChannelId) ?? channels[0];

  async function handleRunAnalysis() {
    if (!token || !isAuthenticated || !selectedProjectId) {
      return;
    }

    setRunningAnalysis(true);

    try {
      const analysis = await analyzeProject(token, selectedProjectId, { objective, tone });
      setDetail((current: any) =>
        current
          ? {
              ...current,
              analysis,
              blueprint: getProjectBlueprint(selectedProjectId, current, analysis)
            }
          : current
      );
    } finally {
      setRunningAnalysis(false);
    }
  }

  async function handleGenerateDraft(platform: PlatformId) {
    if (!selectedProjectId) {
      return;
    }

    if (!token || !isAuthenticated) {
      setSelectedChannelId(platform);
      return;
    }

    setGeneratingDraft(true);

    try {
      const row = await generateContent(token, {
        projectId: selectedProjectId,
        platform,
        tone,
        objective,
        contentType: platform === "behance" ? "case-study" : "post"
      });
      const normalized = normalizeGeneratedDraft(row);

      setDrafts((current) => {
        const others = current.filter((item) => item.id !== platform);
        return [...others, normalized].sort((a, b) =>
          a.id === "linkedin" ? -1 : b.id === "linkedin" ? 1 : a.id.localeCompare(b.id)
        );
      });
      setSelectedChannelId(platform);
    } finally {
      setGeneratingDraft(false);
    }
  }

  function updateDraft(field: "headline" | "body" | "cta", value: string) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === selectedChannelId
          ? {
              ...draft,
              [field]: value
            }
          : draft
      )
    );
  }

  async function handleCopy() {
    if (!selectedDraft) {
      return;
    }

    const payload =
      selectedDraft.id === "behance" && behanceTemplate
        ? `${selectedDraft.headline}\n\n${selectedDraft.body}\n\n${selectedDraft.cta}\n\n${behanceTemplate.message}`
        : `${selectedDraft.headline}\n\n${selectedDraft.body}\n\n${selectedDraft.cta}\n\n${selectedDraft.tags.join(" ")}`;

    await navigator.clipboard.writeText(payload);
    setCopied(selectedDraft.id);
    setTimeout(() => setCopied(null), 1800);
  }

  if (!selectedProject || !blueprint || !selectedRecommendation || !selectedConnection) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Publish Studio"
        title="Turn the portfolio asset into channel-ready content"
        description="Run visible platform analysis, choose the objective and tone, then edit publish-ready drafts without losing the project context."
        badge={isAuthenticated ? "live workspace" : "demo mode"}
        actions={
          <Link href={`/dashboard/projects/${selectedProject.id}`} className="inline-flex">
            <Button variant="outline">Open project workspace</Button>
          </Link>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Pick a project</CardTitle>
              <CardDescription>
                Projects drive analysis, draft quality, and the recommended publish order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selectedProjectId === project.id
                      ? "border-tide-300 bg-tide-50/70"
                      : "border-border bg-white/75 hover:-translate-y-0.5 hover:shadow-panel"
                  }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">{project.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{project.angle}</p>
                    </div>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.outcomes.slice(0, 2).map((item: string) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Set the publishing intent</CardTitle>
              <CardDescription>
                Your objective and tone shape hooks, CTA direction, and channel emphasis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-semibold">Objective</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {publishObjectives.map((item) => (
                    <button
                      key={item}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        objective === item
                          ? "bg-ink-900 text-white"
                          : "border border-border bg-white/80 text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setObjective(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Tone</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {voiceModes.map((item) => (
                    <button
                      key={item}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        tone === item
                          ? "bg-coral-500 text-white"
                          : "border border-border bg-white/80 text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setTone(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-ink-900 p-5 text-white">
                <p className="dark-kicker">Core message</p>
                <p className="mt-3 text-lg leading-8 text-white/88">{blueprint.heroSummary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="bg-white/10 text-white" variant="neutral">
                    {objective}
                  </Badge>
                  <Badge className="bg-white/10 text-white" variant="neutral">
                    {tone}
                  </Badge>
                </div>
              </div>

              <Button onClick={handleRunAnalysis} disabled={runningAnalysis || !isAuthenticated}>
                {runningAnalysis ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Run Smart Analysis
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-ink-900 text-white">
            <CardHeader>
              <CardTitle className="text-white">3. Smart analysis</CardTitle>
              <CardDescription className="text-white/72">
                Show the platform fit clearly before asking the user to publish anything.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blueprint.platformRecommendations.map((item: PlatformRecommendation) => {
                const Icon = platformIcons[item.platform];

                return (
                  <button
                    key={item.platform}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      selectedChannelId === item.platform
                        ? "border-white/30 bg-white/16"
                        : "border-white/10 bg-white/8 hover:bg-white/12"
                    }`}
                    onClick={() => setSelectedChannelId(item.platform)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-sm text-white/65">{item.reason}</p>
                        </div>
                      </div>
                      <Badge
                        className="border-0"
                        variant={item.state === "primary" ? "success" : "warning"}
                      >
                        {item.score}/100
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-black/20 p-3 text-sm leading-6 text-white/80">
                        <span className="block text-xs uppercase tracking-[0.2em] text-white/40">
                          Angle
                        </span>
                        <span className="mt-2 block">{item.angle}</span>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3 text-sm leading-6 text-white/80">
                        <span className="block text-xs uppercase tracking-[0.2em] text-white/40">
                          Format
                        </span>
                        <span className="mt-2 block">{item.format}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>4. Draft editor</CardTitle>
                  <CardDescription>
                    Hook, body, CTA, and tags are all editable before publish or export.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["linkedin", "behance", "dribbble"] as PlatformId[]).map((platform) => {
                    const Icon = platformIcons[platform];
                    const existingDraft = drafts.find((draft) => draft.id === platform);

                    return (
                      <button
                        key={platform}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                          selectedChannelId === platform
                            ? "bg-ink-900 text-white"
                            : "border border-border bg-white/80 text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setSelectedChannelId(platform)}
                      >
                        <Icon className="h-4 w-4" />
                        {existingDraft?.label || (platform === "linkedin" ? "LinkedIn" : platform === "behance" ? "Behance" : "Dribbble")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-muted/70 p-5">
                  <p className="kicker">Why this works</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {selectedRecommendation.reason}
                  </p>
                </div>
                <div className="rounded-3xl bg-muted/70 p-5">
                  <p className="kicker">Recommended angle</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {selectedRecommendation.angle}
                  </p>
                </div>
                <div className="rounded-3xl bg-muted/70 p-5">
                  <p className="kicker">Connection state</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {selectedConnection.status}. {selectedConnection.fallback}
                  </p>
                </div>
              </div>

              {!selectedDraft ? (
                <div className="rounded-3xl border border-dashed border-coral-200 bg-coral-50/70 p-6">
                  <p className="text-sm font-semibold">No draft yet for this platform</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Generate a channel-specific draft once the project angle and tone feel right.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => handleGenerateDraft(selectedChannelId)}
                    disabled={generatingDraft || loadingProject}
                  >
                    {generatingDraft ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate {selectedChannelId === "linkedin" ? "LinkedIn" : selectedChannelId === "behance" ? "Behance" : "Dribbble"} draft
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Hook / headline</label>
                    <Textarea
                      value={selectedDraft.headline}
                      onChange={(event) => updateDraft("headline", event.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Body copy</label>
                    <Textarea
                      value={selectedDraft.body}
                      onChange={(event) => updateDraft("body", event.target.value)}
                      className="min-h-[240px]"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">CTA</label>
                    <Textarea
                      value={selectedDraft.cta}
                      onChange={(event) => updateDraft("cta", event.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="rounded-3xl border border-border bg-white/85 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Suggested tags</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedDraft.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-muted/70 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 font-semibold">
                          <CalendarClock className="h-4 w-4 text-coral-600" />
                          Best format
                        </div>
                        <p className="mt-1 text-muted-foreground">{selectedRecommendation.format}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleGenerateDraft(selectedChannelId)}
                  disabled={generatingDraft}
                >
                  {generatingDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Regenerate
                </Button>
                <Button variant="outline">Shorten</Button>
                <Button variant="outline">Make more credible</Button>
                <Button variant="outline">Make more founder-led</Button>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader>
                <CardTitle>5. Asset guidance</CardTitle>
                <CardDescription>
                  Help the user attach the right visual instead of treating every channel the same.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl bg-coral-50 p-5">
                  <p className="kicker">Best thumbnail / hero image</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {blueprint.assetRecommendations.hero}
                  </p>
                </div>
                <div className="rounded-3xl bg-tide-50 p-5">
                  <p className="kicker">Carousel suggestions</p>
                  <div className="mt-3 space-y-3">
                    {blueprint.assetRecommendations.carousel.map((item: string) => (
                      <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-6">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl bg-sand-50 p-5">
                  <p className="kicker">Screens to avoid</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {blueprint.assetRecommendations.avoid.map((item: string) => (
                      <Badge key={item} variant="warning">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Review before publish</CardTitle>
                <CardDescription>
                  Publishing and export should both feel like deliberate choices, not dead ends.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-border bg-white/85 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Selected channel</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedDraft?.label || selectedRecommendation.label}
                      </p>
                    </div>
                    <Badge
                      variant={selectedConnection.status === "Connected" ? "success" : "warning"}
                    >
                      {selectedConnection.status}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {blueprint.publishChecklist.map((item: string) => (
                      <div key={item} className="flex gap-3 rounded-2xl bg-muted/70 px-4 py-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-tide-700" />
                        <p className="text-sm leading-6">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button className="w-full" disabled={!selectedDraft}>
                    {selectedConnection.status === "Connected" ? (
                      <Send className="h-4 w-4" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    {selectedConnection.status === "Connected"
                      ? "Publish now"
                      : `Open ${selectedRecommendation.label} setup / export`}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <CalendarClock className="h-4 w-4" />
                    Schedule later
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleCopy} disabled={!selectedDraft}>
                    {copied === selectedDraft?.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied === selectedDraft?.id ? "Copied" : "Export copy + tags"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </section>
    </div>
  );
}
