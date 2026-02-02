import { getRequestConfig } from "next-intl/server";
import { routing } from "./src/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./src/i18n/messages/${locale}.json`)).default,
    timeZone: "Europe/Vienna", // Austria timezone for EMS operations
  };
});
