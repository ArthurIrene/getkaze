import type { SiteView } from "@getkaze/core";

/** Drawn map card linking to the owner's map link (Google Maps). No embedded map, no iframe. */
export function MapCard({ site, label, here }: { site: SiteView; label: string; here: string }) {
  return (
    <a className="fj-map" href={site.location.mapUrl} aria-label={label}>
      <svg viewBox="0 0 328 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M0 156 Q90 124 160 138 T328 106" fill="none" stroke="var(--line)" strokeWidth="12" strokeLinecap="round" />
        <path d="M156 138 Q166 92 206 66" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeDasharray="5 5" />
        <path d="M236 48 l18 -26 l18 26 M266 52 l13 -18 l13 18" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="206" cy="66" r="10" fill="var(--accent)" />
        <circle cx="206" cy="66" r="4" fill="var(--paper)" />
      </svg>
      <span className="fj-hand fj-map-here">{here}</span>
      {site.location.distanceNote ? <span className="fj-mono fj-map-note">← {site.location.distanceNote}</span> : null}
    </a>
  );
}
