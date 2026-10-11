"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Boxes,
  ChevronLeft,
  Inbox,
  LayoutGrid,
  Layers,
  ScrollText,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { EASE } from "@/animations/presets";
import { LogoMark } from "@/components/brand/Logo";
import { DemoBadge } from "@/components/ui/Hud";
import { useReducedMotion } from "@/hooks/use-motion";
import { BRAND } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * ADMIN SIDEBAR (spec §35) — the navigation spine of the command centre.
 *
 * Collapses to an icon rail on desktop so the dense data tables keep their
 * width; becomes a horizontal scroll strip on small screens. The active item is
 * derived from the pathname, so it survives a hard refresh and a deep link.
 */

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  code: string;
  /** Match the pathname exactly rather than as a prefix. */
  end?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, code: "01", end: true },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox, code: "02" },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, code: "03" },
  { href: "/admin/zones", label: "Zones", icon: Layers, code: "04" },
  { href: "/admin/telemetry", label: "Telemetry", icon: Activity, code: "05" },
  { href: "/admin/clients", label: "Clients", icon: Users, code: "06" },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, code: "07" },
] as const;

export function AdminSidebar({
  counts,
  alerts = 0,
}: {
  /** Badge counts keyed by href — e.g. `{ "/admin/inquiries": 3 }`. */
  counts?: Partial<Record<string, number>>;
  alerts?: number;
}) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, end?: boolean) =>
    end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* ===================== desktop rail ===================== */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 78 : 246 }}
        transition={{ duration: reduced ? 0.15 : 0.55, ease: EASE.frost as never }}
        className="sticky top-[4.4rem] hidden h-[calc(100dvh-4.4rem)] shrink-0 flex-col border-r border-ice/12 bg-navy/45 backdrop-blur-xl lg:flex"
        aria-label="Command centre navigation"
      >
        <div className="flex items-center gap-3 border-b border-ice/10 px-4 py-5">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-core/30 bg-cyan-core/8">
            <ShieldAlert className="h-4 w-4 text-cyan-core" aria-hidden />
            {alerts > 0 && !reduced && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-70" />
                <span className="relative inline-flex h-3 w-3 rounded-full border border-midnight bg-danger" />
              </span>
            )}
          </span>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="min-w-0 leading-none"
            >
              <span className="block font-display text-[0.82rem] font-bold tracking-[0.14em] text-frost uppercase">
                Command
              </span>
              <span className="mt-1.5 block font-mono text-[7px] tracking-[0.26em] text-cyan-core/80 uppercase">
                Centre
              </span>
            </motion.span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4">
          <ul className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const active = isActive(item.href, item.end);
              const count = counts?.[item.href];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group/nav relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-300",
                      active
                        ? "bg-cyan-core/12 text-frost"
                        : "text-silver/60 hover:bg-industrial/60 hover:text-frost",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="admin-active"
                        className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-gradient-to-b from-ice to-cyan-core"
                        transition={{ duration: reduced ? 0.15 : 0.45, ease: EASE.frost as never }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors duration-300",
                        active ? "text-cyan-core" : "text-silver/50 group-hover/nav:text-cyan-core",
                      )}
                      aria-hidden
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate font-mono text-[9px] tracking-[0.2em] uppercase">
                          {item.label}
                        </span>
                        {count !== undefined && count > 0 && (
                          <span
                            className={cn(
                              "rounded px-1.5 py-px font-mono text-[8px] tabular",
                              active ? "bg-cyan-core/20 text-cyan-core" : "bg-ice/10 text-silver/55",
                            )}
                          >
                            {count}
                          </span>
                        )}
                        <span className="font-mono text-[8px] text-silver/25 tabular">{item.code}</span>
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={cn("border-t border-ice/10 px-3 py-4", collapsed && "px-2")}>
          {!collapsed && (
            <div className="mb-3 rounded-lg border border-ice/12 bg-midnight/60 px-3 py-3">
              <div className="flex items-center gap-2">
                <LogoMark size={20} animated />
                <span className="truncate font-mono text-[8px] tracking-[0.18em] text-silver/60 uppercase">
                  {BRAND.name}
                </span>
              </div>
              <DemoBadge size="xs" label="Demo dataset" className="mt-3 items-start" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border border-ice/12 px-3 py-2",
              "font-mono text-[8px] tracking-[0.18em] text-silver/55 uppercase transition-colors duration-300",
              "hover:border-cyan-core/45 hover:text-cyan-core",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-core",
              collapsed && "justify-center px-0",
            )}
          >
            <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.35 }}>
              <ChevronLeft className="h-3 w-3" aria-hidden />
            </motion.span>
            {!collapsed && "Collapse"}
          </button>
        </div>
      </motion.aside>

      {/* ===================== mobile strip ===================== */}
      <nav
        className="sticky top-[4.4rem] z-40 border-b border-ice/12 bg-midnight/92 backdrop-blur-xl lg:hidden"
        aria-label="Command centre navigation"
      >
        <ul className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ADMIN_NAV.map((item) => {
            const active = isActive(item.href, item.end);
            const count = counts?.[item.href];
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-[9px] tracking-[0.16em] uppercase transition-colors duration-300",
                    active
                      ? "bg-cyan-core/14 text-cyan-core"
                      : "border border-ice/10 text-silver/55 hover:text-frost",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                  {count !== undefined && count > 0 && (
                    <span className="rounded bg-ice/12 px-1 text-[8px] tabular">{count}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
