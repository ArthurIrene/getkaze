"use client";

import { useState, type ReactNode } from "react";
import { photoLimits, widthsFor, type PhotoWidth } from "@getkaze/core";

type UploadResult = { ok: true; id: string } | { ok: false; error: string };
type Labels = { pick: string; working: string; uploading: string; tooBig: string; notImage: string; failed: string; save: string };

/** Encode a canvas, stepping the quality down until the file is under the target (and always under the hard limit). */
async function encode(canvas: HTMLCanvasElement, type: "image/webp" | "image/jpeg", target: number): Promise<Blob | null> {
  let last: Blob | null = null;
  for (let q = 0.82; q >= 0.25; q -= 0.08) {
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, type, q));
    if (!blob || blob.type !== type) return null; // this browser cannot encode this type
    last = blob;
    if (blob.size <= target) return blob;
  }
  return last && last.size <= photoLimits.fileBytes ? last : null;
}

/**
 * Make the photo's sizes on the phone (approved point 4): 480, 960 and 1440 px
 * wide (no upscaling), WebP, or JPEG where the browser cannot make WebP. The
 * redraw drops EXIF (and any GPS position). Only the small files are sent.
 */
async function shrink(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const widths = widthsFor(bitmap.width);
  const files = new Map<PhotoWidth, Blob>();
  let type: "image/webp" | "image/jpeg" = "image/webp";
  let width = 0;
  let height = 0;
  for (const w of widths) {
    const cw = Math.min(w, bitmap.width);
    const ch = Math.round((bitmap.height * cw) / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, cw, ch);
    let blob = await encode(canvas, type, photoLimits.targetBytes[w]);
    if (!blob && type === "image/webp" && files.size === 0) {
      type = "image/jpeg";
      blob = await encode(canvas, type, photoLimits.targetBytes[w]);
    }
    if (!blob) throw new Error("encode");
    files.set(w, blob);
    width = cw;
    height = ch;
  }
  bitmap.close();
  return { files, type, width, height };
}

export function PhotoUpload({ action, hidden, labels, children, doneHref }: {
  action: (form: FormData) => Promise<UploadResult>;
  hidden: Record<string, string>;
  labels: Labels;
  children: ReactNode;
  doneHref: string;
}) {
  const [state, setState] = useState<{ step: "idle" | "working" | "uploading"; error?: string }>({ step: "idle" });
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const file = form.get("original");
        form.delete("original");
        if (!(file instanceof File) || !file.size) return setState({ step: "idle", error: labels.notImage });
        if (!file.type.startsWith("image/")) return setState({ step: "idle", error: labels.notImage });
        if (file.size > photoLimits.originalBytes) return setState({ step: "idle", error: labels.tooBig });
        let made: Awaited<ReturnType<typeof shrink>>;
        try {
          setState({ step: "working" });
          made = await shrink(file);
        } catch {
          return setState({ step: "idle", error: labels.notImage });
        }
        try {
          const ext = made.type === "image/jpeg" ? "jpg" : "webp";
          for (const [w, blob] of made.files) form.set(`file.${w}`, new File([blob], `${w}.${ext}`, { type: made.type }));
          for (const [k, v] of Object.entries(hidden)) form.set(k, v);
          form.set("photo", crypto.randomUUID());
          form.set("format", ext);
          form.set("width", String(made.width));
          form.set("height", String(made.height));
          setState({ step: "uploading" });
          const result = await action(form);
          if (!result.ok) return setState({ step: "idle", error: `${labels.failed} (${result.error})` });
          window.location.assign(doneHref.replace("__ID__", result.id));
        } catch {
          setState({ step: "idle", error: labels.failed });
        }
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        {labels.pick}
        <input name="original" type="file" accept="image/*" required className="text-base" />
      </label>
      {children}
      {state.error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p> : null}
      <button type="submit" disabled={state.step !== "idle"} className="h-12 rounded-lg bg-neutral-900 text-base font-semibold text-white disabled:opacity-60">
        {state.step === "working" ? labels.working : state.step === "uploading" ? labels.uploading : labels.save}
      </button>
    </form>
  );
}
