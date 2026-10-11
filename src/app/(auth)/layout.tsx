/**
 * Auth shell. No navbar, no footer, no inquiry hatch — the split-screen
 * AuthStage is the whole viewport and carries its own brand link home.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="relative z-10">
      {children}
    </main>
  );
}
