"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useActionState } from "react";

import { loginAction } from "@/lib/auth/actions";
import { EASE } from "@/animations/presets";
import { MagneticButton } from "@/components/ui/Button";
import { TextField } from "@/components/forms/Field";
import { ScrambleText } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { DEMO_CREDENTIALS } from "@/lib/auth/demo-credentials";
import { cn } from "@/lib/utils";
import type { AuthResponse } from "@/types";

/**
 * Login (spec §31). Server action + double-submit CSRF + shake-on-error +
 * an "access granted" scan pass before the redirect, so signing in feels like
 * a door releasing rather than a page reload.
 */

export function LoginForm({ csrf, next }: { csrf: string; next: string }) {
  const reduced = useReducedMotion();
  const router = useRouter();

  const [state, formAction, pending] = useActionState<AuthResponse | null, FormData>(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [granted, setGranted] = useState<AuthResponse | null>(null);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const field = document.getElementById("login-email") as HTMLInputElement | null;
    field?.focus();
  }, [reduced]);

  /* failure → shake the panel, surface field errors */
  useEffect(() => {
    if (state && !state.ok) setShake((n) => n + 1);
  }, [state]);

  /* success → play the release sequence, then navigate */
  useEffect(() => {
    if (!state?.ok) return;
    setGranted(state);
    const t = window.setTimeout(() => {
      router.replace(state.redirectTo);
      router.refresh();
    }, reduced ? 400 : 1500);
    return () => window.clearTimeout(t);
  }, [state, router, reduced]);

  const fields = state && !state.ok ? state.fields : undefined;

  return (
    <div className="relative">
      {/* ======================= access granted overlay ======================= */}
      <AnimatePresence>
        {granted?.ok && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-[-2rem] z-30 flex flex-col items-center justify-center rounded-2xl border border-cool/40 bg-midnight/96 backdrop-blur-md"
            role="status"
            aria-live="assertive"
          >
            {!reduced && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 h-20"
                style={{ background: "linear-gradient(180deg, transparent, rgba(34,197,94,0.22), transparent)" }}
                initial={{ y: "-30%" }}
                animate={{ y: "130%" }}
                transition={{ duration: 1.1, ease: EASE.frost as never }}
              />
            )}
            <motion.span
              initial={{ scale: 0.55, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE.snap as never }}
              className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cool/55 bg-cool/12"
            >
              <span className="absolute inset-0 animate-pulse-ring rounded-full border border-cool/60" aria-hidden />
              <ShieldCheck className="h-7 w-7 text-cool" aria-hidden />
            </motion.span>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.6, ease: EASE.frost as never }}
              className="mt-6 text-center"
            >
              <div className="font-display text-lg font-bold tracking-[0.24em] text-cool uppercase">
                <ScrambleText text="Access granted" speed={30} trigger="mount" />
              </div>
              <div className="mt-2.5 font-mono text-[9px] tracking-[0.22em] text-silver/70 uppercase">
                Welcome back, {granted.user.name.split(" ")[0]}
              </div>
              <div className="mt-1.5 font-mono text-[9px] tracking-[0.22em] text-cyan-core/80 uppercase">
                Role · {granted.user.role}
              </div>
              <div className="mt-5 flex items-center gap-2 font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">
                <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-core" aria-hidden />
                Opening {granted.redirectTo}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div key={shake} animate={reduced || shake === 0 ? {} : { x: [0, -9, 8, -5, 3, 0] }} transition={{ duration: 0.45 }}>
        <div className="mb-8">
          <h2 className="font-display text-[1.6rem] leading-tight font-bold tracking-[-0.03em] text-frost">
            Sign in
          </h2>
          <p className="mt-2 font-mono text-[9px] tracking-[0.22em] text-silver/55 uppercase">
            Clients · Operators · Administrators
          </p>
        </div>

        <AnimatePresence>
          {state && !state.ok && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.4, ease: EASE.frost as never }}
              className="overflow-hidden"
            >
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-danger/45 bg-danger/10 px-4 py-3"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
                <p className="font-mono text-[9px] leading-relaxed tracking-[0.14em] text-danger uppercase">
                  {state.error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form action={formAction} noValidate className="space-y-5">
          <input type="hidden" name="__csrf" value={csrf} />
          <input type="hidden" name="next" value={next} />

          <TextField
            id="login-email"
            label="Email address"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            icon={<Mail className="h-3.5 w-3.5" aria-hidden />}
            error={fields?.email}
            disabled={pending || !!granted}
          />

          <div className="relative">
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••••"
              icon={<Lock className="h-3.5 w-3.5" aria-hidden />}
              error={fields?.password}
              disabled={pending || !!granted}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[2.05rem] flex h-8 w-8 items-center justify-center rounded-md text-silver/55 transition-colors hover:text-cyan-core focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-core"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              tabIndex={0}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
            </button>
          </div>

          <MagneticButton
            type="submit"
            variant="primary"
            size="lg"
            full
            loading={pending}
            loadingText="Verifying"
            disabled={!!granted}
            iconRight={pending || granted ? undefined : <ArrowRight className="h-4 w-4" aria-hidden />}
          >
            {pending ? "Verifying…" : granted ? "Opening" : "Enter facility"}
          </MagneticButton>
        </form>

        <DemoCredentials compact={reduced} />
      </motion.div>
    </div>
  );
}

/**
 * Signposted demo logins. This build has no live customer base, so the seeded
 * accounts are shown rather than hidden behind a request — and they are always
 * labelled DEMO so nobody mistakes them for production access.
 */
export function DemoCredentials({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const rows = [
    { role: "Administrator", email: DEMO_CREDENTIALS.admin.email, password: DEMO_CREDENTIALS.admin.password },
    { role: "Operator", email: DEMO_CREDENTIALS.operator.email, password: DEMO_CREDENTIALS.operator.password },
    { role: "Client", email: DEMO_CREDENTIALS.client.email, password: DEMO_CREDENTIALS.client.password },
  ];

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied((c) => (c === value ? null : c)), 1400);
    } catch {
      /* clipboard unavailable — the values are visible on screen anyway */
    }
  };

  return (
    <div className="mt-7 border-t border-ice/10 pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group/dc flex w-full items-center justify-between gap-3 font-mono text-[9px] tracking-[0.22em] text-amber-tj/85 uppercase transition-colors hover:text-amber-tj"
      >
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-tj/80" aria-hidden />
          Demo credentials
        </span>
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.35 }} className="text-silver/50">
          <ArrowRight className="h-3 w-3" aria-hidden />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: compact ? 0.15 : 0.45, ease: EASE.frost as never }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-px overflow-hidden rounded-lg border border-amber-tj/25 bg-amber-tj/5">
              {rows.map((r) => (
                <div key={r.role} className="flex items-center justify-between gap-3 bg-navy/50 px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[8px] tracking-[0.22em] text-silver/55 uppercase">{r.role}</div>
                    <div className="mt-1 truncate font-mono text-[10px] tracking-[0.06em] text-frost/90">{r.email}</div>
                    <div className="mt-0.5 truncate font-mono text-[10px] tracking-[0.06em] text-ice/80">{r.password}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(`${r.email} / ${r.password}`)}
                    className="shrink-0 rounded border border-ice/20 px-2.5 py-1.5 font-mono text-[8px] tracking-[0.18em] text-silver/70 uppercase transition-colors hover:border-cyan-core/60 hover:text-cyan-core focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-core"
                  >
                    {copied?.startsWith(r.email) ? "Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[8px] leading-relaxed tracking-[0.16em] text-silver/40 uppercase">
              Seeded for demonstration only. Rotate before any real deployment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className={cn("mt-5 text-center font-mono text-[9px] tracking-[0.18em] text-silver/50 uppercase")}>
        No account?{" "}
        <Link href="/signup" className="text-cyan-core transition-colors hover:text-frost">
          Request access
        </Link>
      </p>
    </div>
  );
}
