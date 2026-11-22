import type { PhotoView } from "@getkaze/core";

/** A plain  with srcset (480/960/1440 from SiteView), no image optimizer (D-068). */
export function PhotoSpot({
  photo,
  sizes = "100vw",
  eager = false,
  fetchPriority,
}: {
  photo: PhotoView;
  sizes?: string;
  eager?: boolean;
  fetchPriority?: "high" | "low" | "auto";
}) {
  if (!photo.src) {
    return <div role="img" aria-label={photo.alt} className="tl-ph" style={{ height: 300 }} />;
  }
  return (
    <img
      srcSet={photo.srcset}
      sizes={sizes}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={fetchPriority}
      decoding="async"
      className="tl-img"
    />
  );
}
