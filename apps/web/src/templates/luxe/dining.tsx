import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";
import { Dining } from "./sections/dining";

/** Luxe dining page. */
export default function LuxeDining(props: TemplateProps) {
  return (
    <LuxePage {...props}>
      <Dining {...props} />
    </LuxePage>
  );
}
