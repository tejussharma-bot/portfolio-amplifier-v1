"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Clock3,
  MessageSquareQuote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchChannelStatus, fetchProjects, fetchReviews } from "@/lib/api";
import {
  activityFeed as seedActivityFeed,
  dashboardMetrics,
  launchChecklist,
  projects as seedProjects,
  reviews as seedReviews
} from "@/lib/data";
import { mergeChannelState, normalizeProjectRow, normalizeReviewRow } from "@/lib/view-models";

type DashboardProject = {
  id: string;
  title: string;
  client: string;
  category: string;
  role: string;
  completedOn: string;
  summary: string;
  angle: string;
  status: string;
  channels: string[];
  outcomes: string[];
  assets: number;
  reach: string;
  lastGenerated: string;
  rawStatus?: string;
  blueprint?: any;
};

type DashboardReview = {
  id: string;
  client: string;
  projectId: string;
  source: string;
  submittedAt: string;
  sentiment: string;
  rating: number;
  content: string;
  response: string | null;
};

const iconTones = [
  "bg-coral-50 text-coral-600",
  "bg-tide-50 text-tide-700",
  "bg-sand-50 text-sand-700",
  "bg-ink-50 text-ink-700"
];

const metricIcons = [Rocket, Clock3, Target, ShieldCheck];

export default function DashboardPage() {
  const { token, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<DashboardProject[]>(seedProjects);
  const [reviews, setReviews] = useState<DashboardReview[]>(seedReviews);
  const [channelStatus, setChannelStatus] = useState(mergeChannelState([]));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      if (!token || !isAuthenticated) {
        return;
      }

      setLoading(true);

      try {
        const [projectResult, reviewResult, channelResult] = await Promise.all([
          fetchProjects(token),
          fetchReviews(token),
          fetchChannelStatus(token)
        ]);

        if (!active) {
          return;
        }

        setProjects(projectResult.projects.map((project) => normalizeProjectRow(project)));
        setReviews(reviewResult.reviews.map((review) => normalizeReviewRow(review)));
        setChannelStatus(mergeChannelState(channelResult.channels));
      } catch (error) {
        if (!active) {
          return;
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, [isAuthenticated, token]);

  const publishedProjects = projects.filter((project) => project.status === "Published");
  const pendingReviews = reviews.filter((review) => !review.response);
  const connectedChannels = channelStatus.filter((channel) => channel.status === "Connected").length;
  const activityItems = isAuthenticated
    ? [
        `${projects.filter((project) => project.status !== "Published").length} projects still in motion.`,
        `${connectedChannels} channels currently connected.`,
        `${pendingReviews.length} reviews still need attention.`,
        loading ? "Live workspace sync in progress." : "Workspace synced with the backend."
      ]
    : seedActivityFeed;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace overview"
        title="Portfolio intelligence, not just content output"
        description="Track the product loop from first project intake to publish velocity and reputation follow-through."
        badge={isAuthenticated ? "live" : "demo"}
        actions={
          <>
            <Link
              href="/dashboard/reviews"
              className={buttonStyles({ variant: "outline", size: "md" })}
            >
              Import Reviews
            </Link>
            <Link
              href="/dashboard/publish-studio"
              className={buttonStyles({ variant: "outline", size: "md" })}
            >
              Open Publish Studio
            </Link>
            <Link href="/dashboard/projects" className={buttonStyles({ size: "md" })}>
              New Project
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        {dashboardMetrics.map((metric, index) => {
          const Icon = metricIcons[index];
          const value =
            index === 0 && isAuthenticated
              ? `${projects.length}`
              : index === 1 && isAuthenticated
                ? `${pendingReviews.length}`
                : index === 2 && isAuthenticated
                  ? `${connectedChannels}`
                  : metric.value;
          const detail =
            index === 0 && isAuthenticated
              ? "projects in the workspace"
              : index === 1 && isAuthenticated
                ? "reviews waiting for replies"
                : index === 2 && isAuthenticated
                  ? "channels currently connected"
                  : metric.detail;

          return (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={value}
              detail={detail}
              icon={Icon}
              iconTone={iconTones[index]}
            />
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Projects in motion</CardTitle>
              <CardDescription>
                A quick read on where portfolio assets are sitting in the V1 pipeline.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/projects"
              className={buttonStyles({ variant: "ghost", size: "sm" })}
            >
              Manage projects
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-3xl border border-border bg-white/80 p-5 transition hover:-translate-y-0.5 hover:shadow-panel"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold">{project.title}</h3>
                      <Badge
                        variant={
                          project.status === "Published"
                            ? "success"
                            : project.status === "Analyzing" || project.status === "Structuring"
                              ? "warning"
                              : project.status === "Scheduled"
                                ? "info"
                                : "outline"
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                      {project.summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{project.category}</Badge>
                      <Badge variant="outline">{project.angle}</Badge>
                      <Badge variant="outline">{project.assets} assets</Badge>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-3xl bg-muted/70 p-4 text-sm sm:min-w-[220px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Reach</span>
                      <span className="font-semibold">{project.reach}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Channels</span>
                      <span className="font-semibold">
                        {project.channels.length ? project.channels.join(", ") : "Recommended next"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Updated</span>
                      <span className="font-semibold">{project.lastGenerated}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {project.outcomes.map((outcome) => (
                    <div
                      key={outcome}
                      className="rounded-full bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-700"
                    >
                      {outcome}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Live activity</CardTitle>
              <CardDescription>Signals that matter across analysis, publishing, and reviews.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-muted/70 p-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-600">
                    <Activity className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-7">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>ORM inbox</CardTitle>
                  <CardDescription>Pending feedback that still needs a human-approved response.</CardDescription>
                </div>
                <Badge variant="danger">{pendingReviews.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReviews.slice(0, 3).map((review) => (
                <div key={review.id} className="rounded-2xl border border-border bg-white/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{review.client}</p>
                      <p className="text-sm text-muted-foreground">{review.submittedAt}</p>
                    </div>
                    <Badge
                      variant={
                        review.sentiment === "positive"
                          ? "success"
                          : review.sentiment === "negative"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {review.sentiment}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{review.content}</p>
                </div>
              ))}
              <Link
                href="/dashboard/reviews"
                className={buttonStyles({ variant: "outline", className: "w-full" })}
              >
                Open response workflow
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-ink-900 text-white">
          <CardHeader>
            <CardTitle className="text-white">Launch criteria pulse</CardTitle>
            <CardDescription className="text-white/70">
              A design-facing view of the go / no-go checklist from the PRD.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {launchChecklist.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm font-semibold text-white/88">{item.label}</span>
                <Badge variant={item.done ? "success" : "warning"}>{item.done ? "ready" : "in progress"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why published work is winning</CardTitle>
            <CardDescription>
              Published projects are performing because they connect impact, visuals, and channel fit
              instead of acting like generic portfolio pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-coral-50 p-5">
              <Sparkles className="h-5 w-5 text-coral-600" />
              <p className="mt-4 font-display text-xl font-semibold">{publishedProjects.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">projects already published</p>
            </div>
            <div className="rounded-3xl bg-tide-50 p-5">
              <Rocket className="h-5 w-5 text-tide-700" />
              <p className="mt-4 font-display text-xl font-semibold">{connectedChannels}</p>
              <p className="mt-1 text-sm text-muted-foreground">channels connected for direct publishing</p>
            </div>
            <div className="rounded-3xl bg-sand-50 p-5">
              <MessageSquareQuote className="h-5 w-5 text-sand-700" />
              <p className="mt-4 font-display text-xl font-semibold">{pendingReviews.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">reviews still waiting for a response</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
