import type { ComponentType } from "react";
import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";
import { Experiences } from "./sections/experiences";

/** Luxe experiences list page. */
export default function LuxeExperiences(props: TemplateProps) {
  return (
    <LuxePage {...props}>
      <Experiences {...props} />
    </LuxePage>
  );
}