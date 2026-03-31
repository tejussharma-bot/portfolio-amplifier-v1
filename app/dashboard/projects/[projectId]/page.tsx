"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  GalleryVertical,
  LayoutPanelTop,
  Lightbulb,
  Rocket,
  Sparkles
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchProjectDetail, savePortfolio } from "@/lib/api";
import { projectDistributions, projects as seedProjects } from "@/lib/data";
import { getProjectBlueprint, type PlatformRecommendation } from "@/lib/workflow-data";
import { normalizeGeneratedDraft, normalizeProjectDetail } from "@/lib/view-models";

const statusVariant = {
  Draft: "outline",
  Structuring: "warning",
  "Ready to amplify": "outline",
  Published: "success",
  Scheduled: "info",
  Analyzing: "warning"
} as const;

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId || "";
  const { token, isAuthenticated } = useAuth();
  const [detail, setDetail] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      if (!projectId) {
        return;
      }

      if (!token || !isAuthenticated) {
        const seedProject = seedProjects.find((entry) => entry.id === projectId);

        if (!seedProject || !active) {
          return;
        }

        const blueprint = getProjectBlueprint(projectId, {
          title: seedProject.title,
          client_name: seedProject.client,
          category: seedProject.category,
          status: seedProject.status.toLowerCase()
        });

        setDetail({
          ...seedProject,
          blueprint,
          drafts: projectDistributions[projectId] || [],
          analysis: null
        });
        return;
      }

      try {
        const result = await fetchProjectDetail(token, projectId);

        if (!active) {
          return;
        }

        setDetail(normalizeProjectDetail(result));
      } catch (error) {
        if (!active) {
          return;
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [isAuthenticated, projectId, token]);

  const project = detail;
  const blueprint = useMemo(() => {
    if (!detail) {
      return null;
    }

    return detail.blueprint || getProjectBlueprint(projectId, detail, detail.analysis);
  }, [detail, projectId]);

  if (!project || !blueprint) {
    return null;
  }

  async function handlePublishPortfolio() {
    if (!token || !isAuthenticated || !detail.portfolioContent) {
      return;
    }

    setSaving(true);

    try {
      await savePortfolio(token, projectId, {
        contentJson: detail.portfolioContent,
        isPublished: true
      });
      setDetail((current: any) =>
        current
          ? {
              ...current,
              status: "Published"
            }
          : current
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project workspace"
        title={project.title}
        description={`${project.client} · ${project.category}. Build the portfolio asset here first, then turn it into channel-ready content once the narrative feels strong.`}
        badge={project.status}
        actions={
          <>
            <Link
              href="/dashboard/projects"
              className={buttonStyles({ variant: "outline", size: "md" })}
            >
              Back to Projects
            </Link>
            <Link
              href={`/dashboard/publish-studio?project=${project.id}`}
              className={buttonStyles({ size: "md" })}
            >
              Amplify this project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Guided intake summary</CardTitle>
                <CardDescription>
                  The wizard keeps the project grounded in challenge, solution, proof, and assets.
                </CardDescription>
              </div>
              <Badge variant={statusVariant[project.status as keyof typeof statusVariant] || "outline"}>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-coral-50 p-5">
              <p className="kicker">Challenge</p>
              <p className="mt-3 text-sm leading-7 text-foreground">{blueprint.challenge}</p>
            </div>
            <div className="rounded-3xl bg-tide-50 p-5">
              <p className="kicker">Solution</p>
              <p className="mt-3 text-sm leading-7 text-foreground">{blueprint.solution}</p>
            </div>
            <div className="rounded-3xl bg-sand-50 p-5">
              <p className="kicker">Deliverables</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {blueprint.deliverables.map((item: string) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-muted/70 p-5">
              <p className="kicker">Results / proof points</p>
              <div className="mt-3 space-y-3">
                {blueprint.results.map((result: string) => (
                  <div key={result} className="flex gap-3 rounded-2xl bg-white/85 px-4 py-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-tide-700" />
                    <p className="text-sm leading-6 text-foreground">{result}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Portfolio draft</CardTitle>
                <CardDescription>
                  This is the core asset. Once this reads clearly, Publish Studio should feel easy.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{blueprint.template}</Badge>
                <Badge variant="outline">{blueprint.completion}% complete</Badge>
                <Badge variant="outline">{blueprint.readiness}% ready to amplify</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-[28px] bg-ink-900 p-6 text-white">
                <p className="dark-kicker">Hero summary</p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">
                  {blueprint.heroSummary}
                </h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.outcomes.map((outcome: string) => (
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
                <div className="rounded-3xl bg-white/85 p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
                      <LayoutPanelTop className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Narrative angle</p>
                      <p className="text-sm text-muted-foreground">{project.angle}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{blueprint.objective}</p>
                </div>
                <div className="rounded-3xl bg-white/85 p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-tide-50 text-tide-700">
                      <Rocket className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Recommended tone</p>
                      <p className="text-sm text-muted-foreground">{blueprint.tone}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    The current project reads strongest when it stays outcome-led and specific.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-muted/70 p-5">
                <p className="kicker">Testimonial</p>
                <p className="mt-3 text-lg leading-8 text-foreground">
                  &quot;{blueprint.testimonial.quote}&quot;
                </p>
                <p className="mt-3 text-sm font-semibold text-muted-foreground">
                  {blueprint.testimonial.attribution}
                </p>
              </div>

              {isAuthenticated ? (
                <Button onClick={handlePublishPortfolio} disabled={saving || project.status === "Published"}>
                  {saving ? "Publishing..." : project.status === "Published" ? "Portfolio Published" : "Publish portfolio"}
                </Button>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-white/85 p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sand-50 text-sand-700">
                    <Lightbulb className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">AI suggestions</p>
                    <p className="text-sm text-muted-foreground">Editing nudges before publish</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {blueprint.aiSuggestions.map((item: string) => (
                    <div key={item} className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-white/85 p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
                    <GalleryVertical className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Gallery guidance</p>
                    <p className="text-sm text-muted-foreground">Best sequence for the proof asset</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {blueprint.gallery.map((item: string) => (
                    <div key={item} className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-coral-200 bg-coral-50/70 p-5">
                <p className="text-sm font-semibold">Recommended next action</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Run Publish Studio once the hero summary, proof points, and gallery order all look
                  final. That keeps the social drafts grounded in the portfolio asset.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Smart analysis snapshot</CardTitle>
            <CardDescription>
              The channel fit should be visible before any publishing decision is made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {blueprint.platformRecommendations.map((item: PlatformRecommendation) => (
              <div key={item.platform} className="rounded-3xl border border-border bg-white/85 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-semibold">{item.label}</h3>
                      <Badge
                        variant={
                          item.state === "primary"
                            ? "success"
                            : item.state === "export"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {item.score} / 100
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.reason}</p>
                  </div>
                  <Badge variant="outline">{item.format}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-muted/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Recommended angle
                    </p>
                    <p className="mt-3 text-sm leading-6">{item.angle}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Suggested CTA
                    </p>
                    <p className="mt-3 text-sm leading-6">{item.cta}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets and launch readiness</CardTitle>
            <CardDescription>
              Match the asset choice to the platform instead of recycling the same visual everywhere.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl bg-ink-900 p-5 text-white">
              <p className="dark-kicker">Best hero frame</p>
              <p className="mt-3 text-lg leading-8 text-white/88">
                {blueprint.assetRecommendations.hero}
              </p>
            </div>

            <div className="rounded-3xl bg-white/85 p-5">
              <p className="kicker">Carousel suggestions</p>
              <div className="mt-4 space-y-3">
                {blueprint.assetRecommendations.carousel.map((item: string) => (
                  <div key={item} className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white/85 p-5">
              <p className="kicker">What to avoid</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {blueprint.assetRecommendations.avoid.map((item: string) => (
                  <Badge key={item} variant="warning">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white/85 p-5">
              <p className="kicker">Review before publishing</p>
              <div className="mt-4 space-y-3">
                {blueprint.publishChecklist.map((item: string) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-muted/70 px-4 py-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-coral-600" />
                    <p className="text-sm leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-muted/70 p-5">
              <p className="text-sm font-semibold">Current draft footprint</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(detail.drafts || projectDistributions[projectId] || []).map((draft: any) => {
                  const normalized = draft.label ? draft : normalizeGeneratedDraft(draft);

                  return (
                    <Badge key={normalized.id} variant="outline">
                      {normalized.label}
                    </Badge>
                  );
                })}
              </div>
              <Link
                href={`/dashboard/publish-studio?project=${project.id}`}
                className={buttonStyles({ className: "mt-5 w-full" })}
              >
                Continue to Publish Studio
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
