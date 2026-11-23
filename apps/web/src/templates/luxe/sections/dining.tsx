import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";
import { pageHref } from "../parts/links";

export async function Dining({ site, locale }: TemplateProps) {
  const t = await getTranslations("Luxe");
  const dishes = site.dining.dishes;
  const groups = site.groups ?? [];

  const dishesByGroup = new Map<string, typeof dishes>();
  const ungrouped: typeof dishes = [];
  for (const d of dishes) {
    if (d.groupId) {
      const arr = dishesByGroup.get(d.groupId) ?? [];
      arr.push(d);
      dishesByGroup.set(d.groupId, arr);
    } else {
      ungrouped.push(d);
    }
  }

  // Photo budget: PhotoSpot for the first 4 dishes that have a photo src,
  // text cards for the rest. Pre-compute the set so no variable is reassigned during render.
  const photoIds = new Set<string>();
  let budget = 4;
  for (const g of groups.slice().sort((a, b) => a.position - b.position)) {
    for (const d of dishesByGroup.get(g.id) ?? []) {
      if (budget > 0 && d.photo && d.photo.src) { photoIds.add(d.id); budget -= 1; }
    }
  }
  for (const d of ungrouped) {
    if (budget > 0 && d.photo && d.photo.src) { photoIds.add(d.id); budget -= 1; }
  }

  const dishCard = (d: typeof dishes[number], groupId: string) => (
    <li key={d.id} className="tl-dish-card">
      {photoIds.has(d.id) && (
        <PhotoSpot
          photo={d.photo!}
          sizes="(min-width: 760px) 50vw, (min-width: 480px) 80vw, 100vw"
        />
      )}
      <h3 className="tl-dish-name">{d.name}</h3>
      {d.body && <p className="tl-dish-desc">{d.body}</p>}
      <p className="tl-dish-price">{d.price.rwf} RWF / {d.price.usd} USD</p>
      {d.signature && <span className="tl-badge tl-badge--signature">{t("diningSignature")}</span>}
      <a href={`${pageHref("myStay", locale)}?group=${groupId}&item=${d.id}`} className="tl-dish-reserve">
        {t("diningReserve")}
      </a>
    </li>
  );

  return (
    <section className="tl-section tl-dining" aria-labelledby="tl-dining">
      <h2 id="tl-dining" className="tl-section-title">{site.dining.name}</h2>
      <p className="tl-section-line">{t("diningLine")}</p>
      {groups.length > 0 ? (
        <>
          {groups
            .slice()
            .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
            .map((g: { id: string; name: string; position: number }) => {
              const items = dishesByGroup.get(g.id) ?? [];
              if (items.length === 0) return null;
              return (
                <div key={g.id} className="tl-dining-group">
                  <h3 className="tl-dining-group-title">{g.name}</h3>
                  <ul className="tl-grid tl-dish-grid">{items.map((d) => dishCard(d, g.id))}</ul>
                </div>
              );
            })}
          {ungrouped.length > 0 && (
            <div className="tl-dining-group">
              <h3 className="tl-dining-group-title">{t("diningOther")}</h3>
              <ul className="tl-grid tl-dish-grid">{ungrouped.map((d) => dishCard(d, ""))}</ul>
            </div>
          )}
        </>
      ) : (
        <ul className="tl-grid tl-dish-grid">{dishes.map((d) => dishCard(d, ""))}</ul>
      )}
    </section>
  );
}
