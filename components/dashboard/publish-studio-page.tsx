"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  CalendarClock,
  Copy,
  ExternalLink,
  Loader2,
  Send,
  Sparkles
} from "lucide-react";

import { PublishingSurfacePreview } from "@/components/dashboard/publishing-surface-preview";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  exportGeneratedDraft,
  fetchChannelStatus,
  fetchConnectUrl,
  fetchProjectDetail,
  fetchProjects,
  generateContent,
  generateText,
  publishGeneratedDraft,
  scheduleGeneratedDraft,
  updateGeneratedDraft
} from "@/lib/api";
import { buildCaseStudyWorkspace } from "@/lib/case-study";
import { projects as seedProjects } from "@/lib/data";
import {
  publishObjectives,
  voiceModes,
  type ChannelConnection,
  type PlatformId
} from "@/lib/workflow-data";
import {
  mergeChannelState,
  normalizeGeneratedDraft,
  normalizeProjectDetail,
  normalizeProjectRow
} from "@/lib/view-models";

type StudioProject = ReturnType<typeof normalizeProjectRow>;

interface StudioConversationMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildPublishIntro(projectTitle: string, platform: PlatformId) {
  const label =
    platform === "googlemybusiness"
      ? "Google Business"
      : platform.charAt(0).toUpperCase() + platform.slice(1);

  return `I pulled "${projectTitle}" into ${label} mode. Tell me what angle, tone, or audience shift you want and I’ll rephrase the draft for that platform.`;
}

function parseDraftJson(text: string) {
  try {
    return JSON.parse(text) as {
      headline?: string;
      body?: string;
      cta?: string;
      tags?: string[];
    };
  } catch (_error) {
    return null;
  }
}

export function PublishStudioPage({
  initialProjectId
}: {
  initialProjectId?: string;
}) {
  const { token, isAuthenticated } = useAuth();
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [projects, setProjects] = useState<StudioProject[]>(seedProjects as StudioProject[]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || String(seedProjects[0]?.id || ""));
  const [allowProjectSwitch, setAllowProjectSwitch] = useState(!initialProjectId);
  const [detail, setDetail] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [channels, setChannels] = useState(mergeChannelState([]));
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<PlatformId>("linkedin");
  const [objective, setObjective] = useState<(typeof publishObjectives)[number]>("Get clients");
  const [tone, setTone] = useState<(typeof voiceModes)[number]>("Professional");
  const [hook, setHook] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [conversation, setConversation] = useState<StudioConversationMessage[]>([]);
  const [composerInput, setComposerInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      if (!token || !isAuthenticated) {
        setProjects(seedProjects as StudioProject[]);
        setSelectedProjectId(initialProjectId || String(seedProjects[0]?.id || ""));
        return;
      }

      const [projectResult, channelResult] = await Promise.all([
        fetchProjects(token),
        fetchChannelStatus(token)
      ]);

      if (!active) {
        return;
      }

      const normalizedProjects = projectResult.projects.map((project) => normalizeProjectRow(project));
      setProjects(normalizedProjects);
      setChannels(mergeChannelState(channelResult.channels));

      if (initialProjectId && normalizedProjects.some((project) => project.id === initialProjectId)) {
        setSelectedProjectId(initialProjectId);
      } else if (normalizedProjects[0]) {
        setSelectedProjectId(normalizedProjects[0].id);
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, [initialProjectId, isAuthenticated, token]);

  useEffect(() => {
    setAllowProjectSwitch(!initialProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    let active = true;

    async function loadSelectedProject() {
      if (!selectedProjectId) {
        return;
      }

      if (!token || !isAuthenticated) {
        const fallback = seedProjects.find((project) => project.id === selectedProjectId) || seedProjects[0];
        if (!active || !fallback) {
          return;
        }

        setDetail(fallback);
        setWorkspace(buildCaseStudyWorkspace(fallback));
        setDrafts([]);
        setHook(fallback.title);
        return;
      }

      const result = await fetchProjectDetail(token, selectedProjectId);

      if (!active) {
        return;
      }

      const normalized = normalizeProjectDetail(result);
      setDetail(normalized);
      setWorkspace(buildCaseStudyWorkspace(normalized));
      const normalizedDrafts = (normalized.drafts || []).map((draft: any) => normalizeGeneratedDraft(draft));
      setDrafts(normalizedDrafts);
      setHook(normalizedDrafts.find((draft: any) => draft.id === selectedChannelId)?.headline || normalized.title);
    }

    void loadSelectedProject();

    return () => {
      active = false;
    };
  }, [isAuthenticated, selectedChannelId, selectedProjectId, token]);

  useEffect(() => {
    if (!workspace?.document?.title) {
      return;
    }

    setConversation([
      {
        id: makeId(),
        role: "assistant",
        content: buildPublishIntro(workspace.document.title, selectedChannelId)
      }
    ]);
  }, [selectedChannelId, workspace?.document?.title]);

  useEffect(() => {
    if (!scrollerRef.current) {
      return;
    }

    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [conversation]);

  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.id === selectedChannelId) || null,
    [drafts, selectedChannelId]
  );
  const selectedConnection = useMemo<ChannelConnection | undefined>(
    () => channels.find((channel) => channel.id === selectedChannelId),
    [channels, selectedChannelId]
  );
  const canScheduleDirect = selectedChannelId === "linkedin" || selectedChannelId === "googlemybusiness";
  const primaryAction = useMemo(() => {
    if (selectedChannelId === "linkedin") {
      if (selectedConnection?.status === "Needs reconnect") {
        return { label: "Reconnect LinkedIn", mode: "connect" as const };
      }

      if (selectedConnection?.canPublishDirect) {
        return { label: "Post on LinkedIn", mode: "publish" as const };
      }

      return { label: "Connect LinkedIn", mode: "connect" as const };
    }

    if (selectedChannelId === "googlemybusiness") {
      if (selectedConnection?.status === "Needs reconnect") {
        return { label: "Reconnect Google Business", mode: "connect" as const };
      }

      if (selectedConnection?.canPublishDirect) {
        return { label: "Post on Google Business", mode: "publish" as const };
      }

      return { label: "Connect Google Business", mode: "connect" as const };
    }

    if (selectedChannelId === "behance") {
      return { label: "Export for Behance", mode: "export" as const };
    }

    if (selectedConnection?.canPublishDirect) {
      return { label: "Post on Dribbble", mode: "publish" as const };
    }

    return { label: "Export for Dribbble", mode: "export" as const };
  }, [selectedChannelId, selectedConnection]);

  function updateDraftPatch(patch: Record<string, unknown>) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === selectedChannelId ? { ...draft, ...patch } : draft))
    );
  }

  async function persistSelectedDraft(nextDraft?: any) {
    const draftToPersist = nextDraft || selectedDraft;

    if (!draftToPersist?.recordId || !token || !isAuthenticated) {
      return draftToPersist;
    }

    const result = await updateGeneratedDraft(token, draftToPersist.recordId, {
      tone,
      objective,
      contentType: selectedChannelId === "behance" ? "case-study" : "post",
      draftData: {
        headline: draftToPersist.headline,
        body: draftToPersist.body,
        cta: draftToPersist.cta,
        tags: draftToPersist.tags
      }
    });

    const normalized = normalizeGeneratedDraft(result.draft);
    setDrafts((current) => current.map((draft) => (draft.id === normalized.id ? normalized : draft)));
    return normalized;
  }

  async function handleGenerateDraft() {
    if (!token || !isAuthenticated || !selectedProjectId) {
      setFeedback("Sign in to generate and save live publishing drafts.");
      return null;
    }

    setGenerating(true);
    setFeedback(null);

    try {
      const result = await generateContent(token, {
        projectId: selectedProjectId,
        platform: selectedChannelId,
        tone,
        objective,
        hookHint: hook,
        contentType: selectedChannelId === "behance" ? "case-study" : "post"
      });

      const normalized = normalizeGeneratedDraft(result);
      setDrafts((current) => {
        const others = current.filter((draft) => draft.id !== normalized.id);
        return [...others, normalized];
      });
      setHook(normalized.headline);
      setConversation((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: `Draft generated for ${normalized.label}. The preview now matches the publishing surface instead of the full case study.`
        }
      ]);
      setFeedback("Draft generated from the approved case study.");
      return normalized;
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to generate draft");
      return null;
    } finally {
      setGenerating(false);
    }
  }

  async function handleAIRefine(instruction: string) {
    if (!token || !isAuthenticated || !workspace) {
      setFeedback("Sign in to use AI rephrasing.");
      return;
    }

    setRefining(true);
    setFeedback(null);

    setConversation((current) => [
      ...current,
      {
        id: makeId(),
        role: "user",
        content: instruction
      }
    ]);

    try {
      let workingDraft = selectedDraft;

      if (!workingDraft) {
        workingDraft = await handleGenerateDraft();
      }

      if (!workingDraft) {
        return;
      }

      const result = await generateText(token, {
        systemPrompt:
          "You rewrite publishing drafts for a specific platform. Return strict JSON with headline, body, cta, and tags keys only.",
        userPrompt: `Rewrite this ${selectedChannelId} draft.

Instruction: ${instruction}
Objective: ${objective}
Tone: ${tone}
Hook: ${hook}
Project: ${workspace.document.title}
Client: ${workspace.document.clientName}
Source tags: ${workspace.document.tags.join(", ")}

Current draft:
Headline: ${workingDraft.headline}
Body: ${workingDraft.body}
CTA: ${workingDraft.cta}
Tags: ${workingDraft.tags.join(", ")}`,
        options: {
          temperature: 0.62,
          maxTokens: 420
        }
      });

      const parsed = parseDraftJson(result.text);

      if (!parsed) {
        throw new Error("AI response was not in the expected format.");
      }

      const nextDraft = {
        ...workingDraft,
        headline: parsed.headline || workingDraft.headline,
        body: parsed.body || workingDraft.body,
        cta: parsed.cta || workingDraft.cta,
        tags: Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags : workingDraft.tags
      };

      updateDraftPatch(nextDraft);
      setHook(nextDraft.headline);
      setConversation((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: `Rephrased the ${selectedChannelId === "googlemybusiness" ? "Google Business" : selectedChannelId} draft and updated the live preview.`
        }
      ]);
      setFeedback("Draft refined.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to refine draft");
    } finally {
      setRefining(false);
    }
  }

  async function handleConnectSelectedChannel() {
    if (!token || !isAuthenticated) {
      setFeedback("Sign in to connect a publishing channel.");
      return;
    }

    if (selectedChannelId !== "linkedin" && selectedChannelId !== "dribbble" && selectedChannelId !== "googlemybusiness") {
      return;
    }

    const returnTo = selectedProjectId
      ? `/dashboard/publish-studio?project=${selectedProjectId}`
      : "/dashboard/publish-studio";
    const result = await fetchConnectUrl(token, selectedChannelId, returnTo);
    window.location.href = result.url;
  }

  async function handlePublish() {
    if (!selectedDraft) {
      setFeedback("Generate a draft first.");
      return;
    }

    if (!token || !isAuthenticated) {
      setFeedback("Sign in to publish.");
      return;
    }

    if (
      (selectedChannelId === "linkedin" || selectedChannelId === "googlemybusiness") &&
      !selectedConnection?.canPublishDirect
    ) {
      await handleConnectSelectedChannel();
      return;
    }

    setPublishing(true);
    setFeedback(null);

    try {
      const persisted = await persistSelectedDraft();
      if (!persisted?.recordId) {
        throw new Error("Generate and save a draft before publishing.");
      }

      const result = await publishGeneratedDraft(token, persisted.recordId);
      const normalized = normalizeGeneratedDraft(result.draft);
      setDrafts((current) => current.map((draft) => (draft.id === normalized.id ? normalized : draft)));
      setConversation((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content:
            result.mode === "direct"
              ? `${normalized.label} published successfully.`
              : result.mode === "export"
                ? "Export-ready publishing pack prepared."
                : "Guided upload pack prepared."
        }
      ]);
      setFeedback(
        result.mode === "direct"
          ? `${normalized.label} published successfully.`
          : result.mode === "export"
            ? "Export-ready publishing pack prepared."
            : "Guided upload pack prepared."
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to publish draft");
    } finally {
      setPublishing(false);
    }
  }

  async function handleSchedule() {
    if (!selectedDraft || !token || !isAuthenticated) {
      setFeedback("Generate a draft first.");
      return;
    }

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(9, 30, 0, 0);
    const input = window.prompt(
      "Schedule for local time (YYYY-MM-DDTHH:mm)",
      tomorrow.toISOString().slice(0, 16)
    );

    if (!input) {
      return;
    }

    setScheduling(true);
    setFeedback(null);

    try {
      const persisted = await persistSelectedDraft();
      if (!persisted?.recordId) {
        throw new Error("Generate and save a draft first.");
      }

      const result = await scheduleGeneratedDraft(token, persisted.recordId, input);
      const normalized = normalizeGeneratedDraft(result.draft);
      setDrafts((current) => current.map((draft) => (draft.id === normalized.id ? normalized : draft)));
      setFeedback("Draft scheduled.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to schedule draft");
    } finally {
      setScheduling(false);
    }
  }

  async function handleExport() {
    if (!selectedDraft || !token || !isAuthenticated) {
      setFeedback("Generate a draft first.");
      return;
    }

    setExporting(true);
    setFeedback(null);

    try {
      const persisted = await persistSelectedDraft();
      if (!persisted?.recordId) {
        throw new Error("Generate and save a draft first.");
      }

      const result = await exportGeneratedDraft(token, persisted.recordId);
      await navigator.clipboard.writeText(JSON.stringify(result.exportPayload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      setFeedback("Export payload copied to clipboard.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to export draft");
    } finally {
      setExporting(false);
    }
  }

  async function handlePrimaryAction() {
    if (primaryAction.mode === "connect") {
      await handleConnectSelectedChannel();
      return;
    }

    if (primaryAction.mode === "export") {
      await handleExport();
      return;
    }

    await handlePublish();
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!composerInput.trim()) {
      return;
    }

    void handleAIRefine(composerInput.trim());
    setComposerInput("");
  }

  if (!workspace || !detail) {
    return null;
  }

  return (
    <div className="-mx-4 -mb-12 -mt-8 h-[calc(100vh-4rem)] overflow-hidden sm:-mx-6 lg:-mx-8">
      <div className="grid h-full bg-background xl:grid-cols-[minmax(380px,500px)_minmax(0,1fr)]">
        <section className="relative flex min-h-0 flex-col border-r border-outline-variant/12 bg-surface-container-lowest">
          <div className="border-b border-outline-variant/12 px-5 py-5 md:px-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Publish Studio</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em] text-on-surface">
                  Rephrase for publishing
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-on-surface-variant">
                  The case study is already built. This canvas only adapts it for LinkedIn, Behance, Dribbble, and Google in platform-native formats.
                </p>
              </div>

              {initialProjectId && !allowProjectSwitch && detail ? (
                <div className="rounded-[1.6rem] border border-outline-variant/18 bg-white px-4 py-3 text-sm shadow-panel">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">Selected case study</p>
                  <p className="mt-2 font-semibold text-on-surface">{detail.title}</p>
                  <button
                    className={buttonStyles({ variant: "outline", size: "sm", className: "mt-3 rounded-full" })}
                    onClick={() => setAllowProjectSwitch(true)}
                  >
                    Change case study
                  </button>
                </div>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="min-w-[220px] rounded-full border border-outline-variant/20 bg-white px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(["linkedin", "behance", "dribbble", "googlemybusiness"] as PlatformId[]).map((platform) => (
                <button
                  key={platform}
                  className={buttonStyles({
                    variant: selectedChannelId === platform ? "primary" : "outline",
                    size: "sm",
                    className: "rounded-full"
                  })}
                  onClick={() => setSelectedChannelId(platform)}
                >
                  {platform === "googlemybusiness" ? "Google" : platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {feedback ? (
            <div className="mx-5 mt-5 rounded-[1.7rem] bg-surface-container-low px-4 py-3 text-sm leading-7 text-on-surface-variant md:mx-7">
              {feedback}
            </div>
          ) : null}

          <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-64 pt-5 md:px-7">
            <div className="space-y-5">
              <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Source</p>
                <p className="mt-3 font-display text-2xl font-bold tracking-[-0.04em] text-on-surface">
                  {workspace.document.title}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">{workspace.document.clientName}</Badge>
                  <Badge variant="outline">{workspace.document.category}</Badge>
                  {workspace.document.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Objective</p>
                  <select
                    value={objective}
                    onChange={(event) => setObjective(event.target.value as (typeof publishObjectives)[number])}
                    className="mt-4 w-full rounded-[1.2rem] border border-outline-variant/18 bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                  >
                    {publishObjectives.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Tone</p>
                  <select
                    value={tone}
                    onChange={(event) => setTone(event.target.value as (typeof voiceModes)[number])}
                    className="mt-4 w-full rounded-[1.2rem] border border-outline-variant/18 bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                  >
                    {voiceModes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Hook</p>
                  <button
                    className={buttonStyles({ variant: "outline", size: "sm", className: "rounded-full" })}
                    onClick={() => void handleGenerateDraft()}
                    disabled={generating}
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate draft
                  </button>
                </div>
                <input
                  value={hook}
                  onChange={(event) => setHook(event.target.value)}
                  placeholder="Outcome-led opening hook"
                  className="mt-4 w-full rounded-[1.2rem] border border-outline-variant/18 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none"
                />
              </div>

              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "assistant"
                      ? "max-w-[88%] rounded-[2rem] bg-white px-5 py-4 text-[15px] leading-8 text-on-surface shadow-panel"
                      : "ml-auto max-w-[88%] rounded-[1.8rem] bg-pulse-primary px-5 py-4 text-[15px] leading-8 text-white"
                  }
                >
                  {message.content}
                </div>
              ))}

              {selectedDraft ? (
                <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Editable Draft</p>
                    <Badge variant="outline">{selectedDraft.label}</Badge>
                  </div>

                  <div className="mt-4 space-y-4">
                    <input
                      value={selectedDraft.headline}
                      onChange={(event) => updateDraftPatch({ headline: event.target.value })}
                      placeholder="Headline"
                      className="w-full rounded-[1.2rem] border border-outline-variant/18 bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                    />
                    <Textarea
                      value={selectedDraft.body}
                      onChange={(event) => updateDraftPatch({ body: event.target.value })}
                      placeholder="Body"
                      className="min-h-[180px] border border-outline-variant/18 bg-surface-container-low"
                    />
                    <input
                      value={selectedDraft.cta}
                      onChange={(event) => updateDraftPatch({ cta: event.target.value })}
                      placeholder="CTA"
                      className="w-full rounded-[1.2rem] border border-outline-variant/18 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 border-t border-outline-variant/12 bg-surface-container-lowest/94 px-5 pb-6 pt-5 backdrop-blur-xl md:px-7">
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                "Make it more credible",
                "Shorten for scannability",
                "Aim it at decision-makers",
                "Make the CTA softer"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                  onClick={() => void handleAIRefine(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="rounded-[2rem] border border-outline-variant/18 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <Textarea
                value={composerInput}
                onChange={(event) => setComposerInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Tell AI how to rephrase this draft for the selected platform"
                className="min-h-[88px] resize-none border-0 bg-transparent px-0 py-0 text-base focus:border-0 focus:bg-transparent"
              />

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    className={buttonStyles({ variant: "outline", size: "sm", className: "rounded-full" })}
                    onClick={() => navigator.clipboard.writeText(selectedDraft?.body || "")}
                    disabled={!selectedDraft?.body}
                  >
                    <Copy className="h-4 w-4" />
                    Copy body
                  </button>
                  <button
                    className={buttonStyles({ variant: "outline", size: "sm", className: "rounded-full" })}
                    onClick={handleExport}
                    disabled={exporting || !selectedDraft}
                  >
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    {copied ? "Copied export" : "Export"}
                  </button>
                </div>

                <button
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-pulse-primary text-white shadow-glow"
                  onClick={() => {
                    if (!composerInput.trim()) {
                      return;
                    }

                    void handleAIRefine(composerInput.trim());
                    setComposerInput("");
                  }}
                  disabled={!composerInput.trim() || refining}
                >
                  {refining ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="relative hidden min-h-0 flex-col bg-background xl:flex">
          <div className="border-b border-outline-variant/12 px-6 py-5 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Publishing Surface</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em] text-on-surface">
                  Bigger preview, smaller source footprint
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {canScheduleDirect ? (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={handleSchedule}
                    disabled={!selectedDraft || scheduling || !selectedConnection?.canPublishDirect}
                  >
                    {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                    Schedule later
                  </Button>
                ) : null}
                <Button
                  className="rounded-full"
                  onClick={handlePrimaryAction}
                  disabled={publishing || generating || refining || exporting}
                >
                  {publishing || exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : primaryAction.mode === "export" ? (
                    <ExternalLink className="h-4 w-4" />
                  ) : primaryAction.mode === "connect" ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {primaryAction.label}
                </Button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 p-6 md:p-8">
            <PublishingSurfacePreview
              platform={selectedChannelId}
              draft={selectedDraft}
              workspace={workspace}
              channel={selectedConnection}
              className="h-full"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
