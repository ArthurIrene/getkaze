"use client";

import { useState } from "react";

/** "Use my location": fills the latitude and longitude fields from the phone (no map library). */
export function LocateButton({ label, busy, failed }: { label: string; busy: string; failed: string }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  return (
    <div className="flex flex-col gap-1">
      <button type="button" className="h-11 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold"
        onClick={() => {
          if (!navigator.geolocation) return setState("failed");
          setState("busy");
          navigator.geolocation.getCurrentPosition(
            (p) => {
              const set = (name: string, v: number) => {
                const el = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
                if (el) el.value = v.toFixed(6);
              };
              set("lat", p.coords.latitude);
              set("lng", p.coords.longitude);
              setState("idle");
            },
            () => setState("failed"),
            { enableHighAccuracy: true, timeout: 15000 },
          );
        }}>
        {state === "busy" ? busy : label}
      </button>
      {state === "failed" ? <p role="alert" className="text-xs text-red-700">{failed}</p> : null}
    </div>
  );
}
