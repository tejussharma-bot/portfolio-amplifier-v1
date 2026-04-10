"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Eye,
  Link2,
  Megaphone,
  MessageSquareQuote,
  Plus,
  Sparkles
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchChannelStatus, fetchProjects, fetchReviews } from "@/lib/api";
import { projects as seedProjects, reviews as seedReviews } from "@/lib/data";
import { cn } from "@/lib/utils";
import { mergeChannelState, normalizeProjectRow, normalizeReviewRow } from "@/lib/view-models";

type DashboardProject = ReturnType<typeof normalizeProjectRow>;
type DashboardReview = ReturnType<typeof normalizeReviewRow>;

function getProgress(project: DashboardProject) {
  if (typeof project.buildProgress === "number" && project.buildProgress > 0) {
    return project.buildProgress;
  }

  switch (project.status) {
    case "Published":
      return 100;
    case "Scheduled":
      return 92;
    case "Ready to amplify":
      return 80;
    case "Structuring":
      return 56;
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

export default function DashboardPage() {
  const { token, isAuthenticated, user } = useAuth();
  const [projects, setProjects] = useState<DashboardProject[]>(seedProjects as DashboardProject[]);
  const [reviews, setReviews] = useState<DashboardReview[]>(seedReviews as DashboardReview[]);
  const [channels, setChannels] = useState(mergeChannelState([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      if (!token || !isAuthenticated) {
        setLoading(false);
        return;
      }

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
        setChannels(mergeChannelState(channelResult.channels));
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

  const welcomeName = user?.fullName?.split(" ")[0] || "Arpita";
  const recentProjects = useMemo(() => projects.slice(0, 4), [projects]);
  const connectedChannels = channels.filter((channel) => channel.status === "Connected - publish capable");
  const pendingReviews = reviews.filter((review) => !review.response).slice(0, 3);

  return (
    <div className="space-y-8 animate-appear">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2.75rem] bg-surface-container-lowest shadow-floating">
          <div className="relative overflow-hidden rounded-[2.4rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,#2f1bdb_0%,#4a41f2_48%,#6a78ff_100%)] px-7 py-8 text-white md:px-10 md:py-10">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/88">
                <Sparkles className="h-3.5 w-3.5" />
                AI Case Study Builder
              </div>
              <div className="space-y-3">
                <h1 className="font-display text-4xl font-extrabold tracking-[-0.05em] md:text-5xl">
                  Welcome back, {welcomeName}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/82 md:text-lg">
                  Bring project context, assets, decks, links, and testimonials into one guided
                  conversation. We&apos;ll shape the case study, preview it beautifully, then rephrase
                  it for publishing when you&apos;re ready.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/projects/new" className={buttonStyles({ size: "lg", className: "rounded-full bg-white text-primary shadow-[0_20px_40px_rgba(15,12,50,0.18)] hover:bg-white/94" })}>
                  Complete your first case study
                </Link>
                <Link
                  href="/dashboard/projects"
                  className={buttonStyles({
                    variant: "ghost",
                    size: "lg",
                    className: "rounded-full bg-white/10 text-white hover:bg-white/16 hover:text-white"
                  })}
                >
                  View workspace library
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
            {[
              {
                label: "Live case studies",
                value: projects.filter((project) => project.status === "Published").length,
                hint: "Published and already usable"
              },
              {
                label: "In progress",
                value: projects.filter((project) => project.status !== "Published").length,
                hint: "Still refining preview or theme"
              },
              {
                label: "Connected channels",
                value: connectedChannels.length,
                hint: "Ready for direct post or export"
              }
            ].map((item) => (
              <div key={item.label} className="rounded-[2rem] bg-surface-container-low p-5">
                <p className="kicker">{item.label}</p>
                <p className="mt-4 font-display text-4xl font-extrabold tracking-[-0.05em] text-on-surface">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-surface-container-lowest">
          <CardHeader className="pb-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker">Connected Channels</p>
                <CardTitle className="mt-2">Publishing readiness</CardTitle>
              </div>
              <Link href="/dashboard/channels" className="text-sm font-semibold text-primary">
                Manage
              </Link>
            </div>
            <CardDescription>
              Keep identity linking, channel connections, and export-first destinations clear before
              you move into Publish Studio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="rounded-[1.8rem] bg-surface-container-low p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{channel.name}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{channel.description}</p>
                  </div>
                  <Badge
                    variant={
                      channel.status === "Connected - publish capable"
                        ? "success"
                        : channel.status === "Export only"
                          ? "info"
                          : channel.status === "Connected - sign-in only"
                            ? "warning"
                            : "outline"
                    }
                  >
                    {channel.status}
                  </Badge>
                </div>
              </div>
            ))}

            <div className="rounded-[1.8rem] bg-surface-container-low p-4">
              <p className="text-sm font-semibold text-on-surface">Next step</p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Publish Studio should only rephrase a finished case study. Start in the builder,
                then move into channel distribution once the preview is approved.
              </p>
              <Link
                href="/dashboard/publish-studio"
                className={buttonStyles({
                  variant: "secondary",
                  size: "md",
                  className: "mt-4 w-full justify-center rounded-full"
                })}
              >
                Open Publish Studio
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker">Recent Projects</p>
                <CardTitle className="mt-2">Case studies in motion</CardTitle>
              </div>
              <Link href="/dashboard/projects" className="text-sm font-semibold text-primary">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-[2rem] bg-surface-container-low">
              <div className="grid grid-cols-[2.2fr_1fr_0.9fr_0.7fr] gap-4 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-outline">
                <span>Name</span>
                <span>Completion</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              <div className="space-y-2 p-2">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="grid grid-cols-[2.2fr_1fr_0.9fr_0.7fr] items-center gap-4 rounded-[1.6rem] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-panel"
                  >
                    <div>
                      <p className="font-semibold text-on-surface">{project.title}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {project.client} • {project.category}
                      </p>
                    </div>
                    <div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className="h-full rounded-full bg-pulse-primary"
                          style={{ width: `${getProgress(project)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-on-surface-variant">
                        {getProgress(project)}%
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                    <span className="inline-flex items-center justify-start text-sm font-semibold text-primary">
                      <Eye className="mr-2 h-4 w-4" />
                      Open
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="kicker">Recent Reviews</p>
                  <CardTitle className="mt-2">Proof that strengthens the story</CardTitle>
                </div>
                <Link href="/dashboard/reviews" className="text-sm font-semibold text-primary">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingReviews.map((review) => (
                <div key={review.id} className="rounded-[1.8rem] bg-surface-container-low p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary-fixed p-2 text-primary">
                      <MessageSquareQuote className="h-4 w-4" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-on-surface">{review.client}</p>
                      <p className="text-sm leading-7 text-on-surface-variant">{review.content}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                        {review.submittedAt}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="rounded-[2rem] bg-surface-container-low p-6">
                <p className="kicker">Core Flow</p>
                <div className="mt-4 space-y-3">
                  {[
                    "Conversation creates the case study",
                    "Preview and themes make it tangible",
                    "Export makes it usable",
                    "Publish Studio rephrases it for distribution"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-[1.3rem] bg-white px-4 py-3">
                      <div className="rounded-full bg-primary-fixed p-1.5 text-primary">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm text-on-surface-variant">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/dashboard/projects/new" className={buttonStyles({ size: "md", className: "rounded-full" })}>
                    <Plus className="h-4 w-4" />
                    New case study
                  </Link>
                  <Link
                    href="/dashboard/channels"
                    className={buttonStyles({
                      variant: "outline",
                      size: "md",
                      className: "rounded-full"
                    })}
                  >
                    <Link2 className="h-4 w-4" />
                    Check channel setup
                  </Link>
                  <Link
                    href="/dashboard/publish-studio"
                    className={buttonStyles({
                      variant: "ghost",
                      size: "md",
                      className: "rounded-full"
                    })}
                  >
                    <Megaphone className="h-4 w-4" />
                    Rephrase for publishing
                  </Link>
                </div>
                {loading ? (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                    Refreshing workspace signals…
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
