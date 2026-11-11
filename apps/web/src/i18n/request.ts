import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { withFallback, type Messages } from "./fallback";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const english = (await import("../../messages/en.json")).default as Messages;
  const messages =
    locale === routing.defaultLocale
      ? english
      : withFallback(
          english,
          (await import(`../../messages/${locale}.json`)).default as Messages,
        );

  return { locale, messages };
});
