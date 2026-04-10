import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getPreviewImage,
  type CaseStudyWorkspace
} from "@/lib/case-study";
import {
  type ChannelConnection,
  type PlatformId
} from "@/lib/workflow-data";

interface PublishingDraftPreview {
  headline: string;
  body: string;
  cta: string;
  tags: string[];
  label?: string;
}

export function PublishingSurfacePreview({
  platform,
  draft,
  workspace,
  channel,
  className
}: {
  platform: PlatformId;
  draft: PublishingDraftPreview | null;
  workspace: CaseStudyWorkspace | null;
  channel?: ChannelConnection;
  className?: string;
}) {
  const image = workspace ? getPreviewImage(workspace.assets) : null;
  const title = workspace?.document.title || "Untitled case study";
  const sourceLabel = workspace?.document.clientName || "Portfolio Amplifier";
  const tags = draft?.tags?.length ? draft.tags : workspace?.document.tags || [];

  return (
    <div
      className={cn(
        "h-full overflow-hidden rounded-[2.5rem] bg-surface-container-lowest shadow-floating",
        className
      )}
    >
      <div className="border-b border-outline-variant/12 px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Platform Preview</p>
            <h3 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em] text-on-surface">
              {platform === "googlemybusiness"
                ? "Google Business"
                : platform.charAt(0).toUpperCase() + platform.slice(1)}
            </h3>
          </div>
          {channel ? (
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
          ) : null}
        </div>
      </div>

      <div className="h-[calc(100%-93px)] overflow-y-auto p-6 md:p-8">
        {!draft ? (
          <div className="flex h-full min-h-[520px] items-center justify-center rounded-[2rem] bg-surface-container-low">
            <div className="max-w-md text-center">
              <p className="font-display text-3xl font-extrabold tracking-[-0.04em] text-on-surface">
                Generate a platform draft
              </p>
              <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                The case study stays in the Projects area. This canvas only previews how the selected platform version will look once it is rephrased.
              </p>
            </div>
          </div>
        ) : platform === "linkedin" ? (
          <div className="mx-auto max-w-[720px] rounded-[2rem] border border-outline-variant/12 bg-white p-6 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pulse-primary text-sm font-bold text-white">
                {sourceLabel.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-on-surface">{sourceLabel}</p>
                <p className="text-sm text-on-surface-variant">Case study publish preview • LinkedIn</p>
              </div>
            </div>
            <p className="mt-5 text-xl font-semibold leading-8 text-on-surface">{draft.headline}</p>
            <div className="mt-4 space-y-4 text-[15px] leading-8 text-on-surface-variant">
              {draft.body.split(/\n+/).filter(Boolean).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {image ? (
              <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-outline-variant/10">
                <img src={image.url} alt={image.label} className="h-[320px] w-full object-cover" />
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`}
                </Badge>
              ))}
            </div>
            {draft.cta ? (
              <div className="mt-5 rounded-[1.6rem] bg-surface-container-low px-5 py-4 text-sm font-semibold text-on-surface">
                CTA: {draft.cta}
              </div>
            ) : null}
          </div>
        ) : platform === "behance" ? (
          <div className="mx-auto max-w-[760px] overflow-hidden rounded-[2rem] border border-outline-variant/12 bg-white shadow-panel">
            <div className="relative min-h-[280px] bg-[radial-gradient(circle_at_top,rgba(93,144,255,0.28),transparent_28%),linear-gradient(135deg,#111827_0%,#195d8a_48%,#7cd2f4_100%)] p-8 text-white">
              {image ? (
                <img src={image.url} alt={image.label} className="absolute inset-0 h-full w-full object-cover opacity-25" />
              ) : null}
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/72">Behance Cover</p>
                <h4 className="mt-6 max-w-2xl font-display text-5xl font-extrabold tracking-[-0.05em]">
                  {draft.headline || title}
                </h4>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/80">
                  {draft.body}
                </p>
              </div>
            </div>
            <div className="grid gap-5 p-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.7rem] bg-surface-container-low p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Section Order</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Overview",
                    "Challenge",
                    "Approach",
                    "Outcome",
                    "Asset gallery"
                  ].map((section) => (
                    <Badge key={section} variant="outline">
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.7rem] bg-surface-container-lowest p-5 shadow-panel">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Publish Note</p>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                  Behance stays export-first in V1, so this preview focuses on the cover frame, intro copy, and section rhythm rather than rendering the whole case study again.
                </p>
                {draft.cta ? (
                  <p className="mt-4 text-sm font-semibold text-on-surface">{draft.cta}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : platform === "dribbble" ? (
          <div className="mx-auto max-w-[640px] rounded-[2.2rem] border border-outline-variant/12 bg-white p-6 shadow-panel">
            <div className="overflow-hidden rounded-[1.8rem] bg-surface-container-low">
              {image ? (
                <img src={image.url} alt={image.label} className="h-[420px] w-full object-cover" />
              ) : (
                <div className="flex h-[420px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(84,99,255,0.2),transparent_30%),linear-gradient(135deg,#eef2ff_0%,#f8fafc_100%)] text-sm text-on-surface-variant">
                  Hero image preview
                </div>
              )}
            </div>
            <p className="mt-5 font-display text-3xl font-bold tracking-[-0.04em] text-on-surface">
              {draft.headline || title}
            </p>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">{draft.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[700px] rounded-[2rem] border border-outline-variant/12 bg-white p-6 shadow-panel">
            <div className="rounded-[1.8rem] bg-surface-container-low p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Business Profile Update</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {sourceLabel.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{sourceLabel}</p>
                  <p className="text-sm text-on-surface-variant">Google Business Profile</p>
                </div>
              </div>
              <p className="mt-5 text-lg font-semibold leading-8 text-on-surface">{draft.headline}</p>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">{draft.body}</p>
              {draft.cta ? (
                <div className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
                  {draft.cta}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
