import { getTranslations } from "next-intl/server";
import { formatStayDate, platform, privacyFacts } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";

/** Luxe privacy notice: one platform text per client, restyled under the Luxe shell. Draft banner while platform.privacyNotice.status is "draft". */
export default async function LuxePrivacy(props: TemplateProps) {
  const { site, locale } = props;
  const t = await getTranslations("Luxe");
  const p = await getTranslations("Privacy");
  const facts = privacyFacts(site, platform, locale);
  const { draft, registration, email, updated, ...text } = facts;
  const v = { ...text, email: email ?? "" };
  const sections: { id: string; title: string; paragraphs: string[] }[] = [
    {
      id: "who",
      title: p("who.title"),
      paragraphs: [
        t("privacyUpdated", { date: formatStayDate(updated, locale) }),
        p("who.body", v),
        facts.email ? p("who.contactEmail", v) : p("who.contact", v),
        p("who.processor", v),
        ...(registration ? [p("who.registration", { registration })] : []),
      ],
    },
    { id: "collect", title: p("collect.title"), paragraphs: [p("collect.body"), p("collect.logs")] },
    { id: "booking", title: p("booking.title"), paragraphs: [p("booking.body", v), p("booking.use", v)] },
    { id: "where", title: p("where.title"), paragraphs: [p("where.body", v)] },
    { id: "rights", title: p("rights.title"), paragraphs: [p("rights.body", v), p("rights.complain")] },
    { id: "changes", title: p("changes.title"), paragraphs: [p("changes.body")] },
  ];
  return (
    <LuxePage {...props} pages={props.pages}>
      <article className="tl-legal">
        <h1 className="tl-subpage-title">{t("privacyTitle")}</h1>
        {draft ? <p className="tl-muted tl-draft">{t("privacyDraft")}</p> : null}
        <p className="tl-muted">{t("privacyUpdated", { date: formatStayDate(updated, locale) })}</p>
        {sections.map((s) => (
          <section key={s.id} aria-labelledby={`tl-p-${s.id}`}>
            <h2 id={`tl-p-${s.id}`}>{s.title}</h2>
            {s.paragraphs.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </section>
        ))}
      </article>
    </LuxePage>
  );
}
