import { getTranslations } from "next-intl/server";
import { formatStayDate, platform, privacyFacts } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { FieldJournalPage } from "./parts/page";

/**
 * Privacy notice (specs/privacy-notice.md). DRAFT, PENDING LAWYER REVIEW:
 * one platform text for every client, filled from the business's data; the
 * page says it is a draft while platform.privacyNotice.status is "draft".
 */
export default async function FieldJournalPrivacy(props: TemplateProps) {
  const { site, locale } = props;
  const t = await getTranslations("Privacy");
  const facts = privacyFacts(site, platform, locale);
  // Message values: the text fields only (the draft flag is not a placeholder).
  const { draft, registration, ...text } = facts;
  const v = { ...text, email: facts.email ?? "" };
  const sections: { id: string; title: string; paragraphs: string[] }[] = [
    {
      id: "who",
      title: t("who.title"),
      paragraphs: [
        t("who.body", v),
        facts.email ? t("who.contactEmail", v) : t("who.contact", v),
        t("who.processor", v),
        ...(registration ? [t("who.registration", { registration })] : []),
      ],
    },
    { id: "collect", title: t("collect.title"), paragraphs: [t("collect.body"), t("collect.logs")] },
    { id: "booking", title: t("booking.title"), paragraphs: [t("booking.body", v), t("booking.use", v)] },
    { id: "where", title: t("where.title"), paragraphs: [t("where.body", v)] },
    { id: "rights", title: t("rights.title"), paragraphs: [t("rights.body", v), t("rights.complain")] },
    { id: "changes", title: t("changes.title"), paragraphs: [t("changes.body")] },
  ];
  return (
    <FieldJournalPage {...props} className="fj-subpage">
      <article className="fj-legal">
        <h1>{t("title")}</h1>
        {draft ? <p className="fj-mono fj-draft">{t("draft")}</p> : null}
        <p className="fj-muted">{t("updated", { date: formatStayDate(facts.updated, locale) })}</p>
        {sections.map((s) => (
          <section key={s.id} aria-labelledby={`fj-p-${s.id}`}>
            <h2 id={`fj-p-${s.id}`}>{s.title}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </article>
    </FieldJournalPage>
  );
}
