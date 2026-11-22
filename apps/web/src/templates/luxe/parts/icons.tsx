/** Small UI glyphs for the Luxe shell (SVG, no JavaScript). */
const glyphs: Record<string, string> = {
  call: "M5 4 h4 l2 5 l-2.5 1.5 a11 11 0 0 0 5 5 L15 13 l5 2 v4 a2 2 0 0 1 -2 2 A16 16 0 0 1 3 6 a2 2 0 0 1 2 -2",
  chat: "M4 20 L5.5 15.5 A8 8 0 1 1 8.5 18.5 Z",
} as const;

export function Glyph({ name, size = 22 }: { name: keyof typeof glyphs; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={glyphs[name]} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
