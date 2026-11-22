import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";

/** Hero: the owner's photo (eager, full width) then title and line. */
export async function Hero({ site }: TemplateProps) {
  const { photo } = site.hero;
  return (
    <section className="tl-hero" aria-label={photo.alt}>
      {photo.src ? <PhotoSpot photo={photo} sizes="100vw" eager /> : <div className="tl-ph" aria-label={photo.alt} style={{ height: 400 }} />}
      <h1 className="tl-hero-title">{site.hero.title}</h1>
      <p className="tl-hero-line">{site.hero.line}</p>
    </section>
  );
}
