import { useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PageHeader } from "../components/PageHeader";
import { Plate } from "../components/Plate";
import { Margin, MarginSlot } from "../components/Margin";
import { Heptagon, HeptagonHandle } from "../components/Heptagon";
import { DIMENSIONS, Profile } from "../content/dimensions";
import { Subject, EvidenceMap, DraftSubScores } from "../state/types";
import { buildExport, downloadJson, exportFilename } from "../export/json";
import { rasterisePlate } from "../export/png";
import { roleByKey } from "../content/targetProfiles";
import { SUB_QUESTIONS } from "../content/questions";

const LEVEL_KEYS = ["unaware", "beginner", "intermediate", "expert"] as const;

interface ResultsProps {
  subject: Subject;
  profile: Profile;
  subScores: DraftSubScores;
  evidence: EvidenceMap;
  onStartOver: () => void;
}

type DeltaMode = "off" | "baseline" | "target";

export function Results({ subject, profile, subScores, evidence, onStartOver }: ResultsProps) {
  const { t } = useTranslation();
  const heptRef = useRef<HeptagonHandle>(null);

  const role = roleByKey(subject.roleArchetype);
  const [deltaMode, setDeltaMode] = useState<DeltaMode>(role ? "target" : "baseline");

  // Materialise the role's target band as { min, max } profiles.
  const targetBand = useMemo(() => {
    if (!role) return undefined;
    const min = {} as Record<string, number>, max = {} as Record<string, number>;
    for (const d of DIMENSIONS) {
      const tr = role.targets[d.code];
      min[d.code] = tr.min;
      max[d.code] = tr.max;
    }
    return { min, max };
  }, [role]);

  // Serialise sub-scores into the plain Record shape the exporter wants.
  const scoreMap: Record<string, number[]> = {};
  for (const d of DIMENSIONS) {
    const s = subScores[d.code];
    scoreMap[d.code] = (s ?? []).filter((x): x is number => typeof x === "number");
  }

  const handleJson = () => {
    const doc = buildExport(subject, profile, evidence, scoreMap);
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
    { title: t("margin.reading.title"),  body: t("margin.reading.body") },
    { title: t("margin.profile.title"),  body: t("margin.profile.body") },
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
          <Heptagon
            ref={heptRef}
            profile={profile}
            targetBand={targetBand}
            deltaMode={deltaMode}
          />
        </Plate>
      </div>

      <MarginSlot>
        <Margin notes={notes} />
      </MarginSlot>

      <section className="results-block">
        <h2 className="landing-heading">{t("results.heading")}</h2>
        <p className="landing-body">
          {role
            ? t("results.body.withTarget", { role: t(`roles.${role.i18nKey}.name`) })
            : t("results.body")}
        </p>

        <div className="results-toolbar">
          <div className="mode-toggle" role="tablist" aria-label="Delta mode">
            <button
              type="button" role="tab"
              aria-selected={deltaMode === "off"}
              className={"mode-btn" + (deltaMode === "off" ? " is-active" : "")}
              onClick={() => setDeltaMode("off")}
            >{t("results.toggle.deltasOff")}</button>
            <button
              type="button" role="tab"
              aria-selected={deltaMode === "baseline"}
              className={"mode-btn" + (deltaMode === "baseline" ? " is-active" : "")}
              onClick={() => setDeltaMode("baseline")}
            >{t("results.toggle.deltasBaseline")}</button>
            {role && (
              <button
                type="button" role="tab"
                aria-selected={deltaMode === "target"}
                className={"mode-btn" + (deltaMode === "target" ? " is-active" : "")}
                onClick={() => setDeltaMode("target")}
              >{t("results.toggle.deltasTarget")}</button>
            )}
          </div>
        </div>

        <div className="landing-buttons">
          <button type="button" className="btn btn-primary"   onClick={handleJson}>{t("results.export.json")}</button>
          <button type="button" className="btn btn-secondary" onClick={handlePng}>{t("results.export.png")}</button>
          <button type="button" className="btn btn-ghost"     onClick={onStartOver}>{t("results.startOver")}</button>
        </div>

        <ol className="dim-cards">
          {DIMENSIONS.map((d) => {
            const mean = profile[d.code];
            const rounded = Math.max(0, Math.min(3, Math.round(mean)));
            const levelKey = LEVEL_KEYS[rounded];
            const ev = evidence[d.code];
            const below = mean < 1;
            const subs = (subScores[d.code] ?? []) as (number | undefined)[];
            const subIds = SUB_QUESTIONS[d.code];
            const roleTarget = role?.targets[d.code];
            return (
              <li key={d.code} className={"dim-card" + (below ? " is-below" : "")}>
                <header>
                  <span className="dim-card-code">{d.code}</span>
                  <span className="dim-card-level">
                    {t("results.dimensionCard.level", {
                      name: t(`levels.${levelKey}`),
                      mean: mean.toFixed(2)
                    })}
                  </span>
                </header>
                <h3>{t(`dimensions.${d.key}.full`)}</h3>
                {roleTarget && (
                  <p className="dim-card-target">
                    <span className="dim-card-target-label">Target:</span> {rangeLabel(roleTarget.min, roleTarget.max, t)} — <em>{roleTarget.rationale}</em>
                  </p>
                )}
                <div className="dim-card-subs">
                  <span className="dim-card-subs-label">{t("results.dimensionCard.subScores")}:</span>
                  <ul className="sub-score-list">
                    {subs.map((s, i) => (
                      <li key={subIds[i]} className="sub-score-item">
                        <span className="sub-score-id">{subIds[i]}</span>
                        <span className="sub-score-value">
                          {typeof s === "number" ? t(`levels.${LEVEL_KEYS[s]}`) : "—"}
                        </span>
                        <span className="sub-score-anchor">
                          {typeof s === "number"
                            ? t(`questions.${subIds[i]}.anchors.${LEVEL_KEYS[s]}`)
                            : t(`questions.${subIds[i]}.prompt`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {ev && <p className="dim-card-evidence"><em>&ldquo;{ev}&rdquo;</em></p>}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

function rangeLabel(min: number, max: number, t: (k: string) => string): string {
  const names = ["unaware", "beginner", "intermediate", "expert"];
  if (min === max) return t(`levels.${names[min]}`);
  return `${t(`levels.${names[min]}`)}–${t(`levels.${names[max]}`)}`;
}
