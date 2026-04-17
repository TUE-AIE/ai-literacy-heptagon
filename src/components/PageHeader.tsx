import { Trans, useTranslation } from "react-i18next";

/**
 * The hero header: kicker, hanging display title, italic lede.
 * Title is assembled via <Trans> so the two lines translate independently.
 */
export function PageHeader() {
  const { t } = useTranslation();
  return (
    <header>
      <p className="kicker">
        {/* Render the kicker with decorated dots around the centre-dots. */}
        {t("app.kicker").split("·").map((seg, i, arr) => (
          <span key={i}>
            {seg.trim()}
            {i < arr.length - 1 && <span className="dot">·</span>}
          </span>
        ))}
      </p>
      <h1 className="hanging">
        {t("app.title.line1")}<br />
        <em><Trans i18nKey="app.title.line2" /></em>
      </h1>
      <p className="lede">{t("app.lede")}</p>
    </header>
  );
}
