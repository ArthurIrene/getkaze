import { getTranslations } from "next-intl/server";
import { describeChange, groupByDay, timeOfDay, type ChangeLogRow } from "@getkaze/core";

/**
 * The change log (specs/change-log-view.md): grouped by Kigali day, newest
 * first. Each row: who, what in plain words (field names, never values), when.
 * Support visits and our log reads are rows too. Admins also see the business and the email.
 */
export async function ChangeList({ rows, admin = false }: { rows: ChangeLogRow[]; admin?: boolean }) {
  const t = await getTranslations("Changes");
  if (!rows.length) return <p className="text-sm text-neutral-600">{t("empty")}</p>;
  return (
    <div className="flex flex-col gap-4">
      {groupByDay(rows).map((g) => (
        <section key={g.day} aria-label={g.day}>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">{g.day}</h2>
          <ol className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {g.rows.map((r) => {
              const d = r.kind === "change" ? describeChange(r) : null;
              const what = d
                ? [t(`area.${d.area}`), d.label, d.fields.length ? d.fields.map((f) => t(`field.${f}`)).join(", ") : t(`action.${r.action ?? "update"}`)].filter(Boolean).join(" · ")
                : t(`event.${r.kind as "support_start"}`, { reason: r.reason ?? "" });
              return (
                <li key={r.id} className="flex flex-col gap-0.5 px-4 py-3 text-sm" data-change={r.kind} data-actor={r.actor}>
                  <span className="font-medium">{what}</span>
                  <span className="text-xs text-neutral-600">
                    {t(`actor.${r.actor}`)}{admin && r.actor_email ? ` (${r.actor_email})` : ""} · {timeOfDay(r.at)}{admin ? ` · ${r.business_name}` : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
