import { getTranslations } from "next-intl/server";
import type { SiteView } from "@getkaze/core";

export async function Footer({ site }: { site: SiteView }) {
  const t = await getTranslations("FieldJournal");
  return (
    <footer className="fj-footer">
      <span className="fj-footer-name">{site.name}</span>
      <span className="fj-hand fj-footer-welcome">{t("welcome")}</span>
      <small>{t("copyright", { name: site.legalName })}</small>
    </footer>
  );
}
