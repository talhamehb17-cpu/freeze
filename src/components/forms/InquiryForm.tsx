"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Beef,
  Boxes,
  Fish,
  Leaf,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Pill,
  Building2,
  User,
  CalendarClock,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { submitInquiry, type SubmitInquiryResponse } from "@/app/actions/inquiry";
import { EASE } from "@/animations/presets";
import { MagneticButton } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/Hud";
import { ScrambleText } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { DURATIONS, PRODUCT_CATEGORIES, UNITS, inquirySchema, type InquiryFormValues } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";
import { SegmentedField, StepperField, TextAreaField, TextField } from "./Field";

/**
 * Public inquiry form (spec §26, §39).
 *
 * No account required. Validated with the exact Zod schema the server uses, so
 * client and server cannot disagree. Three honest states — PROCESSING,
 * REQUEST RECEIVED (with a reference id), and a recoverable error.
 */

const PRODUCT_OPTIONS = [
  { value: "PRODUCE" as const, label: "Produce", icon: <Leaf className="h-3.5 w-3.5" aria-hidden /> },
  { value: "MEAT" as const, label: "Meat", icon: <Beef className="h-3.5 w-3.5" aria-hidden /> },
  { value: "SEAFOOD" as const, label: "Seafood", icon: <Fish className="h-3.5 w-3.5" aria-hidden /> },
  { value: "PHARMA" as const, label: "Pharma", icon: <Pill className="h-3.5 w-3.5" aria-hidden /> },
  { value: "OTHER" as const, label: "Other", icon: <Package className="h-3.5 w-3.5" aria-hidden /> },
];

const UNIT_OPTIONS = UNITS.map((u) => ({ value: u, label: u }));
const DURATION_OPTIONS = DURATIONS.map((d) => ({ value: d, label: `${d}`, sub: d === 1 ? "month" : "months" }));

type Phase = "idle" | "processing" | "success" | "error";

export function InquiryForm({
  source = "contact-form",
  compact = false,
  onSuccess,
  className,
  defaultProduct,
}: {
  source?: string;
  compact?: boolean;
  onSuccess?: (reference: string) => void;
  className?: string;
  defaultProduct?: (typeof PRODUCT_CATEGORIES)[number];
}) {
  const reduced = useReducedMotion();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<SubmitInquiryResponse | null>(null);
  const startedAt = useRef(Date.now());
  const successRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      product: defaultProduct ?? "PRODUCE",
      quantity: 10,
      unit: "PALLET",
      durationMonths: 3,
      message: "",
      website: "",
    },
  });

  const product = watch("product");
  const quantity = watch("quantity");
  const duration = watch("durationMonths");
  const unit = watch("unit");

  useEffect(() => {
    if (phase === "success") successRef.current?.focus();
  }, [phase]);

  const onSubmit = async (values: InquiryFormValues) => {
    setPhase("processing");
    const response = await submitInquiry({
      ...values,
      company: values.company ?? "",
      message: values.message ?? "",
      website: "",
      formStartedAt: startedAt.current,
      source,
    });

    if (response.ok) {
      setResult(response);
      setPhase("success");
      onSuccess?.(response.reference);
    } else {
      setResult(response);
      setPhase("error");
    }
  };

  /* ------------------------------- success ------------------------------- */
  if (phase === "success" && result?.ok) {
    return (
      <motion.div
        ref={successRef}
        tabIndex={-1}
        initial={{ opacity: 0, y: reduced ? 0 : 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE.frost as never }}
        className={cn("panel-hud scanlines relative overflow-hidden p-7 sm:p-9", className)}
        role="status"
        aria-live="polite"
      >
        {/* frost bloom */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 70% at 50% 0%, rgba(34,211,238,0.22), transparent 66%)",
          }}
          aria-hidden
        />

        <div className="relative flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE.snap as never }}
            className="relative"
          >
            <span className="absolute inset-0 animate-pulse-ring rounded-full border border-cool/60" aria-hidden />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cool/50 bg-cool/12">
              <CheckIcon />
            </span>
          </motion.div>

          <h3 className="mt-7 font-display text-[clamp(1.5rem,3.4vw,2.2rem)] font-bold tracking-[-0.03em] text-frost uppercase">
            Request Received
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-silver/80">
            Your storage request has been logged. Our operations team will review the volume,
            category and duration and come back to you with next steps.
          </p>

          <div className="mt-7 w-full max-w-sm">
            <div className="rounded-lg border border-cyan-core/35 bg-navy/70 px-5 py-4">
              <div className="font-mono text-[9px] tracking-[0.28em] text-silver/60 uppercase">
                Reference
              </div>
              <div className="mt-2 font-display text-[1.7rem] font-bold tracking-[0.06em] text-frost tabular">
                <ScrambleText text={result.reference} speed={42} trigger="mount" />
              </div>
            </div>
            <p className="mt-3 font-mono text-[9px] leading-relaxed tracking-[0.14em] text-silver/50 uppercase">
              Keep this reference — quote it in any follow-up.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton
              variant="secondary"
              size="md"
              icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}
              onClick={() => {
                reset();
                startedAt.current = Date.now();
                setResult(null);
                setPhase("idle");
              }}
            >
              Submit another
            </MagneticButton>
            <MagneticButton
              variant="ghost"
              size="md"
              iconRight={<ArrowRight className="h-3.5 w-3.5" aria-hidden />}
              onClick={() => {
                router.push("/portal");
              }}
            >
              Track in portal
            </MagneticButton>
          </div>
        </div>
      </motion.div>
    );
  }

  /* --------------------------------- form -------------------------------- */
  return (
    <motion.form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: reduced ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE.frost as never }}
      className={cn("panel relative overflow-hidden", compact ? "p-5 sm:p-6" : "p-6 sm:p-8", className)}
    >
      {/* honeypot — visually hidden, must stay empty */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      {!compact && (
        <div className="mb-7 flex items-start justify-between gap-4 border-b border-ice/10 pb-6">
          <div>
            <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-frost sm:text-2xl">
              Request Storage
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-silver/70">
              No account needed. Tell us the product, the volume and how long — we handle the rest.
            </p>
          </div>
          <span className="hidden shrink-0 rounded-md border border-cyan-core/30 bg-cyan-core/8 px-3 py-1.5 font-mono text-[9px] tracking-[0.22em] text-cyan-core uppercase sm:block">
            Step {stepOf(product, quantity, duration)}
          </span>
        </div>
      )}

      {/* ------------------------------ live summary ----------------------------- */}
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-ice/12 bg-navy/50 px-4 py-3">
        <SummaryChip label="Category" value={product} tone="cyan" />
        <SummaryChip label="Volume" value={`${quantity} ${unit.toLowerCase()}`} />
        <SummaryChip label="Duration" value={`${duration} mo`} />
        <span className="ml-auto font-mono text-[9px] tracking-[0.18em] text-amber-tj/70 uppercase">
          Quote on request
        </span>
      </div>

      <div className={cn("grid gap-5", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
        <TextField
          label="Full name"
          required
          placeholder="Your name"
          icon={<User className="h-3.5 w-3.5" aria-hidden />}
          autoComplete="name"
          error={errors.name?.message}
          valid={isSubmitted && !errors.name}
          {...register("name")}
        />
        <TextField
          label="Company"
          placeholder="Optional"
          icon={<Building2 className="h-3.5 w-3.5" aria-hidden />}
          autoComplete="organization"
          error={errors.company?.message}
          {...register("company")}
        />
        <TextField
          label="Email"
          type="email"
          required
          placeholder="you@company.com"
          icon={<Mail className="h-3.5 w-3.5" aria-hidden />}
          autoComplete="email"
          error={errors.email?.message}
          valid={isSubmitted && !errors.email}
          {...register("email")}
        />
        <TextField
          label="Phone"
          type="tel"
          required
          placeholder="+964 …"
          icon={<Phone className="h-3.5 w-3.5" aria-hidden />}
          autoComplete="tel"
          error={errors.phone?.message}
          valid={isSubmitted && !errors.phone}
          {...register("phone")}
        />
      </div>

      <div className="mt-6">
        <Controller
          control={control}
          name="product"
          render={({ field }) => (
            <SegmentedField
              name="product"
              label="Product category"
              options={PRODUCT_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.product?.message}
              columns={5}
            />
          )}
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Controller
          control={control}
          name="quantity"
          render={({ field }) => (
            <StepperField
              label="Quantity"
              value={Number(field.value)}
              onChange={field.onChange}
              min={1}
              max={2000}
              unit={String(unit).toLowerCase()}
              error={errors.quantity?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="unit"
          render={({ field }) => (
            <SegmentedField
              name="unit"
              label="Unit"
              options={UNIT_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              columns={5}
            />
          )}
        />
      </div>

      <div className="mt-6">
        <Controller
          control={control}
          name="durationMonths"
          render={({ field }) => (
            <SegmentedField
              name="duration"
              label="Storage duration"
              options={DURATION_OPTIONS}
              value={Number(field.value)}
              onChange={(v) => field.onChange(v)}
              error={errors.durationMonths?.message}
              columns={6}
              hint="Flexible — short-term buffer through to multi-season contracts."
            />
          )}
        />
      </div>

      <div className="mt-6">
        <TextAreaField
          label="Message"
          placeholder="Handling notes, delivery windows, anything we should know…"
          error={errors.message?.message}
          {...register("message")}
        />
      </div>

      {/* pricing honesty — we never fabricate a number (spec §25) */}
      <div className="mt-5 flex items-start gap-3 rounded-lg border border-ice/12 bg-industrial/30 px-4 py-3.5">
        <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ice/70" aria-hidden />
        <p className="font-mono text-[9px] leading-relaxed tracking-[0.14em] text-silver/70 uppercase">
          Pricing depends on category, volume, duration and handling. Submit the request and we will
          return a <span className="text-frost">custom quote</span> — no automated estimate is shown
          because none is published.
        </p>
      </div>

      <AnimatePresence>
        {phase === "error" && result && !result.ok && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.35, ease: EASE.frost as never }}
            className="mt-5"
            role="alert"
          >
            <div className="flex items-start gap-3 rounded-lg border border-danger/45 bg-danger/10 px-4 py-3.5">
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] text-danger uppercase">
                  We couldn&apos;t complete your request
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-silver/80">
                  {result.error} Please try again — your details are never lost silently.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <MagneticButton
          type="submit"
          variant="primary"
          size="lg"
          loading={phase === "processing"}
          loadingText="Processing"
          iconRight={
            phase === "processing" ? undefined : <ArrowRight className="h-4 w-4" aria-hidden />
          }
          className="sm:min-w-[15rem]"
        >
          {phase === "processing" ? "Processing…" : "Submit Request"}
        </MagneticButton>

        <p className="font-mono text-[9px] leading-relaxed tracking-[0.14em] text-silver/50 uppercase">
          Protected against spam and abuse. Your details stay with us — never resold, never exposed
          to the browser.
        </p>
      </div>

      {!compact && (
        <div className="mt-6">
          <DemoNotice>
            Submissions are stored in the configured datastore. Until a production PostgreSQL
            instance and mail provider are connected, notifications are recorded rather than sent.
          </DemoNotice>
        </div>
      )}
    </motion.form>
  );
}

function SummaryChip({
  label,
  value,
  tone = "frost",
}: {
  label: string;
  value: string;
  tone?: "frost" | "cyan";
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-mono text-[8px] tracking-[0.24em] text-silver/50 uppercase">{label}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: EASE.frost as never }}
          className={cn(
            "font-mono text-[10px] tracking-[0.14em] uppercase tabular",
            tone === "cyan" ? "text-cyan-core" : "text-frost",
          )}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function CheckIcon() {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
      <motion.path
        d="M4 12.6 L9.4 18 L20 6.8"
        stroke="#22C55E"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? { opacity: 1 } : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.62, delay: 0.16, ease: EASE.frost as never }}
      />
    </svg>
  );
}

function stepOf(product: string, quantity: number, duration: number) {
  if (!product) return "01 / 04";
  if (!quantity) return "02 / 04";
  if (!duration) return "03 / 04";
  return "04 / 04";
}

export { Boxes as _BoxesIcon };
