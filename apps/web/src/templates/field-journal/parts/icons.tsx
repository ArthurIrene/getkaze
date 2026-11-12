import type { IconKey } from "@getkaze/core";

/** Field Journal line drawings (from mockups/canvas/T1-Home.dc.html). */
const drawings: Record<IconKey, { box: string; d: string }> = {
  park: { box: "0 0 32 32", d: "M3 26 L12 10 L17 18 L21 12 L29 26 Z" },
  breakfast: { box: "0 0 32 32", d: "M7 14 h16 v7 a6 6 0 0 1 -6 6 h-4 a6 6 0 0 1 -6 -6 Z M23 16 h2 a3 3 0 0 1 0 6 h-2 M12 10 q-2 -3 0 -6 M17 10 q-2 -3 0 -6" },
  permit: { box: "0 0 32 32", d: "M5 9 h22 v5 a3 3 0 0 0 0 6 v5 h-22 v-5 a3 3 0 0 0 0 -6 Z M13 9 v16" },
  coffee: { box: "0 0 64 64", d: "M16 26 h28 v14 a12 12 0 0 1 -12 12 h-4 a12 12 0 0 1 -12 -12 Z M44 30 h4 a5 5 0 0 1 0 10 h-4 M26 20 q-3 -5 0 -10 M34 20 q-3 -5 0 -10" },
  fire: { box: "0 0 64 64", d: "M32 52 C18 52 18 36 26 28 C26 36 32 36 32 30 C32 22 38 18 38 12 C46 22 48 30 44 40 C42 48 38 52 32 52 Z M16 56 h32" },
  garden: { box: "0 0 64 64", d: "M32 56 V30 M32 30 C22 30 18 22 18 14 C28 14 32 22 32 30 C32 22 36 14 46 14 C46 22 42 30 32 30 Z M20 56 h24" },
  stars: { box: "0 0 64 64", d: "M10 50 L24 30 L32 40 L40 26 L54 50 M20 14 l2 4 l4 1 l-4 1 l-2 4 l-2 -4 l-4 -1 l4 -1 Z M44 12 v4 M42 14 h4" },
  trek: { box: "0 0 48 32", d: "M2 28 L16 8 L24 18 L30 10 L46 28" },
  monkey: { box: "0 0 48 32", d: "M8 28 Q8 12 24 12 Q40 12 40 28 M18 12 Q18 4 24 4 Q30 4 30 12" },
  cave: { box: "0 0 48 32", d: "M4 28 Q24 -4 44 28 M16 28 Q24 14 32 28" },
  lake: { box: "0 0 52 32", d: "M2 18 Q8 14 14 18 T26 18 T38 18 T50 18 M2 26 Q8 22 14 26 T26 26 T38 26" },
  village: { box: "0 0 48 32", d: "M8 28 L8 16 L24 4 L40 16 L40 28 M20 28 L20 20 L28 20 L28 28" },
  grill: { box: "0 0 48 48", d: "M6 42 L42 6 M14 34 l6 -6 M20 28 l6 -6 M26 22 l6 -6 M12 28 l8 8 M18 22 l8 8 M24 16 l8 8" },
  stew: { box: "0 0 48 48", d: "M6 24 h36 a18 14 0 0 1 -36 0 Z M14 18 q4 -6 10 -2 q6 -6 10 2" },
};

export function Drawing({ icon, size, stroke = 1.6 }: { icon: IconKey; size: number; stroke?: number }) {
  const { box, d } = drawings[icon];
  return (
    <svg viewBox={box} width={size} height={size} aria-hidden="true" className="fj-icon">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Small UI glyphs (24 × 24). */
const glyphs = {
  pin: "M12 21 s-7 -6.5 -7 -11.5 a7 7 0 0 1 14 0 c0 5 -7 11.5 -7 11.5 Z M12 12.5 a2.5 2.5 0 1 0 0 -5 a2.5 2.5 0 1 0 0 5",
  call: "M5 4 h4 l2 5 l-2.5 1.5 a11 11 0 0 0 5 5 L15 13 l5 2 v4 a2 2 0 0 1 -2 2 A16 16 0 0 1 3 6 a2 2 0 0 1 2 -2",
  chat: "M4 20 L5.5 15.5 A8 8 0 1 1 8.5 18.5 Z",
  mail: "M3 6 H21 V18 H3 Z M3 6 L12 13 L21 6",
  out: "M14 4 H20 V10 M20 4 L11 13 M18 14 V20 H4 V6 H10",
} as const;

export function Glyph({ name, size = 22 }: { name: keyof typeof glyphs; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={glyphs[name]} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
