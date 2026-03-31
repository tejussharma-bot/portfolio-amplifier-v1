import Link from "next/link";
import { BellRing, DatabaseZap, KeyRound, ShieldAlert, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { settingsIntegrations } from "@/lib/data";
import { responseTonePresets } from "@/lib/workflow-data";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace settings"
        title="Connections, security, and launch hygiene"
        description="V1 settings keep the product honest about OAuth readiness, secrets handling, and account-level data controls."
        badge="NFR"
        actions={
          <Link href="/dashboard/channels" className="inline-flex">
            <Button variant="outline">Open Channels</Button>
          </Link>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Channel connections</CardTitle>
            <CardDescription>
              OAuth-backed channels publish directly; everything else degrades gracefully to copy mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsIntegrations.map((integration) => (
              <div
                key={integration.name}
                className="flex flex-col gap-4 rounded-3xl border border-border bg-white/80 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-xl font-semibold">{integration.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{integration.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={integration.tone}>{integration.status}</Badge>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security posture</CardTitle>
            <CardDescription>
              The PRD calls for strict isolation, encrypted secrets, and explicit delete controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                icon: KeyRound,
                title: "Secrets management",
                body: "No API keys live in code. Environment variables and vault-backed secrets are expected."
              },
              {
                icon: ShieldAlert,
                title: "Data isolation",
                body: "Every user-facing query is scoped to the authenticated user context."
              },
              {
                icon: BellRing,
                title: "Observability",
                body: "Structured events, correlation IDs, and error reporting are part of the launch bar."
              },
              {
                icon: DatabaseZap,
                title: "Delete my data",
                body: "A dedicated wipe path is reserved for database records and uploaded files."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-3xl bg-muted/70 p-5">
                <item.icon className="h-5 w-5 text-coral-600" />
                <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-ink-900 text-white">
          <CardHeader>
            <CardTitle className="text-white">Operational defaults</CardTitle>
            <CardDescription className="text-white/72">
              These settings reflect the launch constraints and reliability posture from the PRD.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              "Async AI via queue-backed jobs only",
              "Max 3 retries on failed provider calls",
              "Copy/paste fallback always available on publish failure",
              "P95 dashboard targets visible during beta"
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white/85">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review response tone presets</CardTitle>
            <CardDescription>
              The ORM flow should let users start from a preferred tone without forcing a single style.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {responseTonePresets.map((item) => (
              <div key={item} className="rounded-2xl bg-muted/70 px-4 py-3 text-sm font-medium">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Account-level destructive actions are isolated and intentionally harder to trigger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-coral-200 bg-coral-50 p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-coral-600">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-xl font-semibold">Delete my data</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Wipes portfolio records, uploaded assets, and review history to satisfy the
                    GDPR / CCPA requirement in the PRD.
                  </p>
                </div>
              </div>
              <Button variant="outline" className="mt-5 w-full border-coral-200 bg-white">
                Request data deletion
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
