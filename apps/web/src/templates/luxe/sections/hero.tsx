import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";

/** Hero: cover image with scrim, title and line overlaid on top. */
export async function Hero({ site }: TemplateProps) {
  const { photo } = site.hero;
  return (
    <section className="tl-hero" aria-label={photo.alt}>
      <div className="tl-hero-image">
        {photo.src ? <PhotoSpot photo={photo} sizes="100vw" fetchPriority="high" /> : <div className="tl-ph" style={{ height: 400 }} />}
        <div className="tl-hero-scrim" />
        <div className="tl-hero-copy">
          <h1 className="tl-hero-title">{site.hero.title}</h1>
          <p className="tl-hero-line">{site.hero.line}</p>
        </div>
      </div>
    </section>
  );
}
