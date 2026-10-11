"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Building2, Check, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import { signupAction } from "@/lib/auth/actions";
import { EASE } from "@/animations/presets";
import { MagneticButton } from "@/components/ui/Button";
import { TextField } from "@/components/forms/Field";
import { ScrambleText } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { passwordStrength, signupSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";
import type { AuthResponse } from "@/types";

/**
 * Request access (spec §31). Signup creates a CLIENT record and signs the user
 * straight in. Live password strength, confirm-match feedback and a release
 * sequence on success; the server remains the authority on every rule.
 */

const REQUIREMENTS = [
  { key: "len", label: "10 characters or more", test: (p: string) => p.length >= 10 },
  { key: "case", label: "Upper and lower case", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { key: "digit", label: "At least one number", test: (p: string) => /\d/.test(p) },
];

export function SignupForm({ csrf }: { csrf: string }) {
  const reduced = useReducedMotion();
  const router = useRouter();

  const [state, formAction, pending] = useActionState<AuthResponse | null, FormData>(signupAction, null);
  const [values, setValues] = useState({ name: "", company: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [granted, setGranted] = useState<AuthResponse | null>(null);
  const [shake, setShake] = useState(0);

  const strength = useMemo(() => passwordStrength(values.password), [values.password]);
  const passwordsMatch = values.confirmPassword.length > 0 && values.password === values.confirmPassword;
  const clientValid = useMemo(() => signupSchema.safeParse({ ...values, terms }).success, [values, terms]);

  useEffect(() => {
    if (state && !state.ok) setShake((n) => n + 1);
  }, [state]);

  useEffect(() => {
    if (!state?.ok) return;
    setGranted(state);
    const t = window.setTimeout(() => {
      router.replace(state.redirectTo);
      router.refresh();
    }, reduced ? 400 : 1600);
    return () => window.clearTimeout(t);
  }, [state, router, reduced]);

  const fields = state && !state.ok ? state.fields : undefined;
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <div className="relative">
      {/* ======================= account created overlay ======================= */}
      <AnimatePresence>
        {granted?.ok && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-[-2rem] z-30 flex flex-col items-center justify-center rounded-2xl border border-cool/40 bg-midnight/96 px-6 backdrop-blur-md"
            role="status"
            aria-live="assertive"
          >
            {!reduced && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 h-24"
                style={{ background: "linear-gradient(180deg, transparent, rgba(34,197,94,0.22), transparent)" }}
                initial={{ y: "-30%" }}
                animate={{ y: "130%" }}
                transition={{ duration: 1.2, ease: EASE.frost as never }}
              />
            )}
            <motion.span
              initial={{ scale: 0.55, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE.snap as never }}
              className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cool/55 bg-cool/12"
            >
              <span className="absolute inset-0 animate-pulse-ring rounded-full border border-cool/60" aria-hidden />
              <CheckCircle2 className="h-7 w-7 text-cool" aria-hidden />
            </motion.span>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.6, ease: EASE.frost as never }}
              className="mt-6 text-center"
            >
              <div className="font-display text-lg font-bold tracking-[0.2em] text-cool uppercase">
                <ScrambleText text="Account created" speed={30} trigger="mount" />
              </div>
              <p className="mt-3 max-w-xs text-[0.85rem] leading-relaxed text-silver/75">
                Your client record is open. Storage requests you submit are now linked to it.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2 font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">
                <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-core" aria-hidden />
                Opening your portal
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div key={shake} animate={reduced || shake === 0 ? {} : { x: [0, -9, 8, -5, 3, 0] }} transition={{ duration: 0.45 }}>
        <div className="mb-7">
          <h2 className="font-display text-[1.6rem] leading-tight font-bold tracking-[-0.03em] text-frost">
            Request access
          </h2>
          <p className="mt-2 font-mono text-[9px] leading-relaxed tracking-[0.2em] text-silver/55 uppercase">
            Client accounts track storage, documents and dispatch
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
              <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/45 bg-danger/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
                <p className="font-mono text-[9px] leading-relaxed tracking-[0.14em] text-danger uppercase">{state.error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form action={formAction} noValidate className="space-y-5">
          <input type="hidden" name="__csrf" value={csrf} />

          <TextField
            label="Full name"
            name="name"
            required
            autoComplete="name"
            placeholder="Your name"
            icon={<User className="h-3.5 w-3.5" aria-hidden />}
            value={values.name}
            onChange={set("name")}
            error={fields?.name}
            valid={values.name.trim().length >= 2}
            disabled={pending || !!granted}
          />

          <TextField
            label="Company"
            name="company"
            required
            autoComplete="organization"
            placeholder="Trading or company name"
            icon={<Building2 className="h-3.5 w-3.5" aria-hidden />}
            value={values.company}
            onChange={set("company")}
            error={fields?.company}
            valid={values.company.trim().length >= 2}
            disabled={pending || !!granted}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              icon={<Mail className="h-3.5 w-3.5" aria-hidden />}
              value={values.email}
              onChange={set("email")}
              error={fields?.email}
              disabled={pending || !!granted}
            />
            <TextField
              label="Phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+964 …"
              icon={<Phone className="h-3.5 w-3.5" aria-hidden />}
              value={values.phone}
              onChange={set("phone")}
              error={fields?.phone}
              disabled={pending || !!granted}
            />
          </div>

          <div className="relative">
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Create a password"
              icon={<Lock className="h-3.5 w-3.5" aria-hidden />}
              value={values.password}
              onChange={set("password")}
              error={fields?.password}
              aria-describedby="password-strength"
              disabled={pending || !!granted}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[2.05rem] flex h-8 w-8 items-center justify-center rounded-md text-silver/55 transition-colors hover:text-cyan-core focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-core"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
            </button>

            {/* strength meter */}
            <AnimatePresence initial={false}>
              {values.password.length > 0 && (
                <motion.div
                  id="password-strength"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: EASE.frost as never }}
                  className="overflow-hidden"
                >
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-1.5" aria-hidden>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <motion.span
                            key={i}
                            className="h-1 w-8 rounded-full"
                            initial={false}
                            animate={{
                              backgroundColor:
                                i < strength.score
                                  ? strength.score <= 2
                                    ? "#EF4444"
                                    : strength.score === 3
                                      ? "#F59E0B"
                                      : "#22C55E"
                                  : "rgba(167,180,197,0.18)",
                            }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                          />
                        ))}
                      </div>
                      <span
                        className={cn(
                          "font-mono text-[8px] tracking-[0.2em] uppercase",
                          strength.score <= 2 ? "text-danger" : strength.score === 3 ? "text-amber-tj" : "text-cool",
                        )}
                      >
                        {strength.label}
                      </span>
                    </div>

                    <ul className="mt-3 space-y-1.5">
                      {REQUIREMENTS.map((r) => {
                        const ok = r.test(values.password);
                        return (
                          <li key={r.key} className="flex items-center gap-2">
                            <motion.span
                              initial={false}
                              animate={{
                                color: ok ? "#22C55E" : "rgba(167,180,197,0.4)",
                                borderColor: ok ? "rgba(34,197,94,0.5)" : "rgba(167,180,197,0.2)",
                              }}
                              transition={{ duration: 0.3 }}
                              className="flex h-3.5 w-3.5 items-center justify-center rounded-full border"
                            >
                              {ok && <Check className="h-2 w-2" aria-hidden />}
                            </motion.span>
                            <span
                              className={cn(
                                "font-mono text-[8px] tracking-[0.16em] uppercase transition-colors duration-300",
                                ok ? "text-silver/85" : "text-silver/40",
                              )}
                            >
                              {r.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <TextField
            label="Confirm password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Repeat password"
            icon={<Lock className="h-3.5 w-3.5" aria-hidden />}
            value={values.confirmPassword}
            onChange={set("confirmPassword")}
            error={fields?.confirmPassword}
            valid={passwordsMatch}
            hint={
              values.confirmPassword.length > 0 && !passwordsMatch
                ? "Passwords do not match yet."
                : passwordsMatch
                  ? "Passwords match."
                  : undefined
            }
            disabled={pending || !!granted}
          />

          {/* terms */}
          <label
            className={cn(
              "group/tc flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors duration-300",
              terms ? "border-cyan-core/45 bg-cyan-core/8" : "border-ice/12 bg-navy/40 hover:border-ice/25",
              fields?.terms && "border-danger/50",
            )}
          >
            <input
              type="checkbox"
              name="terms"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              disabled={pending || !!granted}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-300",
                terms ? "border-cool bg-cool text-midnight" : "border-silver/40 bg-transparent text-transparent",
              )}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
            </span>
            <span className="font-mono text-[9px] leading-relaxed tracking-[0.14em] text-silver/70 uppercase">
              I understand this is a demonstration build and consent to my details being stored for
              the purpose of quoting and account access.
              {fields?.terms && <span className="mt-1 block text-danger">{fields.terms}</span>}
            </span>
          </label>

          <MagneticButton
            type="submit"
            variant="primary"
            size="lg"
            full
            loading={pending}
            loadingText="Creating account"
            disabled={!!granted || (!clientValid && !pending)}
            iconRight={pending || granted ? undefined : <ArrowRight className="h-4 w-4" aria-hidden />}
          >
            {pending ? "Creating account…" : granted ? "Opening portal" : "Create client account"}
          </MagneticButton>

          {!clientValid && !pending && !granted && (
            <p className="text-center font-mono text-[8px] leading-relaxed tracking-[0.16em] text-silver/40 uppercase">
              Complete every field and accept the terms to continue
            </p>
          )}
        </form>

        <p className="mt-6 text-center font-mono text-[9px] tracking-[0.18em] text-silver/50 uppercase">
          Already registered?{" "}
          <Link href="/login" className="text-cyan-core transition-colors hover:text-frost">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
