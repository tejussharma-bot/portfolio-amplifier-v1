import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  buildCaseStudyWorkspace,
  getCaseStudyTheme,
  getPreviewImage,
  type CaseStudyWorkspace
} from "@/lib/case-study";

interface CaseStudyPreviewProps {
  workspace: CaseStudyWorkspace;
  className?: string;
  compact?: boolean;
}

export function CaseStudyPreview({
  workspace,
  className,
  compact = false
}: CaseStudyPreviewProps) {
  const theme = getCaseStudyTheme(workspace.themeId);
  const previewImage = getPreviewImage(workspace.assets);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[2.5rem] bg-surface-container-lowest shadow-floating",
        className
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[2.2rem] p-8 md:p-12",
          compact ? "min-h-[320px]" : "min-h-[420px]",
          theme.heroClassName
        )}
      >
        {previewImage ? (
          <img
            src={previewImage.url}
            alt={previewImage.label}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.42))]" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge className={cn("border-0", theme.accentClassName)} variant="outline">
              {theme.categoryLabel}
            </Badge>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">
              {workspace.document.category || "Case Study"}
            </span>
          </div>

          <div className="max-w-3xl space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
              AI-Assisted Case Study Builder
            </p>
            <h2 className="max-w-3xl font-display text-4xl font-extrabold tracking-[-0.05em] text-white md:text-6xl">
              {workspace.document.title}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-white/82 md:text-lg">
              {workspace.document.heroSummary}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(workspace.document.tags.length
              ? workspace.document.tags
              : workspace.document.proofPoints
            )
              .slice(0, 3)
              .map((point) => (
              <span
                key={point}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-semibold",
                  theme.chipClassName
                )}
              >
                {point}
              </span>
              ))}
          </div>
        </div>
      </div>

      <div className={cn("grid gap-6 p-6 md:p-8", compact ? "lg:grid-cols-1" : "lg:grid-cols-[0.76fr_1.24fr]")}>
        <div className="space-y-5">
          <div className={cn("rounded-[2rem] p-6", theme.panelClassName)}>
            <p className="kicker">The Challenge</p>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              {workspace.document.challenge}
            </p>
          </div>

          <div className="rounded-[2rem] bg-surface-container-low p-6">
            <p className="kicker">Deliverables</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.document.deliverables.length ? (
                workspace.document.deliverables.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-on-surface-variant">Add deliverables to sharpen the case study.</span>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-ink-900 p-6 text-white">
            <p className="dark-kicker">Source</p>
            <p className="mt-3 text-lg font-semibold">
              {workspace.document.clientName || "Client name pending"}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/72">
              {workspace.document.timeline || "Timeline pending"}
              {workspace.document.industry ? ` • ${workspace.document.industry}` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] bg-surface-container-lowest p-6 shadow-panel">
            <p className="kicker">The Solution</p>
            <p className="mt-3 text-base leading-7 text-on-surface-variant">
              {workspace.document.solution}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_0.72fr]">
            <div className="rounded-[2rem] bg-surface-container-low p-6">
              <p className="kicker">Results</p>
              <p className="mt-3 text-base leading-7 text-on-surface-variant">
                {workspace.document.results}
              </p>
            </div>
            <div className={cn("rounded-[2rem] p-6", theme.panelClassName)}>
              <p className="kicker">Preview Readiness</p>
              <p className="mt-3 font-display text-3xl font-extrabold tracking-[-0.05em] text-on-surface">
                {workspace.publishReadiness}
              </p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                The case study stays central, then Publish Studio adapts it for each channel.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] bg-surface-container-lowest p-6 shadow-panel">
              <p className="kicker">Client Proof</p>
              <p className="mt-3 text-lg leading-8 text-on-surface">
                &ldquo;{workspace.document.testimonial}&rdquo;
              </p>
            </div>
            <div className="rounded-[2rem] bg-surface-container-low p-6">
              <p className="kicker">Assets</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {workspace.assets.slice(0, 4).map((asset) => (
                  <div
                    key={`${asset.label}-${asset.url}`}
                    className="overflow-hidden rounded-[1.4rem] bg-surface-container-high"
                  >
                    {asset.mimetype?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(asset.url) ? (
                      <img
                        src={asset.url}
                        alt={asset.label}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center px-3 text-center text-xs font-semibold text-on-surface-variant">
                        {asset.label}
                      </div>
                    )}
                  </div>
                ))}
                {!workspace.assets.length ? (
                  <div className="col-span-2 rounded-[1.4rem] bg-surface-container-high p-4 text-sm text-on-surface-variant">
                    Upload assets or add reference URLs to ground the preview in the real project.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CaseStudyPreviewFromProject({
  project,
  className,
  compact
}: {
  project: any;
  className?: string;
  compact?: boolean;
}) {
  const workspace = buildCaseStudyWorkspace(project);

  return <CaseStudyPreview workspace={workspace} className={className} compact={compact} />;
}
