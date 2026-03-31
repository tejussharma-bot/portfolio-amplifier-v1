"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import {
  Loader2,
  MessageSquareQuote,
  Minus,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  approveReviewDraft,
  fetchReviews,
  generateReviewDraft
} from "@/lib/api";
import {
  projects,
  reviews as seedReviews,
  type ReviewSentiment
} from "@/lib/data";
import { normalizeReviewRow } from "@/lib/view-models";

const sentimentOrder: Array<ReviewSentiment | "all"> = ["all", "positive", "neutral", "negative"];

export default function ReviewsPage() {
  const { token, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<ReviewSentiment | "all">("all");
  const [query, setQuery] = useState("");
  const [reviews, setReviews] = useState(seedReviews);
  const [selectedId, setSelectedId] = useState(seedReviews[0]?.id ?? "");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      if (!token || !isAuthenticated) {
        return;
      }

      try {
        const result = await fetchReviews(token);

        if (!active) {
          return;
        }

        const nextReviews = result.reviews.map((review) => normalizeReviewRow(review));
        setReviews(nextReviews);
        setSelectedId(nextReviews[0]?.id ?? "");
      } catch (error) {
        if (!active) {
          return;
        }
      }
    }

    void loadReviews();

    return () => {
      active = false;
    };
  }, [isAuthenticated, token]);

  const stats = {
    positive: reviews.filter((review) => review.sentiment === "positive").length,
    neutral: reviews.filter((review) => review.sentiment === "neutral").length,
    negative: reviews.filter((review) => review.sentiment === "negative").length,
    pending: reviews.filter((review) => !review.response).length
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesFilter = filter === "all" || review.sentiment === filter;
    const projectTitle = projects.find((project) => project.id === review.projectId)?.title ?? "";
    const matchesQuery =
      !deferredQuery ||
      review.client.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      projectTitle.toLowerCase().includes(deferredQuery.toLowerCase());

    return matchesFilter && matchesQuery;
  });

  const selectedReview =
    reviews.find((review) => review.id === selectedId) ?? filteredReviews[0] ?? reviews[0];

  async function handleGenerate(reviewId: string, tone = "professional") {
    setGeneratingId(reviewId);

    if (!token || !isAuthenticated) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                response:
                  review.sentiment === "negative"
                    ? "Thank you for the honest feedback. We take the timing issue seriously and should have created more visibility sooner."
                    : review.sentiment === "neutral"
                      ? "Thank you for the thoughtful feedback. We are already tightening milestone visibility so the process feels as strong as the outcome."
                      : "Thank you for sharing this. It means a lot that the work translated into a meaningful business result."
              }
            : review
        )
      );
      setSelectedId(reviewId);
      setGeneratingId(null);
      return;
    }

    try {
      const result = await generateReviewDraft(token, reviewId, tone);
      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                response: result.draft
              }
            : review
        )
      );
      setSelectedId(reviewId);
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleApprove(reviewId: string) {
    const review = reviews.find((item) => item.id === reviewId);

    if (!review?.response) {
      return;
    }

    setSavingId(reviewId);

    if (!token || !isAuthenticated) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSavingId(null);
      return;
    }

    try {
      await approveReviewDraft(token, reviewId, review.response);
    } finally {
      setSavingId(null);
    }
  }

  function updateSelectedResponse(value: string) {
    if (!selectedReview) {
      return;
    }

    setReviews((current) =>
      current.map((review) =>
        review.id === selectedReview.id
          ? {
              ...review,
              response: value
            }
          : review
      )
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ORM Lite"
        title="Stay close to reputation signals before they compound"
        description="Manual ingest, sentiment classification, and AI-assisted draft responses all live in one place, with approval still centered on the user."
        badge={isAuthenticated ? "live workspace" : "demo mode"}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Positive",
            value: stats.positive,
            icon: ThumbsUp,
            tone: "bg-tide-50 text-tide-700"
          },
          {
            label: "Neutral",
            value: stats.neutral,
            icon: Minus,
            tone: "bg-sand-50 text-sand-700"
          },
          {
            label: "Negative",
            value: stats.negative,
            icon: ThumbsDown,
            tone: "bg-coral-50 text-coral-700"
          },
          {
            label: "Pending responses",
            value: stats.pending,
            icon: MessageSquareQuote,
            tone: "bg-ink-50 text-ink-700"
          }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-3 font-display text-3xl font-semibold">{stat.value}</p>
                </div>
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Review inbox</CardTitle>
                <CardDescription>
                  Search by client, project, or review content and slice the inbox by sentiment.
                </CardDescription>
              </div>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the inbox"
                className="lg:max-w-xs"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {sentimentOrder.map((option) => (
                <button
                  key={option}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filter === option
                      ? "bg-ink-900 text-white"
                      : "border border-border bg-white/80 text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => startTransition(() => setFilter(option))}
                >
                  {option === "all" ? "All" : option}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredReviews.map((review) => {
              const relatedProject = projects.find((project) => project.id === review.projectId);

              return (
                <button
                  key={review.id}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    selectedReview?.id === review.id
                      ? "border-tide-300 bg-tide-50/70"
                      : "border-border bg-white/75 hover:-translate-y-0.5 hover:shadow-panel"
                  }`}
                  onClick={() => setSelectedId(review.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-semibold">{review.client}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{relatedProject?.title || "Project"}</p>
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
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{review.content}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{review.source}</Badge>
                    <Badge variant="outline">{review.submittedAt}</Badge>
                    <Badge variant="outline">{review.rating}/5</Badge>
                  </div>
                  {!review.response ? (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleGenerate(review.id);
                      }}
                    >
                      {generatingId === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {generatingId === review.id ? "Generating..." : "Generate response"}
                    </Button>
                  ) : (
                    <div className="mt-4 rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground">
                      Draft response ready for approval.
                    </div>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Response workspace</CardTitle>
                <CardDescription>
                  AI generates the draft, but the user stays in control before anything is saved.
                </CardDescription>
              </div>
              <Badge variant={selectedReview?.response ? "success" : "warning"}>
                {selectedReview?.response ? "Draft ready" : "Needs generation"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedReview ? (
              <>
                <div className="rounded-3xl bg-muted/70 p-5">
                  <p className="kicker">Selected review</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">{selectedReview.content}</p>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Draft response</label>
                  <Textarea
                    value={selectedReview.response ?? ""}
                    onChange={(event) => updateSelectedResponse(event.target.value)}
                    placeholder="Generate a response to start editing."
                    className="min-h-[260px]"
                  />
                </div>

                <div className="rounded-3xl border border-border bg-white/85 p-5">
                  <p className="kicker">Approval rule</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Responses are never auto-saved as final without an explicit user approval step.
                    This keeps ORM Lite helpful without becoming risky.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {!selectedReview.response ? (
                    <Button className="flex-1" onClick={() => void handleGenerate(selectedReview.id)}>
                      {generatingId === selectedReview.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Generate response
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => void handleGenerate(selectedReview.id, "premium")}>
                        <Sparkles className="h-4 w-4" />
                        Regenerate tone
                      </Button>
                      <Button className="flex-1" onClick={() => void handleApprove(selectedReview.id)}>
                        {savingId === selectedReview.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Save approved draft
                      </Button>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "Top praise themes",
            items: ["Strategic clarity", "Business impact", "Strong final craft"]
          },
          {
            title: "Recurring complaints",
            items: ["Need tighter milestone visibility", "More proactive progress updates", "Earlier risk flagging"]
          },
          {
            title: "Suggested improvements",
            items: ["Add a weekly progress digest", "Surface delivery risk sooner", "Save approved tone presets by client type"]
          }
        ].map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
              <CardDescription>
                Pattern-level ORM insight keeps the feature useful without pretending to be a full internet-wide reputation suite.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.items.map((item) => (
                <div key={item} className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
