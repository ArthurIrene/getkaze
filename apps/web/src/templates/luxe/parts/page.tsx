import type { TemplateProps } from "../../types";
import "../luxe.css";

/** Shared Luxe page shell. Read only. */
export function LuxePage({ site, page, children }: TemplateProps & { children: React.ReactNode }) {
  return (
    <div
      className="tl"
      data-cur={site.defaultCurrency}
      data-page={page}
      data-look={site.look.colorSet === "auto" ? undefined : site.look.colorSet}
      data-accent={site.look.accent === "forest" ? undefined : site.look.accent}
    >
      <header className="tl-header">{children}</header>
    </div>
  );
}
