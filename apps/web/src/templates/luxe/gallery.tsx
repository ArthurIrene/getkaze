import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";
import { Gallery } from "./sections/gallery";

/** Luxe gallery page. */
export default function LuxeGallery(props: TemplateProps) {
  return (
    <LuxePage {...props}>
      <Gallery {...props} />
    </LuxePage>
  );
}
