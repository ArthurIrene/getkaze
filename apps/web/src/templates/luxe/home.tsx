import Image from "next/image";
import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";

/** Luxe home (hero only for L2a). Read only. */
export default function LuxeHome(props: TemplateProps) {
  const { title, line, photo } = props.site.hero;
  return (
    <LuxePage {...props}>
      <section className="tl-hero">
        <h1 className="tl-hero-title">{title}</h1>
        <p className="tl-hero-line">{line}</p>
        {photo.src && (
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width ?? 480}
            height={photo.height ?? 320}
            priority
            className="mt-6 rounded-lg border border-solid"
          />
        )}
      </section>
    </LuxePage>
  );
}
