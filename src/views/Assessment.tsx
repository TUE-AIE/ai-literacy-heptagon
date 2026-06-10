import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DIMENSIONS, Profile } from "../content/dimensions";
import { Heptagon, HeptagonProfile } from "../components/Heptagon";
import { Subject, DraftSubScores, EvidenceMap } from "../state/types";
import { SUB_QUESTIONS, SUBS_PER_DIM, meanOfSubScores } from "../content/questions";

interface AssessmentProps {
  subject: Subject;
  subScores: DraftSubScores;
  evidence: EvidenceMap;
  index: number;
  onChange: (subScores: DraftSubScores, evidence: EvidenceMap) => void;
  onNavigate: (index: number) => void;
  onFinish: (profile: Profile, subScores: DraftSubScores, evidence: EvidenceMap) => void;
  onBack: () => void;
}

const LEVEL_KEYS = ["unaware", "beginner", "intermediate", "expert"] as const;

export function Assessment({
  subject,
  subScores,
  evidence,
  index,
  onChange,
  onNavigate,
  onFinish,
  onBack
}: AssessmentProps) {
  const { t } = useTranslation();
  const dim = DIMENSIONS[index];
  const subs = SUB_QUESTIONS[dim.code];
  const currentSubs = subScores[dim.code] ?? new Array(SUBS_PER_DIM).fill(undefined) as (number | undefined)[];
  const currentEvidence = evidence[dim.code] ?? "";

  // Each dimension is its own page. Reset scroll to the top when the section
  // changes so people land on the heading, not where the previous Next button
  // sat (App's scroll-reset only fires on view.kind, not on index changes).
  useEffect(() => { window.scrollTo({ top: 0 }); }, [index]);

  // Keyboard: left/right arrows navigate between dimensions.
  // (Per-question keyboard answer removed — with 4 questions per page, digit
  // shortcuts are ambiguous.)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === "ArrowRight" && pageComplete && index < DIMENSIONS.length - 1) onNavigate(index + 1);
      else if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, currentSubs.join(",")]);

  const setSubScore = (subIdx: number, lvl: number) => {
    const next = [...currentSubs];
    next[subIdx] = lvl;
    onChange({ ...subScores, [dim.code]: next }, evidence);
  };
  const setEvidence = (txt: string) => {
    onChange(subScores, { ...evidence, [dim.code]: txt });
  };

  /** Profile built from means of each dimension's sub-scores — used by the live mini-plate. */
  const livePartialProfile: HeptagonProfile = useMemo(() => {
    const out: HeptagonProfile = {};
    for (const d of DIMENSIONS) {
      const s = subScores[d.code];
      const mean = s ? meanOfSubScores(s) : undefined;
      if (typeof mean === "number") out[d.code] = mean;
    }
    return out;
  }, [subScores]);

  const pageComplete = currentSubs.every((s) => typeof s === "number");
  const isLast = index === DIMENSIONS.length - 1;
  const allComplete = DIMENSIONS.every((d) => {
    const s = subScores[d.code];
    return s && s.length === SUBS_PER_DIM && s.every((x) => typeof x === "number");
  });

  const finish = () => {
    if (!allComplete) return;
    const profile = {} as Profile;
    for (const d of DIMENSIONS) {
      profile[d.code] = meanOfSubScores(subScores[d.code]!) as number;
    }
    onFinish(profile, subScores, evidence);
  };

  const dimensionName = t(`dimensions.${dim.key}.full`);
  const shortName     = t(`dimensions.${dim.key}.short`);
  const description   = t(`dimensions.${dim.key}.description`);

  return (
    <main className="page assess-page">
      <header>
        <p className="kicker">
          <span>{subject.name || t("scope.individual.title")}</span>
          <span className="dot">·</span>
          <span>{t("assess.progress", { current: index + 1, total: DIMENSIONS.length })}</span>
        </p>
        <h1 className="hanging">{shortName}<span className="assess-code">{dim.code}</span></h1>
        <p className="lede">{dimensionName}</p>
        <p className="dim-description">{description}</p>
      </header>

      <div className="assess-main">
        <div className="question-stack">
          <p className="sub-prompt-intro">{t("assess.sub.prompt")}</p>
          {subs.map((subId, subIdx) => {
            const selected = currentSubs[subIdx];
            return (
              <fieldset key={subId} className="question-card">
                <legend className="question-legend">
                  <span className="question-code">{subId}</span>
                  {t(`questions.${subId}.prompt`)}
                </legend>
                <ol className="anchor-list">
                  {LEVEL_KEYS.map((levelKey, lvl) => {
                    const isSelected = selected === lvl;
                    return (
                      <li key={levelKey}>
                        <label className={"anchor-option" + (isSelected ? " is-selected" : "")}>
                          <input
                            type="radio"
                            name={subId}
                            checked={isSelected}
                            onChange={() => setSubScore(subIdx, lvl)}
                          />
                          <span className="anchor-index" aria-hidden="true">{lvl}</span>
                          <span className="anchor-body">
                            <span className="anchor-text">{t(`questions.${subId}.anchors.${levelKey}`)}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ol>
              </fieldset>
            );
          })}

          <div className="evidence-field">
            <label htmlFor="evidence">{t("assess.evidence.label")}</label>
            <textarea
              id="evidence"
              rows={2}
              value={currentEvidence}
              placeholder=""
              onChange={(e) => setEvidence(e.target.value)}
            />
          </div>
        </div>

        <aside className="assess-mini">
          <div className="mini-plate">
            <Heptagon
              profile={livePartialProfile}
              mode="static"
              highlightDim={dim.code}
              showGapMarginalia={false}
              interactive={false}
            />
          </div>
          <nav className="dim-pips" aria-label="Dimension progress">
            {DIMENSIONS.map((d, i) => {
              const s = subScores[d.code];
              const answered = !!(s && s.length === SUBS_PER_DIM && s.every((x) => typeof x === "number"));
              const active = i === index;
              return (
                <button
                  key={d.code}
                  type="button"
                  className={"pip" + (answered ? " is-answered" : "") + (active ? " is-active" : "")}
                  aria-current={active ? "step" : undefined}
                  onClick={() => onNavigate(i)}
                >
                  <span className="pip-code">{d.code}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      </div>

      <footer className="assess-footer">
        <button type="button" className="btn btn-ghost" onClick={() => index === 0 ? onBack() : onNavigate(index - 1)}>
          {index === 0 ? t("app.back") : t("assess.previous")}
        </button>
        {isLast
          ? <button type="button" className="btn btn-primary" disabled={!allComplete} onClick={finish}>
              {t("assess.review")}
            </button>
          : <button type="button" className="btn btn-primary" disabled={!pageComplete}
              onClick={() => onNavigate(index + 1)}>
              {t("assess.next")}
            </button>
        }
      </footer>
    </main>
  );
}
