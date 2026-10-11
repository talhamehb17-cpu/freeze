"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Beef,
  Check,
  CheckCircle2,
  Fish,
  Leaf,
  Mail,
  Package,
  Phone,
  Pill,
  Quote,
  RotateCcw,
  User,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { submitInquiry, type SubmitInquiryResponse } from "@/app/actions/inquiry";
import { EASE } from "@/animations/presets";
import { MagneticButton } from "@/components/ui/Button";
import { DemoBadge } from "@/components/ui/Hud";
import { ScrambleText } from "@/components/ui/Typography";
import { SegmentedField, StepperField, TextField } from "@/components/forms/Field";
import { useFreeze } from "@/components/ui/FreezeOverlay";
import { useReducedMotion } from "@/hooks/use-motion";
import { DURATIONS, UNITS } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

/**
 * STORAGE CALCULATOR (spec §25) — public, no login required.
 *
 * Four steps: product → volume → duration → contact. It produces an inquiry,
 * NOT a price. No pricing rules have been supplied by the business, so the
 * calculator shows REQUEST A CUSTOM QUOTE rather than fabricating an estimate.
 */

const STEPS = [
  { key: "product", label: "Product", hint: "What are we holding?" },
  { key: "volume", label: "Volume", hint: "How much of it?" },
  { key: "duration", label: "Duration", hint: "For how long?" },
  { key: "contact", label: "Contact", hint: "Where do we send the quote?" },
] as const;

const PRODUCT_OPTIONS = [
  { value: "PRODUCE" as const, label: "Produce", icon: <Leaf className="h-3.5 w-3.5" aria-hidden />, sub: "Fruit · veg" },
  { value: "MEAT" as const, label: "Meat", icon: <Beef className="h-3.5 w-3.5" aria-hidden />, sub: "Poultry · red" },
  { value: "SEAFOOD" as const, label: "Seafood", icon: <Fish className="h-3.5 w-3.5" aria-hidden />, sub: "Fish · shrimp" },
  { value: "PHARMA" as const, label: "Pharma", icon: <Pill className="h-3.5 w-3.5" aria-hidden />, sub: "Precision" },
  { value: "OTHER" as const, label: "Other", icon: <Package className="h-3.5 w-3.5" aria-hidden />, sub: "General" },
];

const UNIT_OPTIONS = UNITS.map((u) => ({ value: u, label: u }));
const DURATION_OPTIONS = DURATIONS.map((d) => ({ value: d, label: `${d}`, sub: d === 1 ? "month" : "months" }));

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  company: z.string().trim().max(160).optional(),
  email: z.email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a reachable phone number.")
    .max(40)
    .regex(/^[+()\d][\d\s()+-]{5,39}$/, "Enter a valid phone number."),
});

type ContactValues = z.infer<typeof contactSchema>;

export function StorageCalculator({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const { freeze } = useFreeze();

  // Stamped on first interaction so the server-side dwell-time check sees a real
  // duration instead of a fabricated one.
  const [startedAt, setStartedAt] = useState(0);
  const markStart = useCallback(() => {
    setStartedAt((t) => (t === 0 ? Date.now() : t));
  }, []);

  const [step, setStep] = useState(0);
  const [product, setProduct] = useState<(typeof PRODUCT_OPTIONS)[number]["value"]>("SEAFOOD");
  const [quantity, setQuantity] = useState(20);
  const [unit, setUnit] = useState<(typeof UNITS)[number]>("PALLET");
  const [duration, setDuration] = useState<number>(6);
  const [phase, setPhase] = useState<"form" | "processing" | "done" | "error">("form");
  const [response, setResponse] = useState<SubmitInquiryResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { name: "", company: "", email: "", phone: "" },
  });

  const progress = (step + 1) / STEPS.length;

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async (values: ContactValues) => {
    setPhase("processing");
    setFormError(null);
    const result = await submitInquiry({
      name: values.name,
      company: values.company ?? "",
      email: values.email,
      phone: values.phone,
      product,
      quantity,
      unit,
      durationMonths: duration,
      message: `Storage calculator configuration — ${product}, ${quantity} ${unit}, ${duration} month(s).`,
      website: "",
      formStartedAt: startedAt,
      source: "calculator",
    });

    if (result.ok) {
      setResponse(result);
      setPhase("done");
      if (!reduced && typeof window !== "undefined") {
        freeze({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    } else {
      setResponse(result);
      setFormError(result.error);
      setPhase("error");
    }
  };

  const resetAll = () => {
    setStep(0);
    setStartedAt(Date.now());
    setPhase("form");
    setResponse(null);
    setFormError(null);
  };

  /* ------------------------------ success ------------------------------ */
  if (phase === "done" && response?.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE.frost as never }}
        className={cn("panel-hud scanlines relative overflow-hidden rounded-2xl p-8 sm:p-12", className)}
        role="status"
        aria-live="polite"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(80% 70% at 50% 0%, rgba(34,211,238,0.2), transparent 66%)" }}
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

          <h3 className="mt-7 font-display text-[clamp(1.6rem,3.6vw,2.4rem)] font-bold tracking-[-0.03em] text-frost uppercase">
            Request received
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-silver/80">
            Your configuration is logged. We will review the category, volume and duration and return
            a custom quote — we do not publish an automated rate.
          </p>

          <div className="mt-7 w-full max-w-sm rounded-lg border border-cyan-core/35 bg-navy/70 px-5 py-4">
            <div className="font-mono text-[9px] tracking-[0.28em] text-silver/60 uppercase">Reference</div>
            <div className="mt-2 font-display text-[1.7rem] font-bold tracking-[0.06em] text-frost tabular">
              <ScrambleText text={response.reference} speed={42} trigger="mount" />
            </div>
          </div>

          <div className="mt-7 grid w-full max-w-md grid-cols-3 gap-2">
            <ReceiptCell label="Category" value={product} />
            <ReceiptCell label="Volume" value={`${quantity} ${unit}`} />
            <ReceiptCell label="Duration" value={`${duration} mo`} />
          </div>

          <MagneticButton
            className="mt-8"
            variant="secondary"
            icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}
            onClick={resetAll}
          >
            Configure another
          </MagneticButton>
        </div>
      </motion.div>
    );
  }

  /* -------------------------------- wizard ------------------------------- */
  return (
    <div
      className={cn("panel relative overflow-hidden rounded-2xl", className)}
      onFocusCapture={markStart}
      onPointerDownCapture={markStart}
    >
      {/* header + progress */}
      <div className="relative border-b border-ice/12 bg-navy/60 px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Quote className="h-4 w-4 text-cyan-core" aria-hidden />
            <span className="font-mono text-[10px] tracking-[0.24em] text-frost uppercase">
              Storage calculator
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.2em] text-silver/55 uppercase tabular">
              Step {step + 1} / {STEPS.length}
            </span>
            <DemoBadge size="xs" label="No login" />
          </div>
        </div>

        <div className="mt-4 flex gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => i <= step && setStep(i)}
              disabled={i > step}
              className="group/step relative h-1.5 flex-1 overflow-hidden rounded-full bg-steel/70 disabled:cursor-not-allowed"
              aria-label={`Go to step ${i + 1}: ${s.label}`}
              aria-current={i === step}
            >
              <motion.span
                className={cn(
                  "absolute inset-0 origin-left rounded-full",
                  i < step
                    ? "bg-cool/80"
                    : i === step
                      ? "bg-gradient-to-r from-cyan-core to-ice"
                      : "bg-transparent",
                )}
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0 }}
                transition={{ duration: 0.6, ease: EASE.frost as never }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="relative px-5 py-7 sm:px-7 sm:py-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: reduced ? 0 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduced ? 0 : -40 }}
            transition={{ duration: 0.5, ease: EASE.frost as never }}
          >
            <div className="mb-6">
              <h3 className="font-display text-[clamp(1.4rem,3vw,2rem)] leading-tight font-bold tracking-[-0.03em] text-frost">
                {STEPS[step]!.label}
              </h3>
              <p className="mt-2 font-mono text-[10px] tracking-[0.18em] text-cyan-core/80 uppercase">
                {STEPS[step]!.hint}
              </p>
            </div>

            {step === 0 && (
              <SegmentedField
                name="calc-product"
                label="Product type"
                options={PRODUCT_OPTIONS}
                value={product}
                onChange={(v) => {
                  setProduct(v);
                  next();
                }}
                columns={5}
                hint="Determines which zone and handling profile applies."
              />
            )}

            {step === 1 && (
              <div className="grid gap-6 sm:grid-cols-2">
                <StepperField
                  label="Quantity"
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={2000}
                  unit={unit.toLowerCase()}
                />
                <SegmentedField
                  name="calc-unit"
                  label="Unit of measure"
                  options={UNIT_OPTIONS}
                  value={unit}
                  onChange={setUnit}
                  columns={5}
                />
              </div>
            )}

            {step === 2 && (
              <SegmentedField
                name="calc-duration"
                label="Storage duration"
                options={DURATION_OPTIONS}
                value={duration}
                onChange={setDuration}
                columns={6}
                hint="Short-term buffer through to multi-season contracts."
              />
            )}

            {step === 3 && (
              <form id="calc-contact" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
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
                  label="Company"
                  placeholder="Optional"
                  icon={<Package className="h-3.5 w-3.5" aria-hidden />}
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
                  {...register("phone")}
                />
              </form>
            )}
          </motion.div>
        </AnimatePresence>

        {/* live configuration receipt */}
        <div className="mt-8 grid grid-cols-3 gap-2 rounded-xl border border-ice/12 bg-navy/50 p-3">
          <ReceiptCell label="Category" value={product} active={step === 0} />
          <ReceiptCell label="Volume" value={step >= 1 ? `${quantity} ${unit}` : "—"} active={step === 1} />
          <ReceiptCell label="Duration" value={step >= 2 ? `${duration} mo` : "—"} active={step === 2} />
        </div>

        <AnimatePresence>
          {phase === "error" && formError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 rounded-lg border border-danger/45 bg-danger/10 px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-danger uppercase"
              role="alert"
            >
              {formError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* footer controls */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <MagneticButton
            variant="ghost"
            size="md"
            onClick={back}
            disabled={step === 0}
            icon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden />}
            className={cn(step === 0 && "pointer-events-none opacity-35")}
          >
            Back
          </MagneticButton>

          {step < STEPS.length - 1 ? (
            <MagneticButton
              variant="secondary"
              size="md"
              onClick={next}
              iconRight={<ArrowRight className="h-3.5 w-3.5" aria-hidden />}
            >
              Continue
            </MagneticButton>
          ) : (
            <MagneticButton
              type="submit"
              form="calc-contact"
              variant="primary"
              size="md"
              loading={phase === "processing"}
              loadingText="Processing"
              iconRight={phase === "processing" ? undefined : <Check className="h-3.5 w-3.5" aria-hidden />}
            >
              {phase === "processing" ? "Processing…" : "Request a custom quote"}
            </MagneticButton>
          )}
        </div>

        <p className="mt-5 font-mono text-[9px] leading-relaxed tracking-[0.14em] text-amber-tj/70 uppercase">
          No estimate is shown because no published rate card exists. Pricing depends on category,
          volume, duration and handling — we return a custom quote.
        </p>
      </div>

      {/* progress glow along the bottom edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-cyan-core via-ice to-frost"
        style={{ transform: `scaleX(${progress})`, transition: "transform 600ms cubic-bezier(0.16,1,0.3,1)" }}
      />
    </div>
  );
}

function ReceiptCell({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-colors duration-500",
        active ? "border-cyan-core/50 bg-cyan-core/10" : "border-ice/10 bg-industrial/25",
      )}
    >
      <div className="font-mono text-[8px] tracking-[0.22em] text-silver/50 uppercase">{label}</div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -7 }}
          transition={{ duration: 0.3, ease: EASE.frost as never }}
          className={cn(
            "mt-1 truncate font-mono text-[10px] tracking-[0.14em] uppercase",
            active ? "text-cyan-core" : "text-frost/85",
          )}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
