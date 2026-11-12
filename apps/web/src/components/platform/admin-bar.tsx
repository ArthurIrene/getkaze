import { getTranslations } from "next-intl/server";
import { platformHref } from "@/lib/auth/paths";
import { Submit } from "./shell";

/** Admin links and sign out, for every admin page header. */
export async function AdminBar({ locale }: { locale: string }) {
  const t = await getTranslations("Admin");
  const a = await getTranslations("Auth");
  return (
    <div className="flex items-center gap-3 text-sm">
      <a href={platformHref("/admin", locale)} className="underline">{t("clients")}</a>
      <a href={platformHref("/admin/new", locale)} className="underline">{t("newBusiness")}</a>
      <form action={platformHref("/auth/signout", locale)} method="post"><Submit tone="plain">{a("signOut")}</Submit></form>
    </div>
  );
}
