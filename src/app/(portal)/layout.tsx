import type { Metadata } from "next";

import { PortalTopBar } from "@/components/portal/PortalTopBar";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Signed-in shell. The guard runs here — on the server — so every nested route
 * is protected regardless of what the client renders (spec §38).
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/login?next=/portal");
  const section = user.role === "CLIENT" ? "Client portal" : "Command centre";

  return (
    <div className="relative min-h-dvh bg-midnight">
      <PortalTopBar
        user={user}
        section={section}
        adminHref={user.role === "CLIENT" ? undefined : "/admin"}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
