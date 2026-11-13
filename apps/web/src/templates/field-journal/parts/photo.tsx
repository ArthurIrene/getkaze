import type { IconKey, PhotoView } from "@getkaze/core";
import { Drawing } from "./icons";
import { LazyImg } from "./lazy-img";

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
    return <LazyImg src={photo.src} srcset={photo.srcset} sizes={sizes} alt={photo.alt} className={`fj-photo ${className}`} />;
  }
  return (
    <div role="img" aria-label={photo.alt} className={`fj-photo fj-ph ${className}`}>
      {icon ? <Drawing icon={icon} size={iconSize} stroke={2} /> : null}
    </div>
  );
}
