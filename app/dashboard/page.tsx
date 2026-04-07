"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Download,
  FolderOpen,
  Palette,
  Share2,
  Sparkles,
  Video
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchChannelStatus, fetchProjects, fetchReviews } from "@/lib/api";
import {
  projects as seedProjects,
  reviews as seedReviews
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { mergeChannelState, normalizeProjectRow, normalizeReviewRow } from "@/lib/view-models";

type DashboardProject = ReturnType<typeof normalizeProjectRow>;
type DashboardReview = ReturnType<typeof normalizeReviewRow>;

function getProgress(status: string) {
  switch (status) {
    case "Published":
      return 100;
    case "Scheduled":
      return 88;
    case "Ready to amplify":
      return 76;
    case "Structuring":
      return 54;
    case "Analyzing":
      return 42;
    default:
      return 30;
  }
}

function projectArtworkTone(projectId: string) {
  if (projectId.includes("branding") || projectId.includes("rebrand")) {
    return "from-[#2b194f] via-[#3e51f7] to-[#8b5cf6]";
  }

  if (projectId.includes("dashboard") || projectId.includes("portal")) {
    return "from-[#c8d7ff] via-[#7aa8ff] to-[#3759ea]";
  }

  return "from-[#f4f3ff] via-[#c0c1ff] to-[#3939c7]";
}

export default function DashboardPage() {
  const { token, isAuthenticated, user } = useAuth();
  const [projects, setProjects] = useState<DashboardProject[]>(seedProjects as DashboardProject[]);
  const [reviews, setReviews] = useState<DashboardReview[]>(seedReviews as DashboardReview[]);
  const [channelStatus, setChannelStatus] = useState(mergeChannelState([]));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      if (!token || !isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
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
        console.error("Failed to load dashboard data:", error);
        setError("Failed to load dashboard data. Please refresh the page.");
        // Keep seed data as fallback
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

  const heroProjects = projects.slice(0, 2);
  const publishProjects = projects.filter((project) =>
    ["Published", "Scheduled", "Ready to amplify"].includes(project.status)
  );
  const pendingReviews = reviews.filter((review) => !review.response);
  const welcomeName = user?.fullName?.split(" ")[0] || "Alex";

  const channelCards = useMemo(() => {
    return channelStatus.map((channel) => ({
      ...channel,
      icon:
        channel.id === "linkedin"
          ? Share2
          : channel.id === "behance"
            ? Palette
            : Sparkles,
      tone:
        channel.id === "linkedin"
          ? "bg-blue-50 text-blue-600"
          : channel.id === "behance"
            ? "bg-orange-50 text-orange-600"
            : "bg-pink-50 text-pink-500"
    }));
  }, [channelStatus]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.05em] text-on-surface">
            Welcome back, {welcomeName}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-on-surface-variant">
            Your portfolio has gained <span className="font-semibold text-secondary">+12% visibility</span>{" "}
            this week. Here&apos;s what needs your focus today.
          </p>
        </div>
        <Link href="/dashboard/reviews" className={buttonStyles({ variant: "secondary" })}>
          <Download className="h-4 w-4" />
          Import Reviews
        </Link>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Projects in progress</CardTitle>
            </div>
            <Link
              href="/dashboard/projects"
              className="text-sm font-bold uppercase tracking-[0.18em] text-primary"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-5 rounded-[1.5rem] p-4">
                    <div className="h-20 w-20 animate-pulse rounded-[1rem] bg-surface-container-low" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-surface-container-low" />
                    </div>
                  </div>
                ))}
              </div>
            ) : heroProjects.length > 0 ? (
              heroProjects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center gap-5 rounded-[1.5rem] p-4 transition hover:bg-surface-container-low"
              >
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-[1rem] bg-gradient-to-br ${projectArtworkTone(project.id)} shadow-panel`}
                >
                  <FolderOpen className="h-7 w-7 text-white/90" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-on-surface">{project.title}</h3>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(135deg,#1c32df_0%,#3e51f7_100%)]"
                        style={{ width: `${getProgress(project.status)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant">
                      {getProgress(project.status)}% Complete
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-outline transition group-hover:text-primary" />
              </div>
            ))
            ) : (
              <div className="py-8 text-center text-on-surface-variant">
                <p>No projects yet. Create your first project to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low">
          <CardHeader>
            <CardTitle>Connected channels</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-between">
            <div className="space-y-4">
              {channelCards.map((channel) => (
                <div
                  key={channel.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl bg-surface-container-lowest p-3",
                    channel.status === "Export mode" && "opacity-70"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${channel.tone}`}>
                      <channel.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{channel.name}</span>
                  </div>
                  <Badge
                    variant={
                      channel.status === "Connected"
                        ? "success"
                        : channel.status === "Needs reconnect"
                          ? "danger"
                          : channel.status === "Not connected"
                            ? "outline"
                            : "outline"
                    }
                    className="rounded-md px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                  >
                    {channel.status === "Export mode" ? "Export" : channel.status}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-secondary-container/18 p-4">
              <p className="text-xs italic text-secondary">AI Insight</p>
              <p className="mt-1 text-xs leading-6 text-on-surface-variant">
                2 channels recommended for your latest project.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#1c32df_0%,#3e51f7_100%)] p-10 text-white shadow-glow sm:p-12">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(84,248,215,0.18),transparent_60%)]" />
          <div className="relative max-w-2xl">
            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
              Action Required
            </span>
            <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-[-0.04em]">
              Complete your first case study to unlock the full portfolio analytics.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/78">
              Detailed case studies receive 4.5x more engagement from high-tier recruiters and
              clients.
            </p>
            <Link
              href="/dashboard/projects"
              className={buttonStyles({
                variant: "secondary",
                className: "mt-8 bg-white text-primary hover:bg-surface-container-low"
              })}
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-surface-container-low">
          <CardHeader>
            <CardTitle>Ready to publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {publishProjects.slice(0, 2).map((project, index) => (
              <div
                key={project.id}
                className="flex items-center gap-4 rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-panel"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface">
                  {index === 0 ? (
                    <Share2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Video className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">{project.title}</p>
                  <p className="text-[11px] font-medium text-on-surface-variant">
                    {project.status} • {project.lastGenerated}
                  </p>
                </div>
              </div>
            ))}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-dashed border-outline-variant/40 bg-white/50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline">
                  Scheduled Posts
                </p>
                <p className="mt-2 text-2xl font-display font-extrabold text-on-surface">14</p>
              </div>
              <div className="rounded-[1.5rem] border border-dashed border-outline-variant/40 bg-white/50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline">
                  Exported Posts
                </p>
                <p className="mt-2 text-2xl font-display font-extrabold text-on-surface">128</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Unanswered reviews</CardTitle>
              <CardDescription>4 new messages from potential clients</CardDescription>
            </div>
            <button className="rounded-xl p-2 text-outline hover:bg-surface-container-low">
              <Sparkles className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReviews.length > 0 ? (
              pendingReviews.slice(0, 2).map((review) => (
                <div
                  key={review.id}
                  className="rounded-[1.5rem] p-4 transition hover:bg-surface-container-low"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-primary">
                      {review.client
                        .split(" ")
                        .slice(0, 2)
                        .map((part: string) => part[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-on-surface">{review.client}</h4>
                        <span className="text-[11px] text-on-surface-variant">{review.submittedAt}</span>
                      </div>
                      <p className="mt-2 text-xs italic leading-6 text-on-surface-variant">
                        &quot;{review.content}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-on-surface-variant">
                <p>No pending reviews. Import reviews to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
