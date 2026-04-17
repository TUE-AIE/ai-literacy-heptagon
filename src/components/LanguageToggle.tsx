import { useTranslation } from "react-i18next";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "nl", label: "NL" }
] as const;

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="lang-toggle" role="group" aria-label={t("app.languageToggle.aria")}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-pressed={current === l.code}
          onClick={() => i18n.changeLanguage(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
