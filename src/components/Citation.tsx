import { useTranslation, Trans } from "react-i18next";

const ARXIV_URL = "https://arxiv.org/abs/2509.18900";

/**
 * Prominent attribution for the Hackl/Müller/Sailer 2025 paper on which
 * this instrument is based. Designed to read as a bibliographic citation
 * in keeping with the Editorial Diagram aesthetic — full-width band with
 * double hairline rules, set in serif with a mono label.
 */
export function Citation() {
  const { t } = useTranslation();
  return (
    <aside className="citation" aria-label="Source attribution">
      <span className="citation-label">{t("citation.label")}</span>
      <div className="citation-body">
        <p className="citation-ref">
          <Trans i18nKey="citation.body" />
          {" "}
          <span className="citation-venue">{t("citation.venue")}</span>
          {" "}
          <a href={ARXIV_URL} target="_blank" rel="noreferrer" className="citation-link">
            {t("citation.linkLabel")}&nbsp;↗
          </a>
        </p>
        <p className="citation-note">{t("citation.note")}</p>
      </div>
    </aside>
  );
}
