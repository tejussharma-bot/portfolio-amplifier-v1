"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  FolderOpen,
  Search,
  Sparkles
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchProjects } from "@/lib/api";
import { projects as seedProjects } from "@/lib/data";
import { normalizeProjectRow } from "@/lib/view-models";

type ProjectCard = ReturnType<typeof normalizeProjectRow>;
type FilterStatus = "All" | "Draft" | "Structuring" | "Ready to amplify" | "Scheduled" | "Published";

const filterOptions: FilterStatus[] = [
  "All",
  "Draft",
  "Structuring",
  "Ready to amplify",
  "Scheduled",
  "Published"
];

function getProgress(project: ProjectCard) {
  if (typeof project.buildProgress === "number" && project.buildProgress > 0) {
    return project.buildProgress;
  }

  switch (project.status) {
    case "Published":
      return 100;
    case "Scheduled":
      return 90;
    case "Ready to amplify":
      return 78;
    case "Structuring":
      return 54;
    default:
      return 34;
  }
}

function getStatusVariant(status: string) {
  if (status === "Published") {
    return "success" as const;
  }

  if (status === "Ready to amplify" || status === "Scheduled") {
    return "info" as const;
  }

  return "warning" as const;
}

export default function ProjectsPage() {
  const { token, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<ProjectCard[]>(seedProjects as ProjectCard[]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterStatus>("All");

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      if (!token || !isAuthenticated) {
        return;
      }

      const result = await fetchProjects(token);

      if (!active) {
        return;
      }

      setProjects(result.projects.map((project) => normalizeProjectRow(project)));
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, [isAuthenticated, token]);

  const deferredQuery = useDeferredValue(query);
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus = status === "All" || project.status === status;
      const haystack = `${project.title} ${project.client} ${project.summary}`.toLowerCase();
      const matchesQuery = !deferredQuery || haystack.includes(deferredQuery.toLowerCase());

      return matchesStatus && matchesQuery;
    });
  }, [deferredQuery, projects, status]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projects"
        title="Case study workspace library"
        description="Every project starts as guided intake, becomes an editorial preview, and then moves into channel-ready publishing only after the case study feels finished."
        actions={
          <Link href="/dashboard/projects/new" className={buttonStyles({ size: "md", className: "rounded-full" })}>
            <Sparkles className="h-4 w-4" />
            New case study
          </Link>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Case studies</CardTitle>
                <CardDescription>
                  Search the builder workspaces that are currently in draft, review, or published state.
                </CardDescription>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search case studies..."
                  className="rounded-full border-0 bg-surface-container-low pl-11"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    status === option
                      ? "bg-pulse-primary text-white shadow-glow"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                  onClick={() => startTransition(() => setStatus(option))}
                >
                  {option}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredProjects.length ? (
              filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="block rounded-[2rem] bg-surface-container-low p-5 transition hover:-translate-y-0.5 hover:shadow-panel"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-2xl font-bold tracking-[-0.04em] text-on-surface">
                          {project.title}
                        </h3>
                        <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                      </div>
                      <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                        {project.summary}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{project.client}</Badge>
                        <Badge variant="outline">{project.category}</Badge>
                        <Badge variant="outline">{project.completedOn}</Badge>
                      </div>
                    </div>

                    <div className="min-w-[180px] rounded-[1.6rem] bg-white p-4">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                        <span>Completion</span>
                        <span>{getProgress(project)}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className="h-full rounded-full bg-pulse-primary"
                          style={{ width: `${getProgress(project)}%` }}
                        />
                      </div>
                      <p className="mt-4 text-sm leading-6 text-on-surface-variant">
                        {project.assets} asset{project.assets === 1 ? "" : "s"} catalogued.
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[2rem] bg-surface-container-low p-8 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-outline" />
                <p className="mt-4 font-display text-2xl font-bold tracking-[-0.04em] text-on-surface">
                  No case studies match that filter
                </p>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  Clear the search or start a new guided intake to create a fresh workspace.
                </p>
                <Link href="/dashboard/projects/new" className={buttonStyles({ size: "md", className: "mt-5 rounded-full" })}>
                  <Sparkles className="h-4 w-4" />
                  Start new case study
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Builder rules</CardTitle>
              <CardDescription>
                The case study is always the source of truth. Publishing comes after the preview is ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Bring links, decks, testimonials, and uploadable assets into the intake.",
                "Use the preview workspace to refine the narrative and switch themes.",
                "Export from the case study before you rephrase it for channels.",
                "Let Publish Studio adapt a finished story instead of creating it from scratch."
              ].map((item) => (
                <div key={item} className="rounded-[1.6rem] bg-surface-container-low p-4">
                  <p className="text-sm leading-7 text-on-surface-variant">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_28%),linear-gradient(135deg,#0f4858_0%,#0f84a8_100%)] p-6 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
                  Fast path
                </p>
                <h3 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em]">
                  Jump into the AI chat canvas
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/82">
                  The new intake replaces the old step-form wizard. It collects structured project context while keeping the experience conversational.
                </p>
                <Link
                  href="/dashboard/projects/new"
                  className={buttonStyles({
                    size: "md",
                    className: "mt-5 rounded-full bg-white text-primary hover:bg-white/95"
                  })}
                >
                  Open chat canvas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
