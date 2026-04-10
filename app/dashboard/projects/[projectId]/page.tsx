"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Download,
  Loader2,
  Save,
  Sparkles,
  SwatchBook
} from "lucide-react";

import { CaseStudyPreview } from "@/components/dashboard/case-study-preview";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchProjectDetail, generateText, savePortfolio, updateProject } from "@/lib/api";
import {
  buildCaseStudyWorkspace,
  caseStudyThemes,
  getCaseStudyTheme,
  serializeCaseStudyContent,
  type CaseStudyWorkspace,
  type ConversationMessage
} from "@/lib/case-study";
import { projects as seedProjects } from "@/lib/data";
import { cn } from "@/lib/utils";
import { normalizeProjectDetail } from "@/lib/view-models";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function parseCommaList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

function parseRefinementJson(text: string) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as {
      assistantMessage?: string;
      heroSummary?: string;
      challenge?: string;
      solution?: string;
      results?: string;
      testimonial?: string;
      deliverables?: string[];
      proofPoints?: string[];
      tags?: string[];
    };
  } catch (_error) {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)```/i);

    if (!fenced) {
      return null;
    }

    try {
      return JSON.parse(fenced[1]);
    } catch (_innerError) {
      return null;
    }
  }
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId || "";
  const previewRef = useRef<HTMLDivElement | null>(null);
  const chatScrollerRef = useRef<HTMLDivElement | null>(null);
  const { token, isAuthenticated } = useAuth();
  const [detail, setDetail] = useState<any>(null);
  const [workspace, setWorkspace] = useState<CaseStudyWorkspace | null>(null);
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"png" | "jpg" | "pdf" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [composerInput, setComposerInput] = useState("");
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      if (!projectId) {
        return;
      }

      if (!token || !isAuthenticated) {
        const fallback = seedProjects.find((project) => project.id === projectId) || seedProjects[0];
        if (!active || !fallback) {
          return;
        }

        setDetail(fallback);
        setWorkspace(buildCaseStudyWorkspace(fallback));
        return;
      }

      const result = await fetchProjectDetail(token, projectId);

      if (!active) {
        return;
      }

      const normalized = normalizeProjectDetail(result);
      setDetail(normalized);
      setWorkspace(buildCaseStudyWorkspace(normalized));
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [isAuthenticated, projectId, token]);

  useEffect(() => {
    if (!chatScrollerRef.current) {
      return;
    }

    chatScrollerRef.current.scrollTop = chatScrollerRef.current.scrollHeight;
  }, [workspace?.messages]);

  async function persistWorkspace(nextWorkspace: CaseStudyWorkspace) {
    if (!detail || !token || !isAuthenticated) {
      return;
    }

    const contentJson = serializeCaseStudyContent(detail.portfolioContent, nextWorkspace);

    await Promise.all([
      updateProject(token, projectId, {
        title: nextWorkspace.document.title,
        client_name: nextWorkspace.document.clientName,
        category: nextWorkspace.document.category,
        industry: nextWorkspace.document.industry,
        timeline: nextWorkspace.document.timeline,
        source_url: nextWorkspace.document.sourceUrl,
        challenge: nextWorkspace.document.challenge,
        solution: nextWorkspace.document.solution,
        results: nextWorkspace.document.results,
        deliverables: nextWorkspace.document.deliverables,
        testimonials: [nextWorkspace.document.testimonial]
      }),
      savePortfolio(token, projectId, {
        contentJson,
        isPublished: detail.rawStatus === "published"
      })
    ]);

    setDetail((current: any) =>
      current
        ? {
            ...current,
            portfolioContent: contentJson,
            rawStatus: current.rawStatus === "published" ? "published" : "ready",
            status: current.rawStatus === "published" ? current.status : "Ready to amplify"
          }
        : current
    );
  }

  async function handleSaveDraft() {
    if (!workspace || !detail || !token || !isAuthenticated) {
      setFeedback("Sign in to save live draft updates.");
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await persistWorkspace(workspace);
      setFeedback("Draft saved. The preview, theme, and conversation are now synced.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to save draft");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefine(instruction: string) {
    if (!workspace) {
      return;
    }

    const userMessage: ConversationMessage = {
      id: makeId(),
      role: "user",
      content: instruction
    };

    setFeedback(null);
    setRefining(true);
    setWorkspace((current) =>
      current
        ? {
            ...current,
            messages: [...current.messages, userMessage]
          }
        : current
    );

    try {
      if (!token || !isAuthenticated) {
        setWorkspace((current) =>
          current
            ? {
                ...current,
                messages: [
                  ...current.messages,
                  {
                    id: makeId(),
                    role: "assistant",
                    content: "Sign in to let AI rewrite the case study. The local draft is still editable and exportable."
                  }
                ]
              }
            : current
        );
        return;
      }

      const result = await generateText(token, {
        systemPrompt:
          "You refine a structured case study. Return strict JSON only with optional keys: assistantMessage, heroSummary, challenge, solution, results, testimonial, deliverables, proofPoints, tags. Arrays must stay arrays of strings. Only include keys you want to change.",
        userPrompt: `Refine this saved case study.

Instruction: ${instruction}
Title: ${workspace.document.title}
Client: ${workspace.document.clientName}
Category: ${workspace.document.category}
Industry: ${workspace.document.industry}
Timeline: ${workspace.document.timeline}
Source URL: ${workspace.document.sourceUrl}
Hero summary: ${workspace.document.heroSummary}
Challenge: ${workspace.document.challenge}
Solution: ${workspace.document.solution}
Results: ${workspace.document.results}
Testimonial: ${workspace.document.testimonial}
Deliverables: ${workspace.document.deliverables.join(", ")}
Proof points: ${workspace.document.proofPoints.join(" | ")}
Tags: ${workspace.document.tags.join(", ")}
Theme: ${workspace.themeId}`,
        options: {
          temperature: 0.62,
          maxTokens: 460
        }
      });

      const parsed = parseRefinementJson(result.text);

      if (!parsed) {
        throw new Error("AI refinement did not return the expected JSON shape.");
      }

      setWorkspace((current) =>
        current
          ? {
              ...current,
              document: {
                ...current.document,
                heroSummary: parsed.heroSummary || current.document.heroSummary,
                challenge: parsed.challenge || current.document.challenge,
                solution: parsed.solution || current.document.solution,
                results: parsed.results || current.document.results,
                testimonial: parsed.testimonial || current.document.testimonial,
                deliverables:
                  Array.isArray(parsed.deliverables) && parsed.deliverables.length
                    ? parsed.deliverables
                    : current.document.deliverables,
                proofPoints:
                  Array.isArray(parsed.proofPoints) && parsed.proofPoints.length
                    ? parsed.proofPoints
                    : current.document.proofPoints,
                tags:
                  Array.isArray(parsed.tags) && parsed.tags.length
                    ? parsed.tags
                    : current.document.tags
              },
              messages: [
                ...current.messages,
                {
                  id: makeId(),
                  role: "assistant",
                  content:
                    parsed.assistantMessage ||
                    "I refined the saved case study and refreshed the preview."
                }
              ]
            }
          : current
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to refine the case study");
    } finally {
      setRefining(false);
    }
  }

  async function handleExport(format: "png" | "jpg" | "pdf") {
    if (!workspace || !previewRef.current) {
      return;
    }

    setExportingFormat(format);
    setFeedback(null);

    try {
      const fileBaseName = slugify(workspace.document.title || "case-study");
      const fileName = `${fileBaseName}.${format}`;
      const { toJpeg, toPng } = await import("html-to-image");
      const pixelRatio = 2;

      if (format === "png") {
        const dataUrl = await toPng(previewRef.current, {
          cacheBust: true,
          pixelRatio,
          backgroundColor: "#f7f9fb"
        });
        downloadDataUrl(dataUrl, fileName);
      } else if (format === "jpg") {
        const dataUrl = await toJpeg(previewRef.current, {
          cacheBust: true,
          pixelRatio,
          backgroundColor: "#f7f9fb",
          quality: 0.96
        });
        downloadDataUrl(dataUrl, fileName);
      } else {
        const { jsPDF } = await import("jspdf");
        const dataUrl = await toPng(previewRef.current, {
          cacheBust: true,
          pixelRatio,
          backgroundColor: "#f7f9fb"
        });
        const width = previewRef.current.scrollWidth;
        const height = previewRef.current.scrollHeight;
        const pdf = new jsPDF({
          orientation: width > height ? "landscape" : "portrait",
          unit: "px",
          format: [width, height]
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
        pdf.save(fileName);
      }

      const exportRecord = {
        format,
        createdAt: new Date().toISOString(),
        fileName
      };

      const nextWorkspace = {
        ...workspace,
        exportHistory: [exportRecord, ...workspace.exportHistory].slice(0, 6)
      };
      setWorkspace(nextWorkspace);

      if (token && isAuthenticated && detail) {
        await persistWorkspace(nextWorkspace);
      }

      setFeedback(`${format.toUpperCase()} export prepared.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExportingFormat(null);
    }
  }

  if (!detail || !workspace) {
    return null;
  }

  const currentTheme = getCaseStudyTheme(workspace.themeId);
  const quickActions = [
    "Tighten the hero summary",
    "Make the results feel more credible",
    "Bring the challenge higher in the story",
    "Shorten the copy for scannability"
  ];

  return (
    <div className="-mx-4 -mb-12 -mt-8 h-[calc(100vh-4rem)] overflow-hidden sm:-mx-6 lg:-mx-8">
      <div className="grid h-full bg-background xl:grid-cols-[minmax(360px,460px)_minmax(0,1fr)]">
        <section className="relative flex min-h-0 flex-col border-r border-outline-variant/12 bg-surface-container-lowest">
          <div className="border-b border-outline-variant/12 px-5 py-5 md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Content Studio</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em] text-on-surface">
                  {workspace.document.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                  Refine the saved case study through chat on the left and keep the rendered preview on the right. Export here first, then move into Publish Studio when the story is ready to be rephrased.
                </p>
              </div>
              <Badge variant="outline">{detail.status || workspace.publishReadiness}</Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{workspace.document.clientName || "Client pending"}</Badge>
              <Badge variant="outline">{currentTheme.name}</Badge>
              <Badge variant="outline">{workspace.assets.length} assets</Badge>
              <Badge variant="outline">{workspace.document.tags.length} tags</Badge>
            </div>
          </div>

          {feedback ? (
            <div className="mx-5 mt-5 rounded-[1.7rem] bg-surface-container-low px-4 py-3 text-sm leading-7 text-on-surface-variant md:mx-7">
              {feedback}
            </div>
          ) : null}

          <div ref={chatScrollerRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-60 pt-5 md:px-7">
            <div className="space-y-5">
              {workspace.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[88%] rounded-[2rem] px-5 py-4 text-[15px] leading-8 shadow-[0_18px_38px_rgba(15,23,42,0.04)]",
                    message.role === "assistant"
                      ? "bg-white text-on-surface"
                      : "ml-auto rounded-[1.8rem] bg-pulse-primary text-white"
                  )}
                >
                  {message.content}
                </div>
              ))}

              {refining ? (
                <div className="flex max-w-[88%] items-center gap-3 rounded-[2rem] bg-white px-5 py-4 text-sm text-on-surface-variant shadow-[0_18px_38px_rgba(15,23,42,0.04)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refining the saved case study and refreshing the preview.
                </div>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 border-t border-outline-variant/12 bg-surface-container-lowest/94 px-5 pb-6 pt-5 backdrop-blur-xl md:px-7">
            <div className="mb-4 flex flex-wrap gap-2">
              {quickActions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                  onClick={() => void handleRefine(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="rounded-[2rem] border border-outline-variant/18 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <Textarea
                value={composerInput}
                onChange={(event) => setComposerInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || event.shiftKey) {
                    return;
                  }

                  event.preventDefault();

                  if (!composerInput.trim()) {
                    return;
                  }

                  void handleRefine(composerInput.trim());
                  setComposerInput("");
                }}
                placeholder="Tell AI what to improve in the case study"
                className="min-h-[88px] resize-none border-0 bg-transparent px-0 py-0 text-base focus:border-0 focus:bg-transparent"
              />

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className={buttonStyles({ variant: "outline", size: "sm", className: "rounded-full" })}
                    onClick={() => setShowThemes((current) => !current)}
                  >
                    <SwatchBook className="h-4 w-4" />
                    {showThemes ? "Hide templates" : "Change templates"}
                  </button>
                  <p className="text-xs text-on-surface-variant">Shift + Enter for a new line</p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={handleSaveDraft}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save as draft
                  </Button>
                  <button
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-pulse-primary text-white shadow-glow"
                    onClick={() => {
                      if (!composerInput.trim()) {
                        return;
                      }

                      void handleRefine(composerInput.trim());
                      setComposerInput("");
                    }}
                    disabled={!composerInput.trim() || refining}
                  >
                    {refining ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative hidden min-h-0 flex-col bg-background xl:flex">
          <div className="border-b border-outline-variant/12 px-6 py-5 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Case Study Preview</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em] text-on-surface">
                  Saved case study, live template changes
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                  The preview reflects the saved case-study JSON. Changing templates does not discard project data, and exports come directly from this rendered surface.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-full" onClick={() => setShowThemes((current) => !current)}>
                  <SwatchBook className="h-4 w-4" />
                  Change templates
                </Button>
                <Button variant="outline" className="rounded-full" onClick={handleSaveDraft} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save as draft
                </Button>
                <Link
                  href={`/dashboard/publish-studio?project=${projectId}`}
                  className={buttonStyles({ size: "md", className: "rounded-full" })}
                >
                  Publish
                </Link>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
            <div className="space-y-5">
              {showThemes ? (
                <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Template Selection</p>
                      <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                        Swap presentation layers without losing the case-study narrative, messages, assets, or export history.
                      </p>
                    </div>
                    <Badge variant="outline">{currentTheme.name}</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {caseStudyThemes.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() =>
                          setWorkspace((current) =>
                            current
                              ? {
                                  ...current,
                                  themeId: theme.id
                                }
                              : current
                          )
                        }
                        className={cn(
                          "rounded-[1.6rem] border p-3 text-left transition",
                          workspace.themeId === theme.id
                            ? "border-primary/30 bg-primary/5 shadow-panel"
                            : "border-outline-variant/16 bg-surface-container-lowest hover:bg-surface-container-low"
                        )}
                      >
                        <div className={cn("h-24 rounded-[1.1rem]", theme.heroClassName)} />
                        <p className="mt-3 text-sm font-semibold text-on-surface">{theme.name}</p>
                        <p className="mt-1 text-xs leading-5 text-on-surface-variant">{theme.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {(["png", "jpg", "pdf"] as const).map((format) => (
                  <Button
                    key={format}
                    variant="outline"
                    className="rounded-full"
                    onClick={() => void handleExport(format)}
                    disabled={exportingFormat !== null}
                  >
                    {exportingFormat === format ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export {format.toUpperCase()}
                  </Button>
                ))}
                <button
                  type="button"
                  className={buttonStyles({ variant: "ghost", size: "sm", className: "rounded-full" })}
                  onClick={() => void handleRefine("Make the current case study preview feel more publish-ready without changing the core facts")}
                >
                  <Sparkles className="h-4 w-4" />
                  AI polish
                </button>
              </div>

              <div ref={previewRef}>
                <CaseStudyPreview workspace={workspace} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
