import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import nl from "./locales/nl.json";

const STORAGE_KEY = "ailh.lang";

const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
const initial = stored === "nl" || stored === "en"
  ? stored
  : (typeof navigator !== "undefined" && navigator.language?.startsWith("nl") ? "nl" : "en");

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      nl: { translation: nl }
    },
    lng: initial,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: {
      // Let <Trans> pass these tags through as real elements instead of escaping them.
      transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p", "em"]
    }
  });

i18n.on("languageChanged", (lng) => {
  try { window.localStorage.setItem(STORAGE_KEY, lng); } catch { /* noop */ }
  document.documentElement.lang = lng;
});

document.documentElement.lang = initial;

export default i18n;
