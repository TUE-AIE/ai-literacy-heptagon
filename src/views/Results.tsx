import { useRef } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PageHeader } from "../components/PageHeader";
import { Plate } from "../components/Plate";
import { Margin, MarginSlot } from "../components/Margin";
import { Heptagon, HeptagonHandle } from "../components/Heptagon";
import { DIMENSIONS, Profile } from "../content/dimensions";
import { Subject, EvidenceMap } from "../state/types";
import { buildExport, downloadJson, exportFilename } from "../export/json";
import { rasterisePlate } from "../export/png";

const LEVEL_KEYS = ["unaware", "beginner", "intermediate", "expert"] as const;

interface ResultsProps {
  subject: Subject;
  profile: Profile;
  evidence: EvidenceMap;
  onStartOver: () => void;
}

export function Results({ subject, profile, evidence, onStartOver }: ResultsProps) {
  const { t } = useTranslation();
  const heptRef = useRef<HeptagonHandle>(null);

  const handleJson = () => {
    const doc = buildExport(subject, profile, evidence);
    downloadJson(doc, exportFilename(subject));
  };
  const handlePng = async () => {
    const svg = heptRef.current?.getSvg();
    if (!svg) return;
    const name = exportFilename(subject).replace(/\.json$/, ".png");
    await rasterisePlate(svg, name);
  };

  const subjectLabel = subject.name
    || (subject.scope === "team" ? subject.team ?? "team" : "self");

  const notes = [
    { title: t("margin.reading.title"), body: t("margin.reading.body") },
    { title: t("margin.profile.title"), body: t("margin.profile.body") },
    { title: t("margin.interaction.title"), body: t("margin.interaction.body") }
  ];

  return (
    <main className="page">
      <PageHeader />

      <div className="plate-slot">
        <Plate
          stamp={t("app.stamp")}
          captionLeft={<Trans i18nKey="figure.caption.title" />}
          captionRight={`${subjectLabel.toUpperCase()} / ${new Date().toISOString().slice(0,10)}`}
        >
          <Heptagon ref={heptRef} profile={profile} />
        </Plate>
      </div>

      <MarginSlot>
        <Margin notes={notes} />
      </MarginSlot>

      <section className="results-block">
        <h2 className="landing-heading">{t("results.heading")}</h2>
        <p className="landing-body">{t("results.body")}</p>

        <div className="landing-buttons">
          <button type="button" className="btn btn-primary"   onClick={handleJson}>{t("results.export.json")}</button>
          <button type="button" className="btn btn-secondary" onClick={handlePng}>{t("results.export.png")}</button>
          <button type="button" className="btn btn-ghost"     onClick={onStartOver}>{t("results.startOver")}</button>
        </div>

        <ol className="dim-cards">
          {DIMENSIONS.map((d) => {
            const lvl = profile[d.code];
            const levelKey = LEVEL_KEYS[lvl];
            const ev = evidence[d.code];
            const below = lvl < 1;
            return (
              <li key={d.code} className={"dim-card" + (below ? " is-below" : "")}>
                <header>
                  <span className="dim-card-code">{d.code}</span>
                  <span className="dim-card-level">
                    {t("results.dimensionCard.level", { n: lvl, name: t(`levels.${levelKey}`) })}
                  </span>
                </header>
                <h3>{t(`dimensions.${d.key}.full`)}</h3>
                <p className="dim-card-anchor">{t(`anchors.${d.key}.${levelKey}`)}</p>
                {ev && <p className="dim-card-evidence"><em>&ldquo;{ev}&rdquo;</em></p>}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
