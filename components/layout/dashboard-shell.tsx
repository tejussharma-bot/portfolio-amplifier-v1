"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Menu,
  Megaphone,
  Settings,
  ShieldCheck,
  Star,
  PlugZap,
  X
} from "lucide-react";

import { PortfolioMark } from "@/components/brand/portfolio-mark";
import { useAuth } from "@/components/providers/auth-provider";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/dashboard/publish-studio", label: "Publish Studio", icon: Megaphone },
  { href: "/dashboard/reviews", label: "Reviews & Ratings", icon: Star },
  { href: "/dashboard/channels", label: "Channels", icon: PlugZap },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, ready, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/60 bg-[#fffaf3]/95 px-5 py-5 shadow-panel backdrop-blur transition-transform duration-300 lg:static lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <PortfolioMark compact />
              <button
                className="rounded-full p-2 text-muted-foreground lg:hidden"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 panel bg-gradient-to-br from-ink-900 to-ink-800 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                V1 journey
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold">
                Onboard. Create. Amplify. Publish. Respond.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/72">
                Projects stay at the center, while publishing and ORM branch naturally from the
                same proof asset.
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-tide-200" />
                OAuth fallback + export mode ready
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      active
                        ? "bg-ink-900 text-white shadow-lg"
                        : "text-ink-700 hover:bg-white hover:text-ink-900"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto panel p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Workspace
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold">
                {user?.fullName || "Demo workspace"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isAuthenticated
                  ? `${user?.role || "Workspace"} ready. Live data is available across projects, publishing, and reviews.`
                  : "Sign in to switch from demo visuals to the live backend workspace."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <button
                    className={buttonStyles({ variant: "outline", size: "sm" })}
                    onClick={logout}
                  >
                    Log out
                  </button>
                ) : ready ? (
                  <Link
                    href="/login"
                    className={buttonStyles({ variant: "outline", size: "sm" })}
                  >
                    Log in
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        {isOpen ? (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-ink-900/25 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        ) : null}

        <div className="min-w-0 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between rounded-3xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur lg:hidden">
            <PortfolioMark compact />
            <button
              aria-label="Open navigation"
              className="rounded-full border border-border p-2 text-foreground"
              onClick={() => setIsOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-white/60 bg-white/55 px-4 py-3 text-sm text-muted-foreground backdrop-blur">
            <p>
              {isAuthenticated ? (
                <>
                  Signed in as{" "}
                  <span className="font-semibold text-foreground">
                    {user?.email || "workspace user"}
                  </span>
                </>
              ) : (
                <>
                  Demo mode is showing seeded content.{" "}
                  <span className="font-semibold text-foreground">Log in for live backend data</span>
                </>
              )}
            </p>
            <Link
              href="/"
              className={buttonStyles({
                variant: "ghost",
                size: "sm",
                className: "hidden md:inline-flex"
              })}
            >
              View product story
            </Link>
          </div>

          <main className="mt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
