import { FormEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Subject } from "../state/types";
import { PRODUCT_AREAS } from "../content/org";

interface ScopeFormProps {
  initial: Subject;
  onSubmit: (subject: Subject) => void;
  onBack: () => void;
}

export function ScopeForm({ initial, onSubmit, onBack }: ScopeFormProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState<Subject>(initial);

  const teams = useMemo(() => {
    const pa = PRODUCT_AREAS.find((p) => p.key === subject.productArea);
    return pa?.teams ?? [];
  }, [subject.productArea]);

  const canSubmit = Boolean(subject.productArea && subject.team);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(subject);
  };

  const update = <K extends keyof Subject>(k: K, v: Subject[K]) =>
    setSubject((s) => ({ ...s, [k]: v }));

  return (
    <main className="page">
      <header>
        <p className="kicker">
          {t("app.kicker").split("·").map((seg, i, arr) => (
            <span key={i}>{seg.trim()}{i < arr.length - 1 && <span className="dot">·</span>}</span>
          ))}
        </p>
        <h1 className="hanging">{t("scope.individual.title")}</h1>
        <p className="lede">{t("scope.individual.body")}</p>
      </header>

      <form className="scope-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">{t("scope.field.name")}</label>
          <input
            id="name"
            type="text"
            value={subject.name ?? ""}
            placeholder={t("scope.field.name.placeholder.individual")}
            onChange={(e) => update("name", e.target.value || undefined)}
          />
        </div>

        <div className="field">
          <label htmlFor="role">{t("scope.field.role")}</label>
          <input
            id="role"
            type="text"
            value={subject.role ?? ""}
            placeholder={t("scope.field.role.placeholder")}
            onChange={(e) => update("role", e.target.value || undefined)}
          />
        </div>

        <div className="field">
          <label htmlFor="productArea">{t("scope.field.productArea")} *</label>
          <select
            id="productArea"
            required
            value={subject.productArea ?? ""}
            onChange={(e) => {
              const v = e.target.value || undefined;
              setSubject((s) => ({ ...s, productArea: v, team: undefined }));
            }}
          >
            <option value="">{t("scope.field.productArea.placeholder")}</option>
            {PRODUCT_AREAS.map((pa) => (
              <option key={pa.key} value={pa.key}>{pa.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="team">{t("scope.field.team")} *</label>
          <select
            id="team"
            required
            disabled={!subject.productArea}
            value={subject.team ?? ""}
            onChange={(e) => update("team", e.target.value || undefined)}
          >
            <option value="">{t("scope.field.team.placeholder")}</option>
            {teams.map((tm) => (
              <option key={tm.name} value={tm.name}>
                {tm.name}{tm.truncated ? "…" : ""}
              </option>
            ))}
            <option value="Other">{t("scope.field.team.other")}</option>
          </select>
        </div>

        <div className="scope-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            {t("app.back")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            {t("scope.begin")}
          </button>
        </div>
      </form>
    </main>
  );
}
