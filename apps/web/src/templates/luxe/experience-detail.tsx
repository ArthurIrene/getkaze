import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";
import { ExperienceDetail } from "./sections/experience-detail";

/** Luxe experience detail page. */
export default function LuxeExperienceDetail(props: TemplateProps) {
  return (
    <LuxePage {...props}>
      <ExperienceDetail {...props} />
    </LuxePage>
  );
}
