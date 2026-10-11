import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthStage } from "@/components/auth/AuthStage";
import { LoginForm } from "@/components/auth/LoginForm";
import { currentUser } from "@/lib/auth/guards";
import { resolveCsrfToken } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/validation/schemas";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to the Tahseen Jaber client portal or the operations command centre. Sessions are cookie-based, rate limited and CSRF protected.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

/** Signed-in visitors have no reason to see a login form. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const user = await currentUser();
  if (user) {
    redirect(user.role === "CLIENT" ? "/portal" : "/admin");
  }

  const csrf = (await resolveCsrfToken()) ?? "";
  const next = safeNextPath(params.next, user ? "/portal" : "/portal");

  return (
    <AuthStage
      eyebrow="Secure access"
      lines={["Open the", "cold room."]}
      lead="One sign-in reaches your storage records, documents and dispatch history — or the operations command centre, depending on your role."
      image="/assets/security-camera.jpg"
      imageCode="ACC-01"
      footer={
        <span className="font-mono text-[9px] tracking-[0.18em] text-silver/45 uppercase">
          Trouble signing in? Contact the operations desk.
        </span>
      }
    >
      <LoginForm csrf={csrf} next={next} />
      {params.reason === "expired" && (
        <p className="mt-5 rounded-lg border border-amber-tj/40 bg-amber-tj/8 px-4 py-3 font-mono text-[9px] tracking-[0.14em] text-amber-tj uppercase">
          Your session expired. Sign in again to continue.
        </p>
      )}
    </AuthStage>
  );
}
