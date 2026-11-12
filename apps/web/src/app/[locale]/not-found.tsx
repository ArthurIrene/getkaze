import { getTranslations } from "next-intl/server";

/** Clean 404 for unknown, draft or paused sites and unknown hosts: no business data, noindex from the layout. */
export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6 text-neutral-800">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-neutral-600">{t("body")}</p>
    </main>
  );
}
