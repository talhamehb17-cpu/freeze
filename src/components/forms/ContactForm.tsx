"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  Send,
  User,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { submitInquiry, type SubmitInquiryResponse } from "@/app/actions/inquiry";
import { EASE } from "@/animations/presets";
import { MagneticButton } from "@/components/ui/Button";
import { SegmentedField, TextAreaField, TextField } from "@/components/forms/Field";
import { DemoBadge } from "@/components/ui/Hud";
import { ScrambleText } from "@/components/ui/Typography";
import { useFreeze } from "@/components/ui/FreezeOverlay";
import { useReducedMotion } from "@/hooks/use-motion";
import { contactSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

/**
 * CONTACT FORM (spec §29).
 *
 * A general message rather than a storage quote. It validates against
 * `contactSchema` in the browser, then travels the SAME hardened pipeline as the
 * inquiry form — honeypot, minimum dwell time, per-IP rate limit, Zod on the
 * server, audit row — and lands in the command centre queue tagged with its
 * subject so the operations desk can route it.
 */

const SUBJECTS = [
  { value: "STORAGE", label: "Storage" },
  { value: "LOGISTICS", label: "Logistics" },
  { value: "ACCOUNT", label: "Account" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "OTHER", label: "Other" },
] as const;

type SubjectValue = (typeof SUBJECTS)[number]["value"];

/** Mirrors the server schema — `website` is the honeypot and stays in. */
const formSchema = contactSchema.omit({ subject: true }).extend({
  subject: z.enum(SUBJECTS.map((s) => s.value) as [SubjectValue, ...SubjectValue[]]),
});

type ContactFormValues = z.infer<typeof formSchema>;

type Phase = "idle" | "processing" | "success" | "error";

export function ContactForm({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const { freeze } = useFreeze();

  /*
   * Dwell time. Stamped on the first real interaction rather than during render:
   * `Date.now()` in a render body is impure, and a ref read inside a submit
   * closure is exactly what the React compiler rules warn about. The server
   * compares this against MIN_FORM_TIME_MS to drop scripts that post instantly.
   */
  const [startedAt, setStartedAt] = useState(0);
  const markStart = useCallback(() => {
    setStartedAt((t) => (t === 0 ? Date.now() : t));
  }, []);

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<SubmitInquiryResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", phone: "", subject: "STORAGE", message: "" },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setPhase("processing");
    setServerError(null);

    const response = await submitInquiry({
      name: values.name,
      email: values.email,
      phone: values.phone,
      // A contact message has no volume attached; these are the neutral values
      // the inquiry schema requires so the record stays valid.
      product: "OTHER",
      quantity: 1,
      unit: "UNIT",
      durationMonths: 1,
      message: `[${values.subject}] ${values.message}`,
      website: values.website ?? "",
      formStartedAt: startedAt,
      source: "contact-form",
    });

    if (response.ok) {
      setResult(response);
      setPhase("success");
      if (!reduced && typeof window !== "undefined") {
        freeze({ x: window.innerWidth / 2, y: window.innerHeight * 0.55 });
      }
    } else {
      setResult(response);
      setServerError(response.error);
      setPhase("error");
    }
  };

  const restart = () => {
    reset();
    setStartedAt(Date.now());
    setResult(null);
    setServerError(null);
    setPhase("idle");
  };

  /* ------------------------------- success ------------------------------- */
  if (phase === "success" && result?.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE.frost as never }}
        className={cn("panel-hud scanlines relative overflow-hidden rounded-2xl p-8 sm:p-10", className)}
        role="status"
        aria-live="polite"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(80% 70% at 50% 0%, rgba(34,211,238,0.18), transparent 66%)" }}
          aria-hidden
        />
        <div className="relative flex flex-col items-center text-center">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE.snap as never }}
            className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cool/50 bg-cool/12"
          >
            <span className="absolute inset-0 animate-pulse-ring rounded-full border border-cool/60" aria-hidden />
            <CheckCircle2 className="h-7 w-7 text-cool" aria-hidden />
          </motion.span>

          <h3 className="mt-7 font-display text-[clamp(1.5rem,3.4vw,2.2rem)] font-bold tracking-[-0.03em] text-frost uppercase">
            Message received
          </h3>

          <div className="mt-6 w-full max-w-sm rounded-lg border border-cyan-core/35 bg-navy/70 px-5 py-4">
            <div className="font-mono text-[9px] tracking-[0.28em] text-silver/60 uppercase">Reference</div>
            <div className="mt-2 font-display text-[1.7rem] font-bold tracking-[0.06em] text-frost tabular">
              <ScrambleText text={result.reference} speed={42} trigger="mount" />
            </div>
          </div>

          <p className="mt-6 max-w-md text-[0.9rem] leading-relaxed text-silver/80">
            Your message is in the operations queue with its subject attached. Quote the reference if
            you follow up and we will find it immediately.
          </p>

          <MagneticButton className="mt-8" variant="secondary" onClick={restart}>
            Send another message
          </MagneticButton>
        </div>
      </motion.div>
    );
  }

  /* -------------------------------- form -------------------------------- */
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onFocusCapture={markStart}
      onPointerDownCapture={markStart}
      noValidate
      className={cn("panel relative overflow-hidden rounded-2xl", className)}
    >
      {/* honeypot — visually hidden, never announced, bots fill it */}
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="relative border-b border-ice/12 bg-navy/55 px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Send className="h-4 w-4 text-cyan-core" aria-hidden />
            <span className="font-mono text-[10px] tracking-[0.24em] text-frost uppercase">Send a message</span>
          </div>
          <DemoBadge size="xs" label="Rate limited" />
        </div>
      </div>

      <div className="relative space-y-5 px-5 py-7 sm:px-7">
        <AnimatePresence>
          {phase === "error" && serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: EASE.frost as never }}
              className="overflow-hidden"
            >
              <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/45 bg-danger/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
                <p className="font-mono text-[9px] leading-relaxed tracking-[0.14em] text-danger uppercase">
                  {serverError}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Controller
          control={control}
          name="subject"
          render={({ field }) => (
            <SegmentedField
              name="subject"
              label="Subject"
              columns={5}
              options={SUBJECTS.map((s) => ({ value: s.value, label: s.label }))}
              value={field.value}
              onChange={field.onChange}
              error={errors.subject?.message}
            />
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Full name"
            required
            placeholder="Your name"
            icon={<User className="h-3.5 w-3.5" aria-hidden />}
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />
          <TextField
            label="Email"
            type="email"
            required
            placeholder="you@company.com"
            icon={<Mail className="h-3.5 w-3.5" aria-hidden />}
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <TextField
          label="Phone"
          type="tel"
          required
          placeholder="+964 …"
          icon={<Phone className="h-3.5 w-3.5" aria-hidden />}
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <TextAreaField
          label="Message"
          required
          rows={6}
          maxLength={4000}
          placeholder="What do you need from us? Include volumes, dates or product details if you have them."
          error={errors.message?.message}
          hint="Minimum 10 characters. Nothing here is published."
          {...register("message")}
        />

        <MagneticButton
          type="submit"
          variant="primary"
          size="lg"
          full
          loading={phase === "processing"}
          loadingText="Sending"
          iconRight={phase === "processing" ? undefined : <ArrowRight className="h-4 w-4" aria-hidden />}
        >
          {phase === "processing" ? "Sending…" : "Send message"}
        </MagneticButton>

        <p className="font-mono text-[8px] leading-relaxed tracking-[0.14em] text-silver/40 uppercase">
          Submissions are rate limited per address and validated on the server. We never sell or
          publish contact details.
          {isSubmitSuccessful && " Sent."}
        </p>
      </div>
    </form>
  );
}
