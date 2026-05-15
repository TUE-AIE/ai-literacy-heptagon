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
  onStart: () => void;
  onResume?: (draft: AssessmentDraft) => void;
  draft?: AssessmentDraft | null;
}

export function Landing({ onStart, onResume, draft }: LandingProps) {
  const { t } = useTranslation();
  const [reveal, setReveal] = useState(0);
  const [consented, setConsented] = useState(false);

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

        <p className="whats-new">{t("landing.whatsNew")}</p>

        <IntroBlock />

        <section className="landing-cta">
          <h2 className="landing-heading">{t("landing.heading")}</h2>
          <p className="landing-body">{t("landing.body")}</p>

          <label className="consent-row">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
            />
            <span>{t("consent.label")}</span>
          </label>

          <div className="landing-buttons">
            <button
              className="btn btn-primary"
              type="button"
              disabled={!consented}
              onClick={() => onStart()}
              aria-describedby={!consented ? "consent-hint" : undefined}
            >
              {t("landing.cta.individual")}
            </button>
            {draft && onResume && (
              <button
                className="btn btn-ghost"
                type="button"
                disabled={!consented}
                onClick={() => onResume(draft)}
              >
                {t("landing.cta.resume")}
              </button>
            )}
          </div>
          {!consented && (
            <p id="consent-hint" className="consent-hint">{t("consent.required")}</p>
          )}

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

/** Always-visible intro explaining the tool's purpose. */
function IntroBlock() {
  const { t } = useTranslation();
  return (
    <section className="intro-block" aria-labelledby="intro-heading">
      <article>
        <h3 id="intro-heading">{t("intro.why.title")}</h3>
        <p>{t("intro.why.body.1")}</p>
        <p>{t("intro.why.body.2")}</p>
        <p>{t("intro.why.body.3")}</p>
      </article>

      <article>
        <h3>{t("intro.what.title")}</h3>
        <p>{t("intro.what.body.1")}</p>
        <p>{t("intro.what.body.2")}</p>
      </article>

      <article>
        <h3>{t("intro.reasons.title")}</h3>
        <h4>{t("intro.reasons.1.title")}</h4>
        <p>{t("intro.reasons.1.body")}</p>
        <h4>{t("intro.reasons.2.title")}</h4>
        <p>{t("intro.reasons.2.body")}</p>
        <h4>{t("intro.reasons.3.title")}</h4>
        <p>{t("intro.reasons.3.body")}</p>
      </article>

      <article className="intro-not">
        <h3>{t("intro.notATest.title")}</h3>
        <p>{t("intro.notATest.body")}</p>
      </article>

      <article>
        <h3>{t("intro.approach.title")}</h3>
        <p>{t("intro.approach.body.1")}</p>
        <p>{t("intro.approach.body.2")}</p>
      </article>
    </section>
  );
}
