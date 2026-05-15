import { useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PageHeader } from "../components/PageHeader";
import { Plate } from "../components/Plate";
import { Margin, MarginSlot } from "../components/Margin";
import { Heptagon, HeptagonHandle } from "../components/Heptagon";
import { DIMENSIONS, Profile } from "../content/dimensions";
import { Subject, EvidenceMap, DraftSubScores, PilotFeedback } from "../state/types";
import { buildExport, downloadJson, exportFilename } from "../export/json";
import { rasterisePlate } from "../export/png";
import { SUB_QUESTIONS } from "../content/questions";
import { GENERAL_RESOURCES, PER_DIMENSION_RESOURCES, Resource } from "../content/resources";

const LEVEL_KEYS = ["unaware", "beginner", "intermediate", "expert"] as const;

interface ResultsProps {
  subject: Subject;
  profile: Profile;
  subScores: DraftSubScores;
  evidence: EvidenceMap;
  onStartOver: () => void;
}

type DeltaMode = "off" | "baseline";

/**
 * Map a fractional mean (0..3) to a level key using floor-based thresholds:
 *   0.00–0.99 → unaware     1.00–1.99 → beginner
 *   2.00–2.99 → intermediate  exactly 3.00 → expert
 * A user must strictly exceed each integer to advance to the next level —
 * 1.5 stays Beginner, matching the V3 pedagogical intent.
 */
function levelKeyFor(mean: number): typeof LEVEL_KEYS[number] {
  if (mean >= 3) return "expert";
  const idx = Math.max(0, Math.min(2, Math.floor(mean)));
  return LEVEL_KEYS[idx];
}

export function Results({ subject, profile, subScores, evidence, onStartOver }: ResultsProps) {
  const { t } = useTranslation();
  const heptRef = useRef<HeptagonHandle>(null);

  const [deltaMode, setDeltaMode] = useState<DeltaMode>("baseline");
  const [pilotClarity, setPilotClarity] = useState<PilotFeedback["clarity"]>();
  const [pilotNotes, setPilotNotes] = useState("");

  const scoreMap: Record<string, number[]> = {};
  for (const d of DIMENSIONS) {
    const s = subScores[d.code];
    scoreMap[d.code] = (s ?? []).filter((x): x is number => typeof x === "number");
  }

  const collectPilot = (): PilotFeedback | null => {
    const notes = pilotNotes.trim();
    if (!pilotClarity && !notes) return null;
    const out: PilotFeedback = {};
    if (pilotClarity) out.clarity = pilotClarity;
    if (notes) out.notes = notes;
    return out;
  };

  const handleJson = () => {
    const doc = buildExport(subject, profile, evidence, scoreMap, collectPilot());
    downloadJson(doc, exportFilename(subject));
  };
  const handlePng = async () => {
    const svg = heptRef.current?.getSvg();
    if (!svg) return;
    const name = exportFilename(subject).replace(/\.json$/, ".png");
    await rasterisePlate(svg, name);
  };

  const subjectLabel = subject.name || "self";

  const notes = [
    { title: t("margin.reading.title"),  body: t("margin.reading.body") },
    { title: t("margin.profile.title"),  body: t("margin.profile.body") },
    { title: t("margin.interaction.title"), body: t("margin.interaction.body") }
  ];

  const hasGeneralResources = GENERAL_RESOURCES.length > 0;
  const hasAnyPerDimResources = DIMENSIONS.some((d) => (PER_DIMENSION_RESOURCES[d.code]?.length ?? 0) > 0);
  const hasAnyResources = hasGeneralResources || hasAnyPerDimResources;

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
            deltaMode={deltaMode}
          />
        </Plate>
      </div>

      <MarginSlot>
        <Margin notes={notes} />
      </MarginSlot>

      <section className="results-block">
        <h2 className="landing-heading">{t("results.heading")}</h2>
        <p className="landing-body">{t("results.body")}</p>

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
            const levelKey = levelKeyFor(mean);
            const ev = evidence[d.code];
            const below = mean < 1;
            const subs = (subScores[d.code] ?? []) as (number | undefined)[];
            const subIds = SUB_QUESTIONS[d.code];
            const dimResources = PER_DIMENSION_RESOURCES[d.code] ?? [];
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
                <div className="dim-card-subs">
                  <span className="dim-card-subs-label">{t("results.dimensionCard.subScores")}:</span>
                  <ul className="sub-score-list">
                    {subs.map((s, i) => (
                      <li key={subIds[i]} className="sub-score-item">
                        <span className="sub-score-id">{subIds[i]}</span>
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
                {dimResources.length > 0 && (
                  <ResourceList resources={dimResources} compact />
                )}
              </li>
            );
          })}
        </ol>

        <section className="pilot-feedback">
          <h3>{t("pilotFeedback.heading")}</h3>
          <p className="pilot-body">{t("pilotFeedback.body")}</p>
          <fieldset className="pilot-clarity">
            <legend>{t("pilotFeedback.clarity.label")}</legend>
            {(["yes", "somewhat", "no"] as const).map((opt) => (
              <label key={opt} className={"pilot-choice" + (pilotClarity === opt ? " is-selected" : "")}>
                <input
                  type="radio"
                  name="pilot-clarity"
                  value={opt}
                  checked={pilotClarity === opt}
                  onChange={() => setPilotClarity(opt)}
                />
                <span>{t(`pilotFeedback.clarity.${opt}`)}</span>
              </label>
            ))}
          </fieldset>
          <div className="pilot-notes-field">
            <label htmlFor="pilot-notes">{t("pilotFeedback.notes.label")}</label>
            <textarea
              id="pilot-notes"
              rows={3}
              placeholder={t("pilotFeedback.notes.placeholder")}
              value={pilotNotes}
              onChange={(e) => setPilotNotes(e.target.value)}
            />
          </div>
        </section>

        {hasAnyResources && (
          <section className="resources-block">
            <h3>{t("resources.heading")}</h3>
            <p className="resources-body">{t("resources.body")}</p>
            {hasGeneralResources && (
              <div className="resources-general">
                <h4>{t("resources.general.title")}</h4>
                <ResourceList resources={GENERAL_RESOURCES} />
              </div>
            )}
            {hasAnyPerDimResources && (
              <div className="resources-per-dim">
                <h4>{t("resources.perDimension.title")}</h4>
                <ul className="resources-per-dim-list">
                  {DIMENSIONS.map((d) => {
                    const items = PER_DIMENSION_RESOURCES[d.code];
                    if (!items?.length) return null;
                    return (
                      <li key={d.code} className="resources-per-dim-item">
                        <span className="resources-dim-code">{d.code}</span>
                        <span className="resources-dim-name">{t(`dimensions.${d.key}.full`)}</span>
                        <ResourceList resources={items} compact />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

function ResourceList({ resources, compact = false }: { resources: Resource[]; compact?: boolean }) {
  return (
    <ul className={"resource-list" + (compact ? " is-compact" : "")}>
      {resources.map((r, i) => (
        <li key={i} className="resource-item">
          <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>
          {r.by && <span className="resource-by"> — {r.by}</span>}
          <span className={"resource-kind resource-kind--" + r.kind}>{r.kind}</span>
        </li>
      ))}
    </ul>
  );
}
