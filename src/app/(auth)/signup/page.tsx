import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthStage } from "@/components/auth/AuthStage";
import { SignupForm } from "@/components/auth/SignupForm";
import { currentUser } from "@/lib/auth/guards";
import { resolveCsrfToken } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Request access",
  description:
    "Create a Tahseen Jaber client account to track cold storage batches, documents and dispatch. Passwords are hashed with bcrypt and never stored in plain text.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/signup" },
};

export default async function SignupPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "CLIENT" ? "/portal" : "/admin");

  const csrf = (await resolveCsrfToken()) ?? "";

  return (
    <AuthStage
      eyebrow="New client"
      lines={["Reserve your", "cold space."]}
      lead="An account links every storage request, batch and gate pass to your company — so nothing has to be chased by phone."
      image="/assets/team-cold-gear.jpg"
      imageCode="REG-02"
      footer={
        <span className="font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
          Accounts are client-tier only. Operator and administrator access is granted internally.
        </span>
      }
    >
      <SignupForm csrf={csrf} />
    </AuthStage>
  );
}
