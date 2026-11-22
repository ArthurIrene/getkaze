import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";
import { pageHref } from "./parts/links";

export default async function LuxeMyStay(props: TemplateProps) {
  const { site, locale, pages, query = {} } = props;
  const t = await getTranslations("Luxe");
  const item = query.item as string | undefined;
  const group = query.group as "room" | "experience" | "dining" | undefined;
  const checkIn = query.checkIn as string | undefined;
  const checkOut = query.checkOut as string | undefined;
  const adults = query.adults as string | undefined;
  const children = query.children as string | undefined;
  const error = query.error as string | undefined;

  const pickedItem = site.rooms.find((r: typeof site.rooms[0]) => r.id === item) ?? site.activities.find((a: typeof site.activities[0]) => a.id === item) ?? site.dining.dishes.find((d: typeof site.dining.dishes[0]) => d.id === item);

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  let itemLabel = "";
  if (group === "room" && pickedItem) {
    itemLabel = t("myStayItemRoom", { name: pickedItem.name });
  } else if (group === "experience" && pickedItem) {
    itemLabel = t("myStayItemExperience", { name: pickedItem.name });
  } else if (group === "dining" && pickedItem) {
    itemLabel = t("myStayItemDining", { name: pickedItem.name });
  }

  return (
    <LuxePage {...props} pages={pages}>
      <div className="tl-subpage-head">
        <h1 className="tl-subpage-title">{t("myStayTitle")}</h1>
        <span className="tl-subpage-line">{t("myStayLine")}</span>
      </div>

      <form id="tl-my-stay" className="tl-my-stay" method="post" action={`${pageHref("myStay", locale, site.linkBase)}/send`}>
        <fieldset className="tl-step">
          <legend className="tl-mono">{t("myStayItems")}</legend>
          <div className="tl-my-stay-items">
            {itemLabel ? (
              <div className="tl-my-stay-item">
                <input type="hidden" name="item" value={item} />
                <input type="hidden" name="group" value={group} />
                <span>{itemLabel}</span>
              </div>
            ) : (
              <p className="tl-muted">{t("myStayNoItems")}</p>
            )}
          </div>
        </fieldset>

        <fieldset className="tl-step">
          <legend className="tl-mono">{t("myStayDates")}</legend>
          <div className="tl-pair">
            <label className="tl-field">
              <span>{t("myStayCheckIn")}</span>
              <input type="date" name="checkIn" required min={today} max={maxDateStr} defaultValue={checkIn} />
              {error === "dates" && <span className="tl-field-error">{t("myStayErrorDates")}</span>}
            </label>
            <label className="tl-field">
              <span>{t("myStayCheckOut")}</span>
              <input type="date" name="checkOut" required min={today} max={maxDateStr} defaultValue={checkOut} />
            </label>
          </div>
        </fieldset>

        <fieldset className="tl-step">
          <legend className="tl-mono">{t("myStayGuests")}</legend>
          <div className="tl-pair">
            <label className="tl-field">
              <span>{t("myStayAdults")}</span>
              <input type="number" name="adults" required min={1} max={10} defaultValue={adults || "2"} inputMode="numeric" />
              {error === "guests" && pickedItem && "maxGuests" in pickedItem && <span className="tl-field-error">{t("myStayErrorGuests", { n: pickedItem.maxGuests })}</span>}
            </label>
            <label className="tl-field">
              <span>{t("myStayChildren")}</span>
              <input type="number" name="children" min={0} max={10} defaultValue={children || "0"} inputMode="numeric" />
            </label>
          </div>
        </fieldset>

        <fieldset className="tl-step">
          <legend className="tl-mono">{t("myStayDetails")}</legend>
          <label className="tl-field">
            <span>{t("myStayName")}</span>
            <input type="text" name="name" required maxLength={80} autoComplete="name" />
            {error === "missing" && <span className="tl-field-error">{t("myStayErrorMissing")}</span>}
          </label>
          <label className="tl-field">
            <span>{t("myStayNote")}</span>
            <textarea name="note" rows={3} maxLength={500} placeholder={t("myStayNotePlaceholder")} />
          </label>
        </fieldset>

        <fieldset className="tl-step">
          <legend className="tl-mono">{t("myStaySend")}</legend>
          <div className="tl-send">
            <button type="submit" name="via" value="whatsapp" className="tl-btn tl-btn-accent">
              {t("myStaySend")}
            </button>
          </div>
          <p className="tl-my-stay-privacy tl-muted">{t("myStayPrivacy")}</p>
          <p className="tl-send-note tl-muted">{t("myStaySendNote", { name: site.name })}</p>
        </fieldset>
      </form>
    </LuxePage>
  );
}