"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  FileImage,
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

const filterOptions: FilterStatus[] = [
  "All",
  "Draft",
  "Structuring",
  "Ready to amplify",
  "Scheduled",
  "Published"
];
const progressSteps = [12, 28, 46, 64, 82, 100];
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
}

const initialProjects: ProjectCard[] = seedProjects.map((project) => ({
  ...project,
  status: project.status as ProjectCardStatus
}));

export default function ProjectsPage() {
  const { token, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<ProjectCard[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterStatus>("All");
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

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

  async function handleCreateProject() {
    if (!title.trim() || !challenge.trim() || !solution.trim()) {
      setError("Add at least a title, challenge, and solution before generating the case study.");
      return;
    }

    setCreating(true);
    setProgress(progressSteps[0]);
    setError(null);

    if (!token || !isAuthenticated) {
      const projectId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const newProject: ProjectCard = {
        id: projectId,
        title: title.trim(),
        client: clientName.trim() || "New client",
        category: category.trim() || "Fresh intake",
        role: "Lead contributor",
        completedOn: "Today",
        summary: challenge.trim(),
        angle: "AI structuring in progress",
        status: "Structuring",
        channels: [],
        outcomes: ["Source materials received", "Assets queued", "Case study draft pending"],
        assets: files.length,
        reach: "Pending",
        lastGenerated: "Just now"
      };

      setProjects((current) => [newProject, ...current]);
      setActiveProjectId(projectId);

      for (const step of progressSteps) {
        setProgress(step);
        await new Promise((resolve) => setTimeout(resolve, 220));
      }

      setProjects((current) =>
        current.map((project): ProjectCard =>
          project.id === projectId
            ? {
                ...project,
                status: "Ready to amplify",
                angle: "Customer proof story",
                channels: ["LinkedIn", "Behance"],
                lastGenerated: "AI draft ready",
                outcomes: [
                  "Challenge / Solution / Outcome generated",
                  "Top 2 channels recommended",
                  "Editable copy prepared"
                ]
              }
            : project
        )
      );

      setCreating(false);
      setProgress(0);
      resetForm();
      return;
    }

    try {
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

      for (const step of progressSteps) {
        setProgress(step);
        await new Promise((resolve) => setTimeout(resolve, 180));
      }

      const result = await createProject(token, formData);
      const normalized = toProjectCard({
        ...result.project,
        content_json: result.portfolioDraft
      });

      setProjects((current) => [normalized, ...current]);
      setActiveProjectId(normalized.id);
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create the project");
    } finally {
      setCreating(false);
      setProgress(0);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title="Projects are the home for portfolio building"
        description="Capture the challenge, solution, proof, and assets here first. Publishing and reputation workflows should branch out from the project, not compete with it."
        badge={isAuthenticated ? "live workspace" : "demo mode"}
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
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create a new project</CardTitle>
              <CardDescription>
                Use the guided wizard blocks so the case study, analysis, and publish outputs all
                start from the same structured source.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
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

              <div className="grid gap-3 rounded-3xl border border-dashed border-coral-200 bg-coral-50/60 p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-coral-600">
                    <UploadCloud className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Asset drop zone</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG, PDF, deck exports, screenshots, or links that support the story.
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
                    { icon: FileImage, label: "Images", detail: `${files.length} file(s) selected` },
                    { icon: Link2, label: "Links", detail: sourceUrl ? "Source URL added" : "Add a source URL if available" },
                    { icon: CalendarRange, label: "Timeline", detail: timeline || "Add dates or launch notes" }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/80 p-4">
                      <item.icon className="h-4 w-4 text-coral-600" />
                      <p className="mt-3 text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {creating ? (
                <div className="rounded-3xl bg-ink-900 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p className="font-semibold">Structuring your case study...</p>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-coral-400 to-sand-300 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-white/72">
                    Structuring project narrative, identifying strongest proof points, drafting the
                    portfolio layout, and extracting platform angles.
                  </p>
                </div>
              ) : null}

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
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Generate Case Study
              </Button>
            </CardContent>
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
                      "Distill the core problem into a story that is credible enough for clients and concise enough for social distribution."}
                  </p>
                </div>
                <div className="rounded-3xl bg-tide-50 p-5">
                  <p className="kicker">Solution</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {activeProject.blueprint?.solution ||
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
