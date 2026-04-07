"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  Menu,
  Megaphone,
  PlugZap,
  Search,
  Settings,
  Star,
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

function getInitials(name?: string | null) {
  if (!name) {
    return "DE";
  }

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, ready, logout, isAuthenticated } = useAuth();

  const headlineName = useMemo(() => {
    if (!user?.fullName) {
      return "Alex";
    }

    return user.fullName.split(" ")[0];
  }, [user?.fullName]);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-50/70 p-4 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-3 py-4">
          <PortfolioMark />
          <button
            className="rounded-xl p-2 text-on-surface-variant lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && Boolean(pathname?.startsWith(item.href)));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-3 text-sm transition-all duration-200",
                  active
                    ? "bg-surface-container-lowest font-semibold text-primary shadow-panel"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-[1.5rem] bg-primary-fixed p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Free plan</p>
          <p className="mt-1 text-[11px] text-primary/65">Upgrade for unlimited storage</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/50">
            <div className="h-full w-[25%] rounded-full bg-[linear-gradient(135deg,#1c32df_0%,#3e51f7_100%)]" />
          </div>
        </div>
      </aside>

      {isOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-ink-900/10 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div className="lg:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 bg-slate-50/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              className="rounded-xl p-2 text-on-surface-variant lg:hidden"
              onClick={() => setIsOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
              <input
                className="h-10 w-64 rounded-full border border-transparent bg-surface-container-low px-10 text-xs text-on-surface outline-none transition focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/15"
                placeholder="Search projects..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/projects" className={buttonStyles({ size: "sm" })}>
              + New Project
            </Link>
            <button className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-low">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 border-l border-outline-variant/15 pl-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-on-surface">
                  {isAuthenticated ? `Welcome back, ${headlineName}` : "Demo workspace"}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {isAuthenticated ? user?.email : "Seeded product walkthrough"}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1c32df_0%,#3e51f7_100%)] text-xs font-bold text-white shadow-panel">
                {getInitials(user?.fullName)}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          {!isAuthenticated && ready ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-surface-container-low px-5 py-4">
              <p className="text-sm text-on-surface-variant">
                Demo mode is active. Sign in when you want live backend data instead of seeded
                projects and reviews.
              </p>
              <div className="flex gap-3">
                <Link href="/login" className={buttonStyles({ variant: "outline", size: "sm" })}>
                  Log in
                </Link>
                <button
                  className={buttonStyles({ variant: "ghost", size: "sm" })}
                  onClick={logout}
                >
                  Clear session
                </button>
              </div>
            </div>
          ) : null}

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
