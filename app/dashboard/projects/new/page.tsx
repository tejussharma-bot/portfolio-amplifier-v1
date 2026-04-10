"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Loader2,
  Paperclip,
  Sparkles
} from "lucide-react";

import { CaseStudyPreview } from "@/components/dashboard/case-study-preview";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createProject, generateText } from "@/lib/api";
import {
  buildSuggestedTags,
  caseStudyThemes,
  type AssetSource,
  type CaseStudyWorkspace,
  type ConversationMessage
} from "@/lib/case-study";
import { cn } from "@/lib/utils";

type StepKey =
  | "start"
  | "title"
  | "client_name"
  | "category"
  | "industry"
  | "timeline"
  | "source_url"
  | "challenge"
  | "solution"
  | "results"
  | "deliverables"
  | "testimonial"
  | "tags"
  | "asset_urls";

interface IntakeState {
  title: string;
  client_name: string;
  category: string;
  industry: string;
  timeline: string;
  source_url: string;
  challenge: string;
  solution: string;
  results: string;
  deliverables: string;
  testimonial: string;
  tags: string;
  asset_urls: string;
}

const initialState: IntakeState = {
  title: "",
  client_name: "",
  category: "",
  industry: "",
  timeline: "",
  source_url: "",
  challenge: "",
  solution: "",
  results: "",
  deliverables: "",
  testimonial: "",
  tags: "",
  asset_urls: ""
};

const intakeSteps: Array<{
  key: StepKey;
  prompt: string;
  placeholder: string;
  chips?: string[];
  autofill?: boolean;
}> = [
  {
    key: "start",
    prompt: "Hi, I’m Portfolio Amplifier. Tell me you want to build a case study and I’ll start shaping the story with you.",
    placeholder: "I want to create a case study",
    chips: ["I want to create a case study", "Help me start"]
  },
  {
    key: "title",
    prompt: "What should this case study be called?",
    placeholder: "Project title"
  },
  {
    key: "client_name",
    prompt: "Who was the client, brand, or product behind it?",
    placeholder: "Client or brand"
  },
  {
    key: "category",
    prompt: "What category best describes the work?",
    placeholder: "Category",
    chips: ["Branding", "UX/UI", "Web Design", "Product Design", "Marketing"]
  },
  {
    key: "industry",
    prompt: "What industry or space was this for?",
    placeholder: "Industry",
    chips: ["Luxury", "Technology", "Finance", "Healthcare", "Retail"]
  },
  {
    key: "timeline",
    prompt: "How long did the project run?",
    placeholder: "Timeline",
    chips: ["2 weeks", "1 month", "3 months", "6 months", "Ongoing"]
  },
  {
    key: "challenge",
    prompt: "What was the core challenge? Keep it rough if needed. I can sharpen it.",
    placeholder: "Describe the challenge",
    autofill: true
  },
  {
    key: "solution",
    prompt: "What did you actually do to solve it?",
    placeholder: "Describe the approach",
    autofill: true
  },
  {
    key: "results",
    prompt: "What changed because of the work? Metrics, perception, business outcome, anything useful.",
    placeholder: "Share the result",
    autofill: true
  },
  {
    key: "deliverables",
    prompt: "What should be listed as the main deliverables?",
    placeholder: "Brand strategy, landing page, campaign system",
    autofill: true
  },
  {
    key: "testimonial",
    prompt: "Do you have a testimonial or proof quote?",
    placeholder: "Paste the quote or say skip",
    autofill: true
  },
  {
    key: "tags",
    prompt: "What tags should travel with this story? For example: luxury, launch, editorial, fintech.",
    placeholder: "Add tags",
    chips: ["Luxury, editorial", "Launch, conversion", "UX, systems", "Brand, growth"],
    autofill: true
  },
  {
    key: "source_url",
    prompt: "Any link, deck, or live URL I should pull context from?",
    placeholder: "https://..."
  },
  {
    key: "asset_urls",
    prompt: "Upload files here or paste reference URLs. Mockups, decks, screenshots, and testimonials all help.",
    placeholder: "Paste asset URLs or attach files"
  }
];

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createMessage(
  role: ConversationMessage["role"],
  content: string,
  fieldKey?: StepKey
): ConversationMessage {
  return {
    id: makeId(),
    role,
    content,
    fieldKey
  };
}

function parseCommaList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAssetLinks(value: string) {
  return parseCommaList(value).map((url) => ({
    sourceType: "url" as const,
    url,
    label: url.replace(/^https?:\/\//, "")
  }));
}

function looksThin(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return ["skip", "n/a", "na", "none", "later"].includes(normalized) || normalized.length < 28;
}

function buildHeroSummary(intake: IntakeState) {
  if (intake.challenge && intake.results) {
    return `${intake.title || "This project"} reframed ${intake.challenge.toLowerCase()} into ${intake.results.toLowerCase()}.`;
  }

  if (intake.client_name && intake.category) {
    return `${intake.title || "This project"} is a ${intake.category.toLowerCase()} case study for ${intake.client_name}, built to turn raw project context into a polished narrative.`;
  }

  if (intake.category) {
    return `${intake.title || "Untitled case study"} is taking shape as a ${intake.category.toLowerCase()} story with live assets and guided AI writing.`;
  }

  return "Bring in rough project context, assets, and references. The preview updates as soon as the story starts to take shape.";
}

function buildProofPoints(intake: IntakeState) {
  const results = parseCommaList(intake.results);

  if (results.length) {
    return results.slice(0, 3);
  }

  const derived = [
    intake.timeline ? `Timeline: ${intake.timeline}` : "",
    intake.client_name ? `Client: ${intake.client_name}` : "",
    intake.category ? `Category: ${intake.category}` : ""
  ].filter(Boolean);

  return derived.length
    ? derived
    : [
        "Live preview appears as soon as the story begins.",
        "AI fills thin sections before the case study is generated.",
        "Assets and links stay attached to the draft."
      ];
}

export default function NewProjectPage() {
  const router = useRouter();
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const chatScrollerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { token, isAuthenticated } = useAuth();

  const [messages, setMessages] = useState<ConversationMessage[]>([
    createMessage("assistant", intakeSteps[0].prompt, "start")
  ]);
  const [intake, setIntake] = useState<IntakeState>(initialState);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [draftInput, setDraftInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [assetPreviews, setAssetPreviews] = useState<AssetSource[]>([]);
  const [themeId, setThemeId] = useState(caseStudyThemes[0].id);
  const [creating, setCreating] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentStep = intakeSteps[currentStepIndex];
  const hasConversationStarted = messages.some((message) => message.role === "user") || files.length > 0;
  const hasEnoughForTemplate = Boolean(
    intake.title &&
    (intake.client_name || intake.category || intake.challenge || intake.results || files.length)
  );
  const showPreviewPane = hasConversationStarted || creating;
  const canGenerate =
    Boolean(intake.title) &&
    Boolean(intake.client_name || intake.category || intake.challenge || files.length) &&
    Boolean(token && isAuthenticated) &&
    !creating;

  useEffect(() => {
    if (!chatScrollerRef.current) {
      return;
    }

    chatScrollerRef.current.scrollTop = chatScrollerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const nextAssets = files.map((file) => ({
      sourceType: "uploaded" as const,
      url: URL.createObjectURL(file),
      label: file.name,
      originalName: file.name,
      mimetype: file.type || null,
      size: file.size
    }));

    setAssetPreviews(nextAssets);

    return () => {
      nextAssets.forEach((asset) => URL.revokeObjectURL(asset.url));
    };
  }, [files]);

  const workingWorkspace = useMemo<CaseStudyWorkspace>(() => {
    const derivedTags = parseCommaList(intake.tags);
    const documentTags = derivedTags.length
      ? derivedTags
      : buildSuggestedTags({
          clientName: intake.client_name,
          category: intake.category,
          industry: intake.industry,
          timeline: intake.timeline
        });

    return {
      themeId,
      messages,
      assets: [...assetPreviews, ...parseAssetLinks(intake.asset_urls)],
      exportHistory: [],
      publishReadiness: creating ? "Generating" : hasConversationStarted ? "Structuring" : "Waiting for intake",
      document: {
        title: intake.title || "Untitled case study",
        clientName: intake.client_name || "Client pending",
        category: intake.category || "Case Study",
        industry: intake.industry || "",
        timeline: intake.timeline || "",
        tags: documentTags,
        sourceUrl: intake.source_url || "",
        heroSummary: buildHeroSummary(intake),
        challenge:
          intake.challenge ||
          "Share the challenge in your own words. If it is rough, AI will tighten the narrative before generation.",
        solution:
          intake.solution ||
          "Describe the approach, system, or strategic move that turned the challenge into a stronger outcome.",
        results:
          intake.results ||
          "Capture the strongest result, outcome, or proof point so the preview can anchor on something concrete.",
        deliverables: parseCommaList(intake.deliverables),
        testimonial:
          intake.testimonial ||
          "Add a quote, internal proof point, or short note from the client when you have it.",
        proofPoints: buildProofPoints(intake)
      }
    };
  }, [assetPreviews, creating, hasConversationStarted, intake, messages, themeId]);

  async function generateFieldDraft(stepKey: StepKey, nextState: IntakeState) {
    const fallback: Partial<Record<StepKey, string>> = {
      challenge: `The work needed a clearer story for ${nextState.client_name || "the client"} so the value of ${nextState.title || "the project"} felt immediate and credible.`,
      solution: `We structured the case study around the strongest assets, simplified the narrative, and framed the work as a polished outcome instead of a loose project archive.`,
      results: `The project became easier to understand, easier to share, and more credible for recruiters, collaborators, and clients reviewing the work.`,
      deliverables: "Case study strategy, hero narrative, polished preview, channel-ready publishing copy",
      testimonial: "The final case study made the work feel sharper, more premium, and much easier to publish confidently.",
      tags: [nextState.category, nextState.industry, "case study", "portfolio"]
        .filter(Boolean)
        .join(", ")
    };

    if (!token || !isAuthenticated) {
      return fallback[stepKey] || "";
    }

    const fieldLabel =
      stepKey === "deliverables"
        ? "a comma-separated deliverables line"
        : stepKey === "tags"
          ? "a comma-separated tags line"
          : stepKey === "testimonial"
            ? "a short proof quote"
            : stepKey;

    const result = await generateText(token, {
      systemPrompt:
        "You help convert partial project intake into polished case-study writing. Return only the requested field with no markdown, no bullets unless comma-separated was requested, and no explanation.",
      userPrompt: `Write ${fieldLabel} for this case study.

Title: ${nextState.title}
Client: ${nextState.client_name}
Category: ${nextState.category}
Industry: ${nextState.industry}
Timeline: ${nextState.timeline}
Source URL: ${nextState.source_url}
Challenge: ${nextState.challenge}
Solution: ${nextState.solution}
Results: ${nextState.results}
Deliverables: ${nextState.deliverables}
Testimonial: ${nextState.testimonial}
Tags: ${nextState.tags}`,
      options: {
        temperature: 0.65,
        maxTokens: stepKey === "deliverables" || stepKey === "tags" ? 120 : 220
      }
    });

    return result.text.trim() || fallback[stepKey] || "";
  }

  async function maybeAutofill(stepKey: StepKey, nextState: IntakeState) {
    if (!["challenge", "solution", "results", "deliverables", "testimonial", "tags"].includes(stepKey)) {
      return { nextState, assistantMessages: [] as ConversationMessage[] };
    }

    const field = stepKey as keyof IntakeState;
    const currentValue = nextState[field];

    if (!looksThin(currentValue)) {
      return { nextState, assistantMessages: [] as ConversationMessage[] };
    }

    setAutofilling(true);

    try {
      const generated = await generateFieldDraft(stepKey, nextState);
      const mergedState = {
        ...nextState,
        [field]: generated
      };

      return {
        nextState: mergedState,
        assistantMessages: [
          createMessage(
            "assistant",
            stepKey === "tags"
              ? `I drafted the tags as ${generated}. You can overwrite them or keep going.`
              : `I tightened the ${stepKey.replace(/_/g, " ")} based on what you shared so the preview has stronger copy.`,
            stepKey
          )
        ]
      };
    } finally {
      setAutofilling(false);
    }
  }

  function pushMessages(nextMessages: ConversationMessage[]) {
    setMessages((current) => [...current, ...nextMessages]);
  }

  async function advanceConversation(rawAnswer: string) {
    const answer = rawAnswer.trim();

    if (!currentStep || (!answer && currentStep.key !== "asset_urls")) {
      return;
    }

    setFeedback(null);
    setDraftInput("");

    const nextMessages: ConversationMessage[] = [
      createMessage("user", answer || "Using attached files", currentStep.key)
    ];

    if (currentStep.key === "start") {
      const nextIndex = 1;
      setCurrentStepIndex(nextIndex);
      pushMessages([
        ...nextMessages,
        createMessage("assistant", intakeSteps[nextIndex].prompt, intakeSteps[nextIndex].key)
      ]);
      return;
    }

    let nextState: IntakeState = {
      ...intake,
      [currentStep.key]: answer
    };

    if (currentStep.key === "asset_urls" && files.length && !answer) {
      nextMessages[0].content = `Attached ${files.length} file${files.length === 1 ? "" : "s"}`;
    }

    const capturedMessages: ConversationMessage[] = [];

    if (currentStep.key === "deliverables") {
      const deliverables = parseCommaList(answer);
      nextState.deliverables = deliverables.join(", ");
      if (deliverables.length) {
        capturedMessages.push(
          createMessage("assistant", `Captured deliverables: ${deliverables.join(", ")}.`, "deliverables")
        );
      }
    }

    if (currentStep.key === "tags") {
      const tags = parseCommaList(answer);
      nextState.tags = tags.join(", ");
      if (tags.length) {
        capturedMessages.push(
          createMessage("assistant", `Captured tags: ${tags.join(", ")}.`, "tags")
        );
      }
    }

    const { nextState: completedState, assistantMessages } = await maybeAutofill(currentStep.key, nextState);
    nextState = completedState;
    setIntake(nextState);

    const nextIndex = currentStepIndex + 1;
    const promptMessage =
      intakeSteps[nextIndex]
        ? [createMessage("assistant", intakeSteps[nextIndex].prompt, intakeSteps[nextIndex].key)]
        : [
            createMessage(
              "assistant",
              "The core story is captured. Add more context, attach more assets, or ask me to generate the case study now."
            )
          ];

    setCurrentStepIndex(nextIndex);
    pushMessages([...nextMessages, ...capturedMessages, ...assistantMessages, ...promptMessage]);
  }

  async function handleGenerate() {
    if (!token || !isAuthenticated) {
      setFeedback("Sign in to generate and save the case study to your workspace.");
      return;
    }

    if (!intake.title.trim()) {
      setFeedback("Give the project a title first so the case study has an anchor.");
      return;
    }

    setCreating(true);
    setFeedback(null);

    const nextMessages: ConversationMessage[] = [];
    let nextState = { ...intake };

    try {
      for (const stepKey of ["challenge", "solution", "results", "deliverables", "testimonial", "tags"] as StepKey[]) {
        const field = stepKey as keyof IntakeState;

        if (!looksThin(nextState[field])) {
          continue;
        }

        const generated = await generateFieldDraft(stepKey, nextState);

        if (!generated) {
          continue;
        }

        nextState = {
          ...nextState,
          [field]: generated
        };

        nextMessages.push(
          createMessage(
            "assistant",
            stepKey === "tags"
              ? `I added tags for publishing context: ${generated}.`
              : `I drafted the ${stepKey.replace(/_/g, " ")} so the case study can generate cleanly.`,
            stepKey
          )
        );
      }

      setIntake(nextState);

      const conversationMessages = [...messages, ...nextMessages];
      if (nextMessages.length) {
        pushMessages(nextMessages);
      }

      const formData = new FormData();
      formData.append("title", nextState.title);
      formData.append("client_name", nextState.client_name || "Confidential client");
      formData.append("category", nextState.category || "Case Study");
      formData.append("industry", nextState.industry);
      formData.append("timeline", nextState.timeline);
      formData.append("source_url", nextState.source_url);
      formData.append("challenge", nextState.challenge);
      formData.append("solution", nextState.solution);
      formData.append("results", nextState.results);
      formData.append("deliverables", JSON.stringify(parseCommaList(nextState.deliverables)));
      formData.append(
        "testimonials",
        JSON.stringify(nextState.testimonial ? [nextState.testimonial] : [])
      );
      formData.append("asset_references", JSON.stringify(parseAssetLinks(nextState.asset_urls)));
      formData.append("conversation_messages", JSON.stringify(conversationMessages));
      formData.append("theme_id", themeId);
      formData.append("tags", JSON.stringify(parseCommaList(nextState.tags)));
      files.forEach((file) => formData.append("assets", file));

      const created = await createProject(token, formData);
      router.push(`/dashboard/projects/${created.project.id}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to generate the case study");
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void advanceConversation(draftInput);
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    setFiles((current) => [...current, ...selectedFiles].slice(0, 10));
    pushMessages([
      createMessage(
        "assistant",
        `Attached ${selectedFiles.length} asset${selectedFiles.length === 1 ? "" : "s"}. I’ll use them to ground the preview and the final case study.`,
        "asset_urls"
      )
    ]);
    event.target.value = "";
  }

  return (
    <div className="-mx-4 -mb-12 -mt-8 h-[calc(100vh-4rem)] overflow-hidden sm:-mx-6 lg:-mx-8">
      <div
        className={cn(
          "grid h-full bg-background",
          showPreviewPane
            ? "xl:grid-cols-[minmax(360px,460px)_minmax(0,1fr)]"
            : "xl:grid-cols-[minmax(0,1fr)]"
        )}
      >
        <section
          className={cn(
            "relative flex min-h-0 flex-col bg-surface-container-lowest",
            showPreviewPane && "border-r border-outline-variant/12"
          )}
        >
          <div className="border-b border-outline-variant/12 px-5 py-5 md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">AI Chat Canvas</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em] text-on-surface">
                  {intake.title || "New case study"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                  Start with project context, decks, screenshots, links, testimonials, and uploads. The preview wakes up after the conversation starts, then template selection unlocks inside the builder.
                </p>
              </div>
              <Badge variant="outline">
                {hasEnoughForTemplate ? "Templates unlocked" : "Capture the story first"}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{files.length} assets attached</Badge>
              <Badge variant="outline">
                {parseCommaList(intake.tags).length || workingWorkspace.document.tags.length} tags
              </Badge>
              <Badge variant="outline">
                {parseCommaList(intake.deliverables).length} deliverables
              </Badge>
            </div>
          </div>

          {feedback ? (
            <div className="mx-5 mt-5 rounded-[1.7rem] bg-coral-50 px-4 py-3 text-sm leading-7 text-coral-900 md:mx-7">
              {feedback}
            </div>
          ) : null}

          <div ref={chatScrollerRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-52 pt-5 md:px-7">
            <div className="space-y-5">
              {messages.map((message) => (
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

              {hasConversationStarted && !hasEnoughForTemplate ? (
                <div className="flex max-w-[88%] items-center gap-3 rounded-[2rem] bg-surface-container-low px-5 py-4 text-sm leading-7 text-on-surface-variant">
                  Add a title plus one strong anchor like client, category, challenge, results, or uploaded assets and I’ll unlock the template gallery on the preview side.
                </div>
              ) : null}

              {autofilling ? (
                <div className="flex max-w-[88%] items-center gap-3 rounded-[2rem] bg-white px-5 py-4 text-sm text-on-surface-variant shadow-[0_18px_38px_rgba(15,23,42,0.04)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tightening the story with AI so the preview stays filled in.
                </div>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 border-t border-outline-variant/12 bg-surface-container-lowest/94 px-5 pb-6 pt-5 backdrop-blur-xl md:px-7">
            {currentStep?.chips?.length ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {currentStep.chips.map((chip) => (
                  <button
                    key={chip}
                    className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                    onClick={() => void advanceConversation(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-outline-variant/18 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <Textarea
                ref={composerRef}
                value={draftInput}
                onChange={(event) => setDraftInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentStep?.placeholder || "Add more context or ask me to generate the case study"}
                className="min-h-[88px] resize-none border-0 bg-transparent px-0 py-0 text-base focus:border-0 focus:bg-transparent"
              />

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className={buttonStyles({ variant: "outline", size: "sm", className: "rounded-full" })}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                    Attach
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelection}
                  />
                  <p className="text-xs text-on-surface-variant">
                    Shift + Enter for a new line
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate case study
                  </Button>
                  <button
                    className={cn(
                      "inline-flex h-12 w-12 items-center justify-center rounded-full bg-pulse-primary text-white shadow-glow transition",
                      !draftInput.trim() && "opacity-60"
                    )}
                    onClick={() => void advanceConversation(draftInput)}
                    disabled={!draftInput.trim()}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {showPreviewPane ? (
          <section className="relative hidden min-h-0 flex-col bg-background xl:flex">
            <div className="border-b border-outline-variant/12 px-7 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Builder Preview</p>
                  <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em] text-on-surface">
                    {creating
                      ? "Generating case study"
                      : hasEnoughForTemplate
                        ? "Select a template and refine the preview"
                        : "Preview is now live"}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                    {hasEnoughForTemplate
                      ? "Template selection belongs here in the builder. Publish Studio comes later, after this case study is saved."
                      : "The builder no longer starts in preview mode. The right side only appears after the conversation starts."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard/projects"
                    className={buttonStyles({ variant: "outline", size: "sm", className: "rounded-full" })}
                  >
                    Back to projects
                  </Link>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-7">
              {creating ? (
                <div className="flex h-full min-h-[540px] items-center justify-center rounded-[2.5rem] bg-surface-container-lowest shadow-floating">
                  <div className="text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(84,99,255,0.38),rgba(84,99,255,0.06))]">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                    <p className="mt-6 font-display text-2xl font-bold tracking-[-0.04em] text-on-surface">
                      Generating case study
                    </p>
                    <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                      Structuring the intake, grounding the story in the assets, and composing the first polished preview.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Template Families</p>
                        <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                          {hasEnoughForTemplate
                            ? "Choose the case-study surface that fits the project. The story stays constant while the presentation changes."
                            : "Templates unlock after the project has a title and at least one strong story anchor."}
                        </p>
                      </div>
                      <Badge variant="outline">{hasEnoughForTemplate ? "Ready" : "Locked"}</Badge>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {caseStudyThemes.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          disabled={!hasEnoughForTemplate}
                          onClick={() => setThemeId(theme.id)}
                          className={cn(
                            "rounded-[1.6rem] border p-3 text-left transition",
                            hasEnoughForTemplate
                              ? themeId === theme.id
                                ? "border-primary/30 bg-primary/5 shadow-panel"
                                : "border-outline-variant/16 bg-surface-container-lowest hover:bg-surface-container-low"
                              : "cursor-not-allowed border-outline-variant/10 bg-surface-container-low opacity-65"
                          )}
                        >
                          <div className={cn("h-24 rounded-[1.1rem]", theme.heroClassName)} />
                          <p className="mt-3 text-sm font-semibold text-on-surface">{theme.name}</p>
                          <p className="mt-1 text-xs leading-5 text-on-surface-variant">{theme.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <CaseStudyPreview workspace={workingWorkspace} />
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
