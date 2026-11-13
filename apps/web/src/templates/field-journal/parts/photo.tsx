import type { IconKey, PhotoView } from "@getkaze/core";
import { Drawing } from "./icons";

/**
 * A photo spot: the owner's photo (sizes from the device, plain srcset,
 * lazy below the fold), or a grey placeholder with the spot's line drawing.
 */
export function PhotoSpot({
  photo,
  icon,
  iconSize = 72,
  className = "",
  sizes = "(min-width: 760px) 50vw, 100vw",
}: {
  photo: PhotoView;
  icon?: IconKey;
  iconSize?: number;
  className?: string;
  sizes?: string;
}) {
  if (photo.src) {
    // eslint-disable-next-line @next/next/no-img-element -- plain img: no Vercel image optimizer (D-035)
    return <img src={photo.src} srcSet={photo.srcset} sizes={photo.srcset ? sizes : undefined} alt={photo.alt} loading="lazy" decoding="async" className={`fj-photo ${className}`} />;
  }
  return (
    <div role="img" aria-label={photo.alt} className={`fj-photo fj-ph ${className}`}>
      {icon ? <Drawing icon={icon} size={iconSize} stroke={2} /> : null}
    </div>
  );
}
