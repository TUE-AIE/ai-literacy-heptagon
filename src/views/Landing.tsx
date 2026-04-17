import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PageHeader } from "../components/PageHeader";
import { Plate } from "../components/Plate";
import { Margin, MarginSlot } from "../components/Margin";
import { Heptagon } from "../components/Heptagon";
import { Citation } from "../components/Citation";
import { SAMPLE_PROFILE } from "../content/dimensions";
import { AssessmentDraft } from "../state/types";

interface LandingProps {
  onStart: (mode: "individual" | "team") => void;
  onResume?: (draft: AssessmentDraft) => void;
  onOpenAggregator?: () => void;
  draft?: AssessmentDraft | null;
}

export function Landing({ onStart, onResume, onOpenAggregator, draft }: LandingProps) {
  const { t } = useTranslation();
  const [reveal, setReveal] = useState(0);

  const notes = [
    { title: t("margin.reading.title"),     body: t("margin.reading.body") },
    { title: t("margin.profile.title"),     body: t("margin.profile.body") },
    { title: t("margin.interaction.title"), body: t("margin.interaction.body") }
  ];

  return (
    <>
      <main className="page">
        <PageHeader />

        <div className="plate-slot">
          <Plate
            stamp={t("app.stamp")}
            captionLeft={<Trans i18nKey="figure.caption.title" />}
            captionRight={<Trans i18nKey="figure.caption.meta" />}
          >
            <Heptagon profile={SAMPLE_PROFILE} revealNonce={reveal} />
          </Plate>
        </div>

        <MarginSlot>
          <Margin notes={notes} />
        </MarginSlot>

        <section className="landing-cta">
          <h2 className="landing-heading">{t("landing.heading")}</h2>
          <p className="landing-body">{t("landing.body")}</p>
          <div className="landing-buttons">
            <button className="btn btn-primary"   type="button" onClick={() => onStart("individual")}>
              {t("landing.cta.individual")}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => onStart("team")}>
              {t("landing.cta.team")}
            </button>
            {draft && onResume && (
              <button className="btn btn-ghost" type="button" onClick={() => onResume(draft)}>
                {t("landing.cta.resume")}
              </button>
            )}
            {onOpenAggregator && (
              <button className="btn btn-ghost" type="button" onClick={onOpenAggregator}>
                {t("landing.cta.aggregator")}
              </button>
            )}
          </div>

          <div className="landing-notes">
            <div><h4>{t("landing.notes.time.title")}</h4>    <p>{t("landing.notes.time.body")}</p></div>
            <div><h4>{t("landing.notes.privacy.title")}</h4> <p>{t("landing.notes.privacy.body")}</p></div>
            <div><h4>{t("landing.notes.export.title")}</h4>  <p>{t("landing.notes.export.body")}</p></div>
          </div>
        </section>

        <Citation />
      </main>

      <button type="button" className="replay" onClick={() => setReveal((n) => n + 1)}>
        {t("app.replay")}
      </button>
    </>
  );
}
