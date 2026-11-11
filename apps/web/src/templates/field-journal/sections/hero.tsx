import { getTranslations } from "next-intl/server";
import { whatsAppLink } from "@getkaze/core";
import type { TemplateProps } from "../../types";
import { Glyph } from "../parts/icons";

/** Hero: drawn scene (grey placeholder for the photo), title, handwritten line, rotating stamp. */
export async function Hero({ site }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  return (
    <section className="fj-hero" aria-label={site.hero.photo.alt}>
      <svg viewBox="0 0 360 440" preserveAspectRatio="none" className="fj-hero-art" aria-hidden="true">
        <rect width="360" height="440" className="fj-ph-fill" />
        <polygon points="0,270 48,232 92,172 118,158 144,176 188,230 228,150 254,134 280,152 330,232 360,250 360,440 0,440" className="fj-ph-far" />
        <polygon points="0,330 80,304 170,324 260,296 360,318 360,440 0,440" className="fj-ph-near" />
        <path
          className="fj-draw"
          d="M0 270 L48 232 L92 172 Q118 150 144 176 L188 230 L228 150 Q254 124 280 152 L330 232 L360 250"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="fj-draw"
          d="M150 80 q8 -6 16 0 q8 -6 16 0 M196 62 q6 -5 12 0 q6 -5 12 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
      </svg>
      <h1 className="fj-hero-title">
        {site.hero.title} <span className="fj-hand">{site.hero.line}</span>
      </h1>
      <a className="fj-stamp" href={whatsAppLink(site.contacts.whatsapp)} aria-label={t("stampLabel")}>
        <svg viewBox="0 0 112 112" className="fj-spin" aria-hidden="true">
          <defs>
            <path id="fj-stamp-ring" d="M56 56 m-40 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0" />
          </defs>
          <text className="fj-stamp-text">
            <textPath href="#fj-stamp-ring">{t("stamp")}</textPath>
          </text>
        </svg>
        <span className="fj-stamp-dot">
          <Glyph name="chat" />
        </span>
      </a>
    </section>
  );
}
