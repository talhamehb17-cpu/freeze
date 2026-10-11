import { Footer } from "@/components/navigation/Footer";
import { InquiryDock } from "@/components/forms/InquiryDock";
import { Navbar } from "@/components/navigation/Navbar";

/**
 * Public marketing site chrome: navbar, semantic main landmark, footer and the
 * floating inquiry hatch. The route group keeps this out of /login, /signup,
 * /portal and /admin, which each supply their own shell.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" className="relative z-10">
        {children}
      </main>
      <Footer />
      <InquiryDock />
    </>
  );
}
