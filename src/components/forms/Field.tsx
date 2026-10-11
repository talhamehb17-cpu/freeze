"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

import { EASE } from "@/animations/presets";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * Form fields (spec §37 — accessible forms, visible states).
 *
 * Every field animates the same three beats: label lift on focus, a frost
 * border glow, and an error/success state that slides in rather than popping.
 */

const SHELL =
  "relative w-full rounded-lg border bg-navy/60 backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

export function FieldShell({
  label,
  error,
  valid,
  focused,
  hint,
  required,
  children,
  className,
  id,
}: {
  label: string;
  error?: string;
  valid?: boolean;
  focused?: boolean;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  id: string;
}) {
  return (
    <div className={cn("group/field relative", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.24em] uppercase transition-colors duration-300",
          error ? "text-danger" : focused ? "text-cyan-core" : "text-silver/65",
        )}
      >
        {label}
        {required && <span className="text-cyan-core/70">*</span>}
        {valid && !error && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: EASE.snap as never }}
          >
            <Check className="h-3 w-3 text-cool" aria-hidden />
          </motion.span>
        )}
      </label>

      <div
        className={cn(
          SHELL,
          error
            ? "border-danger/60 shadow-[0_0_0_1px_rgba(239,68,68,0.25),0_0_26px_-10px_rgba(239,68,68,0.7)]"
            : focused
              ? "border-cyan-core/70 bg-industrial/55 shadow-[0_0_0_1px_rgba(34,211,238,0.28),0_0_34px_-12px_rgba(34,211,238,0.85)]"
              : "border-ice/16 hover:border-ice/32",
        )}
      >
        {children}
        {/* focus sweep */}
        <span
          className={cn(
            "pointer-events-none absolute inset-x-3 -bottom-px h-px origin-center bg-gradient-to-r from-transparent via-cyan-core to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            focused && !error ? "scale-x-100" : "scale-x-0",
          )}
        />
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.26, ease: EASE.frost as never }}
            className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] text-danger uppercase"
            role="alert"
          >
            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1.5 font-mono text-[9px] tracking-[0.12em] text-silver/45 uppercase"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const INPUT_CLASS =
  "w-full bg-transparent px-4 py-3.5 font-sans text-sm text-frost placeholder:text-silver/35 focus:outline-none";

export function TextField({
  label,
  error,
  valid,
  hint,
  icon,
  className,
  ...props
}: {
  label: string;
  error?: string;
  valid?: boolean;
  hint?: string;
  icon?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = props.id ?? auto;
  const [focused, setFocused] = useState(false);

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      valid={valid}
      focused={focused}
      hint={hint}
      required={props.required}
      className={className}
    >
      <div className="flex items-center">
        {icon && (
          <span
            className={cn(
              "pl-3.5 transition-colors duration-300",
              error ? "text-danger" : focused ? "text-cyan-core" : "text-silver/45",
            )}
          >
            {icon}
          </span>
        )}
        <input
          {...props}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(INPUT_CLASS, icon ? "pl-3" : "")}
        />
      </div>
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  error,
  valid,
  hint,
  className,
  ...props
}: {
  label: string;
  error?: string;
  valid?: boolean;
  hint?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = props.id ?? auto;
  const [focused, setFocused] = useState(false);

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      valid={valid}
      focused={focused}
      hint={hint}
      required={props.required}
      className={className}
    >
      <textarea
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(INPUT_CLASS, "min-h-[112px] resize-y leading-relaxed")}
      />
    </FieldShell>
  );
}

/** Segmented pill selector — used for product, unit and duration. */
export function SegmentedField<T extends string | number>({
  label,
  options,
  value,
  onChange,
  error,
  hint,
  className,
  name,
  columns = 4,
}: {
  label: string;
  options: { value: T; label: string; icon?: ReactNode; sub?: string }[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
  hint?: string;
  className?: string;
  name: string;
  columns?: number;
}) {
  const auto = useId();
  const id = `${auto}-${name}`;

  return (
    <fieldset className={cn("group/field", className)} aria-describedby={error ? `${id}-error` : undefined}>
      <legend
        className={cn(
          "mb-2 font-mono text-[9px] tracking-[0.24em] uppercase transition-colors duration-300",
          error ? "text-danger" : "text-silver/65",
        )}
      >
        {label}
      </legend>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <label
              key={String(opt.value)}
              className={cn(
                "relative flex cursor-pointer flex-col items-start gap-1 overflow-hidden rounded-lg border px-3 py-2.5 transition-all duration-300",
                active
                  ? "border-cyan-core/70 bg-cyan-core/12 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_28px_-12px_rgba(34,211,238,0.9)]"
                  : "border-ice/14 bg-navy/50 hover:border-ice/34 hover:bg-industrial/45",
              )}
            >
              <input
                type="radio"
                name={name}
                value={String(opt.value)}
                checked={active}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              {active && (
                <motion.span
                  layoutId={`${id}-active`}
                  className="absolute inset-0 rounded-lg border border-cyan-core/50"
                  transition={{ duration: 0.4, ease: EASE.frost as never }}
                  aria-hidden
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {opt.icon && (
                  <span className={cn("transition-colors", active ? "text-cyan-core" : "text-silver/55")}>
                    {opt.icon}
                  </span>
                )}
                <span
                  className={cn(
                    "font-mono text-[9px] tracking-[0.16em] uppercase transition-colors",
                    active ? "text-frost" : "text-silver/80",
                  )}
                >
                  {opt.label}
                </span>
              </span>
              {opt.sub && (
                <span className="relative font-mono text-[8px] tracking-[0.1em] text-silver/45 uppercase">
                  {opt.sub}
                </span>
              )}
            </label>
          );
        })}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] text-danger uppercase"
            role="alert"
          >
            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      {!error && hint && (
        <p className="mt-1.5 font-mono text-[9px] tracking-[0.12em] text-silver/45 uppercase">{hint}</p>
      )}
    </fieldset>
  );
}

/** Number stepper — pallets / tonnage. */
export function StepperField({
  label,
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  unit = "pallets",
  error,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  error?: string;
  className?: string;
}) {
  const auto = useId();
  const id = auto;
  const reduced = useReducedMotion();
  const [focused, setFocused] = useState(false);

  const bump = (delta: number) =>
    onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <FieldShell id={id} label={label} error={error} focused={focused} className={className}>
      <div className="flex items-stretch">
        <StepperButton label={`Decrease ${label}`} onClick={() => bump(-step)} disabled={value <= min}>
          −
        </StepperButton>
        <div className="relative flex flex-1 items-center justify-center gap-2 px-3 py-3">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={reduced ? { opacity: 0 } : { y: "60%", opacity: 0, filter: "blur(4px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              exit={reduced ? { opacity: 0 } : { y: "-60%", opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: EASE.frost as never }}
              className="font-display text-2xl font-bold tabular text-frost"
            >
              {value}
            </motion.span>
          </AnimatePresence>
          <span className="font-mono text-[9px] tracking-[0.2em] text-silver/55 uppercase">{unit}</span>
          <input
            id={id}
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="absolute inset-0 h-full w-full cursor-default opacity-0"
            aria-label={label}
          />
        </div>
        <StepperButton label={`Increase ${label}`} onClick={() => bump(step)} disabled={value >= max}>
          +
        </StepperButton>
      </div>
      {/* range slider mirror for drag input */}
      <input
        type="range"
        min={min}
        max={Math.min(max, 500)}
        step={step}
        value={Math.min(value, 500)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} slider`}
        className="mx-4 mb-3 h-1 w-[calc(100%-2rem)] cursor-pointer appearance-none rounded-full bg-steel accent-cyan-core"
      />
    </FieldShell>
  );
}

function StepperButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex w-12 items-center justify-center font-mono text-lg text-silver transition-colors duration-200",
        "hover:bg-cyan-core/12 hover:text-cyan-core active:bg-cyan-core/20",
        "disabled:pointer-events-none disabled:opacity-30",
      )}
    >
      {children}
    </button>
  );
}
