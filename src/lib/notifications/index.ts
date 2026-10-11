import "server-only";

import { serverEnv } from "@/lib/env";
import { recordNotification } from "@/lib/db/repositories";

/**
 * Notification layer (spec §31).
 *
 * Provider-agnostic by design: the app calls `notifyAdminOfInquiry()` and never
 * knows whether it went out by SMTP, WhatsApp or nowhere at all.
 *
 * HONESTY RULE: we only report delivery when a provider confirms it. When no
 * provider is configured the notification is recorded as DISABLED — never as
 * sent — and the user-facing copy never claims an email was delivered.
 */

export interface NotifyResult {
  delivered: boolean;
  channel: "EMAIL" | "WHATSAPP";
  reason?: string;
  providerMessageId?: string;
}

export const notificationCapability = {
  email: serverEnv.email !== null,
  whatsapp: serverEnv.whatsapp !== null,
} as const;

async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<NotifyResult> {
  if (!serverEnv.email) {
    return { delivered: false, channel: "EMAIL", reason: "EMAIL_SERVER is not configured." };
  }
  try {
    // Nodemailer is intentionally not a hard dependency; a real deployment wires
    // its own transport here (SMTP, Resend, SES…). Kept behind this seam so the
    // rest of the app never imports a provider SDK.
    const transport = await loadTransport();
    if (!transport) {
      return { delivered: false, channel: "EMAIL", reason: "No mail transport available." };
    }
    const info = await transport.sendMail({
      from: serverEnv.email.from ?? "no-reply@tahseenjaber.iq",
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return {
      delivered: true,
      channel: "EMAIL",
      providerMessageId: (info as any)?.messageId ?? undefined,
    };
  } catch (error) {
    // Log technically, never expose the raw error to a user.
    console.error("[notifications] email failed:", error instanceof Error ? error.message : error);
    return { delivered: false, channel: "EMAIL", reason: "Provider error." };
  }
}

interface MailTransport {
  sendMail: (message: Record<string, unknown>) => Promise<{ messageId?: string }>;
}

/**
 * Nodemailer is an OPTIONAL runtime dependency: it is resolved through Node's
 * own require at call time so it is never statically bundled (and the build
 * never fails when it is absent).
 *
 *   npm i nodemailer     # then set EMAIL_SERVER + EMAIL_FROM
 *
 * Without it, notifications are recorded as DISABLED — never reported as sent.
 */
async function loadTransport(): Promise<MailTransport | null> {
  try {
    const { createRequire } = await import("node:module");
    const req = createRequire(process.cwd() + "/");
    const mod = req("nodemailer") as { createTransport: (url: string) => MailTransport };
    return mod.createTransport(serverEnv.email!.server);
  } catch {
    return null;
  }
}

async function sendWhatsApp(input: { to: string; body: string }): Promise<NotifyResult> {
  if (!serverEnv.whatsapp) {
    return { delivered: false, channel: "WHATSAPP", reason: "WhatsApp API is not configured." };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${serverEnv.whatsapp.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serverEnv.whatsapp.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: input.to,
          type: "text",
          text: { body: input.body },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return { delivered: false, channel: "WHATSAPP", reason: `Provider ${res.status}.` };
    const data: any = await res.json().catch(() => ({}));
    return {
      delivered: true,
      channel: "WHATSAPP",
      providerMessageId: data?.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("[notifications] whatsapp failed:", error instanceof Error ? error.message : error);
    return { delivered: false, channel: "WHATSAPP", reason: "Provider error." };
  }
}

export interface InquiryNotificationInput {
  reference: string;
  inquiryId: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  product: string;
  quantity: number;
  unit: string;
  durationMonths: number;
  message: string | null;
}

/**
 * Fire-and-forget alert to the operations team when a public inquiry lands.
 * Always recorded in `notifications` so the audit trail exists even when no
 * provider is wired up.
 */
export async function notifyAdminOfInquiry(input: InquiryNotificationInput): Promise<NotifyResult[]> {
  const subject = `New storage request ${input.reference} — ${input.product}`;
  const text = [
    `Reference: ${input.reference}`,
    `Name: ${input.name}`,
    `Company: ${input.company ?? "—"}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    `Product: ${input.product}`,
    `Quantity: ${input.quantity} ${input.unit}`,
    `Duration: ${input.durationMonths} month(s)`,
    "",
    input.message ?? "(no message)",
  ].join("\n");

  const results: NotifyResult[] = [];

  const adminEmail = serverEnv.seed.adminEmail ?? process.env.ADMIN_NOTIFY_EMAIL ?? null;
  if (adminEmail && serverEnv.email) {
    const r = await sendEmail({ to: adminEmail, subject, text });
    results.push(r);
    await recordNotification({
      channel: "EMAIL",
      recipient: adminEmail,
      subject,
      body: text,
      status: r.delivered ? "SENT" : "FAILED",
      inquiryId: input.inquiryId,
      error: r.delivered ? null : (r.reason ?? null),
    });
  } else {
    await recordNotification({
      channel: "EMAIL",
      recipient: adminEmail ?? "unconfigured",
      subject,
      body: text,
      status: "DISABLED",
      inquiryId: input.inquiryId,
      error: "EMAIL_SERVER or ADMIN_NOTIFY_EMAIL is not configured.",
    });
    results.push({ delivered: false, channel: "EMAIL", reason: "Not configured." });
  }

  return results;
}

export async function sendAcknowledgementEmail(input: {
  to: string;
  name: string;
  reference: string;
}): Promise<NotifyResult> {
  const subject = `Request received — ${input.reference}`;
  const text = [
    `Hello ${input.name},`,
    "",
    `Your storage request has been received and logged.`,
    `Reference: ${input.reference}`,
    "",
    "Tahseen Jaber Cold Storage & Logistics",
    "Uuayrij Industrial Area, Baghdad, Iraq",
  ].join("\n");

  const result = await sendEmail({ to: input.to, subject, text });
  await recordNotification({
    channel: "EMAIL",
    recipient: input.to,
    subject,
    body: text,
    status: result.delivered ? "SENT" : "DISABLED",
    error: result.delivered ? null : (result.reason ?? null),
  });
  return result;
}

export { sendWhatsApp };
