import type { IconKey, PhotoView } from "@getkaze/core";
import { Drawing } from "./icons";

/**
 * A photo spot. Part 1 has no photos, so it shows a grey placeholder with
 * the spot's line drawing. A real photo (later) loads lazily.
 */
export function PhotoSpot({
  photo,
  icon,
  iconSize = 72,
  className = "",
}: {
  photo: PhotoView;
  icon?: IconKey;
  iconSize?: number;
  className?: string;
}) {
  if (photo.src) {
    // eslint-disable-next-line @next/next/no-img-element -- plain img: no Vercel image optimizer (D-035)
    return <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" className={`fj-photo ${className}`} />;
  }
  return (
    <div role="img" aria-label={photo.alt} className={`fj-photo fj-ph ${className}`}>
      {icon ? <Drawing icon={icon} size={iconSize} stroke={2} /> : null}
    </div>
  );
}
