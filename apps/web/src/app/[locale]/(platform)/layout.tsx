import type { ReactNode } from "react";

/** Platform screens (login, owner, admin) share this wrapper; each page renders <Shell>. Not a guest page. */
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <div className="pf min-h-screen bg-neutral-50 text-neutral-900">{children}</div>;
}
