import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { DIMENSIONS, LevelIndex, Profile } from "../content/dimensions";
import { Heptagon } from "../components/Heptagon";
import { Subject, DraftProfile, EvidenceMap } from "../state/types";

interface AssessmentProps {
  subject: Subject;
  levels: DraftProfile;
  evidence: EvidenceMap;
  index: number;
  onChange: (levels: DraftProfile, evidence: EvidenceMap) => void;
  onNavigate: (index: number) => void;
  onFinish: (profile: Profile, evidence: EvidenceMap) => void;
  onBack: () => void;
}

const LEVEL_KEYS = ["unaware", "beginner", "intermediate", "expert"] as const;

export function Assessment({
  subject,
  levels,
  evidence,
  index,
  onChange,
  onNavigate,
  onFinish,
  onBack
}: AssessmentProps) {
  const { t } = useTranslation();
  const dim = DIMENSIONS[index];
  const currentLevel = levels[dim.code];
  const currentEvidence = evidence[dim.code] ?? "";

  // Keyboard: left/right arrows navigate, 1–4 set level
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === "TEXTAREA" ||
          (e.target as HTMLElement | null)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" && currentLevel !== undefined && index < DIMENSIONS.length - 1) {
        onNavigate(index + 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        onNavigate(index - 1);
      } else if (/^[1-4]$/.test(e.key)) {
        setLevel((Number(e.key) - 1) as LevelIndex);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, currentLevel]);

  const setLevel = (lvl: LevelIndex) => {
    onChange({ ...levels, [dim.code]: lvl }, evidence);
  };
  const setEvidence = (txt: string) => {
    onChange(levels, { ...evidence, [dim.code]: txt });
  };

  const isLast = index === DIMENSIONS.length - 1;
  const allAnswered = DIMENSIONS.every((d) => levels[d.code] !== undefined);

  const finish = () => {
    if (!allAnswered) return;
    const profile = {} as Profile;
    for (const d of DIMENSIONS) profile[d.code] = levels[d.code] as LevelIndex;
    onFinish(profile, evidence);
  };

  const dimensionName = t(`dimensions.${dim.key}.full`);
  const shortName     = t(`dimensions.${dim.key}.short`);

  return (
    <main className="page assess-page">
      <header>
        <p className="kicker">
          <span>{subject.scope === "team" ? subject.name || t("scope.field.name.placeholder.team") : subject.name || t("scope.individual.title")}</span>
          <span className="dot">·</span>
          <span>{t("assess.progress", { current: index + 1, total: DIMENSIONS.length })}</span>
        </p>
        <h1 className="hanging">{shortName}<span className="assess-code">{dim.code}</span></h1>
        <p className="lede">{dimensionName}</p>
      </header>

      <div className="assess-main">
        <fieldset className="question-card">
          <legend className="question-legend">
            <Trans i18nKey="assess.question" values={{ dimension: shortName }} />
          </legend>

          <ol className="anchor-list">
            {LEVEL_KEYS.map((levelKey, i) => {
              const lvl = i as LevelIndex;
              const selected = currentLevel === lvl;
              return (
                <li key={levelKey}>
                  <label className={"anchor-option" + (selected ? " is-selected" : "")}>
                    <input
                      type="radio"
                      name="level"
                      checked={selected}
                      onChange={() => setLevel(lvl)}
                    />
                    <span className="anchor-index" aria-hidden="true">{i}</span>
                    <span className="anchor-body">
                      <span className="anchor-level">{t(`levels.${levelKey}`)}</span>
                      <span className="anchor-text">{t(`anchors.${dim.key}.${levelKey}`)}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ol>

          <div className="evidence-field">
            <label htmlFor="evidence">{t("assess.evidence.label")}</label>
            <textarea
              id="evidence"
              rows={2}
              value={currentEvidence}
              placeholder={t("assess.evidence.placeholder")}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </div>
        </fieldset>

        <aside className="assess-mini">
          <div className="mini-plate">
            <Heptagon
              profile={levels}
              mode="static"
              highlightDim={dim.code}
              showGapMarginalia={false}
              interactive={false}
            />
          </div>
          <nav className="dim-pips" aria-label="Dimension progress">
            {DIMENSIONS.map((d, i) => {
              const answered = levels[d.code] !== undefined;
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
          ? <button type="button" className="btn btn-primary" disabled={!allAnswered} onClick={finish}>
              {t("assess.review")}
            </button>
          : <button type="button" className="btn btn-primary" disabled={currentLevel === undefined}
              onClick={() => onNavigate(index + 1)}>
              {t("assess.next")}
            </button>
        }
      </footer>
    </main>
  );
}
