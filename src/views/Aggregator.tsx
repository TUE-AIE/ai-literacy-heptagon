import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "../components/LanguageToggle";
import { Dropzone } from "../components/Dropzone";
import { Heptagon, HeptagonOverlay } from "../components/Heptagon";
import { Plate } from "../components/Plate";
import { aggregate, buildTree, nodeAt, profileIdOf } from "../aggregator/aggregate";
import { readFileAsText, validateExport } from "../aggregator/validate";
import { ImportedProfile, Node } from "../aggregator/types";
import { DIMENSIONS } from "../content/dimensions";
import { roleByKey } from "../content/targetProfiles";

interface AggregatorProps {
  onExit: () => void;
}

const MIN_N_FOR_INDIVIDUALS = 3;
const MAX_COMPARE = 3;

type Mode = "drill" | "compare" | "diff";

/**
 * Colours used for compare-mode overlays. CSS variable-backed so they theme.
 * Three distinct hues chosen to read on the warm paper ground.
 */
const COMPARE_COLORS = ["var(--profile)", "#1E4E8C", "#3E6B3A"];

export function Aggregator({ onExit }: AggregatorProps) {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<ImportedProfile[]>([]);
  const [path,      setPath]    = useState<string[]>([]);
  const [rejects,   setRejects] = useState<{ filename: string; errors: string[] }[]>([]);
  const [showIndividuals, setShowIndividuals] = useState(false);
  const [mode, setMode] = useState<Mode>("drill");
  const [selection, setSelection] = useState<string[]>([]); // ordered path-keys

  const tree = useMemo(() => buildTree(profiles), [profiles]);
  const current: Node = useMemo(() => nodeAt(tree, path), [tree, path]);
  const agg = useMemo(() => aggregate(current.profiles), [current]);

  /**
   * If every profile at the current node shares one role archetype, surface its
   * target band as an automatic overlay. Mixed-role groups get no overlay
   * because there's no unambiguous target for them.
   */
  const sharedRole = useMemo(() => {
    const keys = new Set(current.profiles.map((p) => p.doc.subject.roleArchetype ?? ""));
    if (keys.size !== 1) return undefined;
    const only = keys.values().next().value as string;
    return roleByKey(only);
  }, [current]);

  const sharedTargetBand = useMemo(() => {
    if (!sharedRole) return undefined;
    const min: Record<string, number> = {}, max: Record<string, number> = {};
    for (const d of DIMENSIONS) {
      const tr = sharedRole.targets[d.code];
      min[d.code] = tr.min; max[d.code] = tr.max;
    }
    return { min, max };
  }, [sharedRole]);

  const onFiles = async (files: File[]) => {
    const added: ImportedProfile[] = [];
    const skipped: { filename: string; errors: string[] }[] = [];
    const existingIds = new Set(profiles.map((p) => p.id));

    for (const f of files) {
      try {
        const txt = await readFileAsText(f);
        const parsed = JSON.parse(txt);
        const res = validateExport(parsed);
        if (!res.ok) { skipped.push({ filename: f.name, errors: res.errors }); continue; }
        const id = profileIdOf(res.doc, f.name);
        if (existingIds.has(id)) {
          skipped.push({ filename: f.name, errors: ["Duplicate of an already-imported profile."] });
          continue;
        }
        existingIds.add(id);
        added.push({ id, filename: f.name, doc: res.doc });
      } catch (e) {
        skipped.push({ filename: f.name, errors: [`Could not parse JSON: ${(e as Error).message}`] });
      }
    }

    if (added.length) setProfiles((prev) => [...prev, ...added]);
    if (skipped.length) setRejects(skipped);
  };

  const clearAll = () => {
    setProfiles([]); setPath([]); setRejects([]);
    setSelection([]); setMode("drill");
  };

  /* Navigating and mode switching interact — clear selection on path change / mode change. */
  const navigateTo = (p: string[]) => { setPath(p); setSelection([]); };
  const setModeAndClear = (m: Mode) => { setMode(m); setSelection([]); };

  const toggleSelection = (key: string) => {
    setSelection((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_COMPARE) return prev; // cap at 3
      return [...prev, key];
    });
  };

  /* -------- breadcrumb -------- */
  const breadcrumb = (() => {
    const crumbs: { label: string; onClick: () => void; active: boolean }[] = [];
    crumbs.push({ label: t("aggregator.level.root"), onClick: () => navigateTo([]), active: path.length === 0 });
    let cur: Node = tree;
    for (let i = 0; i < path.length; i++) {
      const next = cur.children.find((c) => c.path[c.path.length - 1] === path[i]);
      if (!next) break;
      const slice = path.slice(0, i + 1);
      crumbs.push({ label: next.name, onClick: () => navigateTo(slice), active: i === path.length - 1 });
      cur = next;
    }
    return crumbs;
  })();

  const childLabel =
    current.level === "root" ? t("aggregator.children.pa")
    : current.level === "pa" ? t("aggregator.children.team")
    :                          t("aggregator.children.individual");

  const hideIndividualsForPrivacy =
    current.level === "team" && !showIndividuals && current.profiles.length >= MIN_N_FOR_INDIVIDUALS;

  /* -------- compare: resolve selection to overlays with colours -------- */
  const compareOverlays: HeptagonOverlay[] = (() => {
    if (mode !== "compare") return [];
    const out: HeptagonOverlay[] = [];
    selection.forEach((key, i) => {
      const child = current.children.find((c) => c.path.join("/") === key);
      if (!child) return;
      const cagg = aggregate(child.profiles);
      if (!cagg.mean) return;
      out.push({
        profile: cagg.mean,
        color:   COMPARE_COLORS[i % COMPARE_COLORS.length],
        label:   child.name
      });
    });
    return out;
  })();

  return (
    <>
      <LanguageToggle />

      <main className="page">
        <header>
          <p className="kicker">
            {t("aggregator.kicker").split("·").map((seg, i, arr) => (
              <span key={i}>{seg.trim()}{i < arr.length - 1 && <span className="dot">·</span>}</span>
            ))}
          </p>
          <h1 className="hanging">
            {t("aggregator.title.line1")}<br />
            <em>{t("aggregator.title.line2")}</em>
          </h1>
          <p className="lede">{t("aggregator.lede")}</p>
        </header>

        {profiles.length === 0 ? (
          <section className="aggregator-empty">
            <Dropzone onFiles={onFiles} />
            {rejects.length > 0 && <RejectsList rejects={rejects} onClose={() => setRejects([])} />}
            <div className="aggregator-actions">
              <button type="button" className="btn btn-ghost" onClick={onExit}>
                {t("aggregator.back")}
              </button>
            </div>
          </section>
        ) : (
          <>
            <nav className="breadcrumb" aria-label="Hierarchy">
              {breadcrumb.map((c, i) => (
                <span key={i} className="breadcrumb-item">
                  <button
                    className={"crumb" + (c.active ? " is-active" : "")}
                    type="button"
                    onClick={c.onClick}
                    aria-current={c.active ? "page" : undefined}
                  >
                    {c.label}
                  </button>
                  {i < breadcrumb.length - 1 && <span className="crumb-sep" aria-hidden="true">▸</span>}
                </span>
              ))}
              <span className="breadcrumb-summary">
                {current.profiles.length === 1
                  ? t("aggregator.summary.one", { count: 1 })
                  : t("aggregator.summary.many", {
                      count: current.profiles.length,
                      groups: t(
                        current.level === "root"  ? "aggregator.children.pa"
                        : current.level === "pa"  ? "aggregator.children.team"
                        :                           "aggregator.children.individual"
                      ).toLowerCase()
                    })}
              </span>
            </nav>

            {/* Mode toggle — only relevant when the current level has siblings to act on. */}
            {current.level !== "individual" && current.children.length > 0 && (
              <div className="mode-toggle" role="tablist" aria-label="View mode">
                {(["drill", "compare", "diff"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    className={"mode-btn" + (mode === m ? " is-active" : "")}
                    onClick={() => setModeAndClear(m)}
                  >
                    {t("aggregator.mode." + m)}
                  </button>
                ))}
              </div>
            )}

            {/* Main plate */}
            {current.level === "individual" ? (
              <div className="plate-slot">
                <Plate
                  captionLeft={current.name}
                  captionRight={current.profiles[0]?.doc.timestamp.slice(0, 10)}
                >
                  <Heptagon
                    profile={individualProfileOf(current.profiles[0])}
                    mode="static"
                    interactive={true}
                    showDeltas={mode === "diff"}
                  />
                </Plate>
              </div>
            ) : (
              <div className="plate-slot">
                <Plate
                  captionLeft={
                    mode === "compare" && compareOverlays.length > 0
                      ? <>{t("aggregator.compare.legendTitle")} — {current.name}</>
                      : <>{t("aggregator.aggregate.mean")} — {current.name}</>
                  }
                  captionRight={
                    mode === "compare" && compareOverlays.length > 0
                      ? `${compareOverlays.length} / ${MAX_COMPARE}`
                      : `N = ${agg.n}`
                  }
                >
                  {mode === "compare" && compareOverlays.length > 0 ? (
                    <Heptagon
                      profile={{}}
                      overlays={compareOverlays}
                      mode="static"
                      interactive={false}
                      showGapMarginalia={false}
                    />
                  ) : agg.mean ? (
                    <Heptagon
                      profile={agg.mean}
                      mode="static"
                      interactive={false}
                      band={mode !== "compare" && agg.min && agg.max ? { min: agg.min, max: agg.max } : undefined}
                      targetBand={mode !== "compare" ? sharedTargetBand : undefined}
                      showDeltas={mode === "diff"}
                      showGapMarginalia={false}
                    />
                  ) : (
                    <div className="aggregator-placeholder">{t("aggregator.children.empty")}</div>
                  )}
                </Plate>

                {mode === "compare" && (
                  compareOverlays.length > 0 ? (
                    <ul className="compare-legend" aria-label={t("aggregator.compare.legendTitle")}>
                      {compareOverlays.map((ov, i) => (
                        <li key={i} style={{ "--swatch": ov.color } as React.CSSProperties}>
                          <span className="swatch" />
                          <span className="legend-label">{ov.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="aggregator-below-warning" style={{ color: "var(--annotation)" }}>
                      {t("aggregator.compare.hint")}
                    </p>
                  )
                )}

                {mode !== "compare" && agg.belowBaseline > 0 && (
                  <p className="aggregator-below-warning">
                    {t(
                      agg.belowBaseline === 1 ? "aggregator.aggregate.below" : "aggregator.aggregate.below_plural",
                      { count: agg.belowBaseline }
                    )}
                  </p>
                )}
                {mode !== "compare" && sharedRole && (
                  <p className="aggregator-below-warning" style={{ color: "var(--annotation)" }}>
                    {t("aggregator.target.overlay", { role: t(`roles.${sharedRole.i18nKey}.name`) })}
                  </p>
                )}
                {mode === "diff" && (
                  <p className="aggregator-diff-legend">
                    <span className="diff-swatch diff-neg"  aria-hidden="true" />{t("aggregator.diff.negative")}
                    <span className="diff-swatch diff-zero" aria-hidden="true" />{t("aggregator.diff.zero")}
                    <span className="diff-swatch diff-pos"  aria-hidden="true" />{t("aggregator.diff.positive")}
                  </p>
                )}
              </div>
            )}

            {current.level !== "individual" && (
              <aside className="margin-slot aggregator-side">
                <h3>{childLabel}</h3>
                {current.level === "team" && current.profiles.length >= MIN_N_FOR_INDIVIDUALS && (
                  <button
                    type="button"
                    className="btn btn-ghost aggregator-toggle-privacy"
                    onClick={() => setShowIndividuals((v) => !v)}
                  >
                    {showIndividuals
                      ? t("aggregator.privacy.hideIndividuals")
                      : t("aggregator.privacy.showIndividuals")}
                  </button>
                )}
                <p className="aggregator-hint">
                  {mode === "compare"
                    ? t("aggregator.compare.hint")
                    : t("aggregator.drilldownHint")}
                </p>
                {mode === "compare" && selection.length > 0 && (
                  <button type="button" className="btn btn-ghost" onClick={() => setSelection([])}>
                    {t("aggregator.compare.clear")}
                  </button>
                )}
              </aside>
            )}

            {/* Children grid */}
            <section
              className={"children-grid" + (mode === "compare" ? " is-compare" : "")}
              aria-live="polite"
            >
              {current.level !== "individual" && (
                hideIndividualsForPrivacy ? (
                  <p className="aggregator-privacy-note">
                    {t("aggregator.privacy.redacted", { min: MIN_N_FOR_INDIVIDUALS })}
                  </p>
                ) : current.children.length === 0 ? (
                  <p className="aggregator-privacy-note">{t("aggregator.children.empty")}</p>
                ) : (
                  current.children.map((child) => {
                    const childAgg = aggregate(child.profiles);
                    const key = child.path.join("/");
                    const selIndex = selection.indexOf(key);
                    const isSelected = selIndex >= 0;
                    const swatch = isSelected ? COMPARE_COLORS[selIndex] : undefined;

                    return (
                      <button
                        key={key}
                        type="button"
                        className={
                          "child-card"
                          + (childAgg.belowBaseline ? " is-below" : "")
                          + (isSelected ? " is-selected" : "")
                        }
                        aria-pressed={mode === "compare" ? isSelected : undefined}
                        onClick={() => mode === "compare" ? toggleSelection(key) : navigateTo(child.path)}
                        style={swatch ? { "--card-accent": swatch } as React.CSSProperties : undefined}
                      >
                        {isSelected && mode === "compare" && (
                          <span className="child-selected-badge" aria-hidden="true">{selIndex + 1}</span>
                        )}
                        <div className="child-card-plate">
                          {childAgg.mean && (
                            <Heptagon
                              profile={childAgg.mean}
                              mode="static"
                              interactive={false}
                              hideVertices
                              showGapMarginalia={false}
                              width={600}
                              height={600}
                            />
                          )}
                        </div>
                        <div className="child-card-meta">
                          <span className="child-card-name">{child.name}</span>
                          <span className="child-card-count">
                            {childCountLabel(child, t)}
                          </span>
                          {childAgg.belowBaseline > 0 && (
                            <span className="child-card-warn">
                              {t("aggregator.aggregate.below", { count: childAgg.belowBaseline })}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )
              )}
            </section>

            <div className="aggregator-actions aggregator-actions-footer">
              <button type="button" className="btn btn-ghost" onClick={onExit}>{t("aggregator.back")}</button>
              <Dropzone onFiles={onFiles} />
              <button type="button" className="btn btn-ghost" onClick={clearAll}>{t("aggregator.clear")}</button>
            </div>

            {rejects.length > 0 && <RejectsList rejects={rejects} onClose={() => setRejects([])} />}
          </>
        )}
      </main>
    </>
  );
}

/* Helpers */

function childCountLabel(node: Node, t: (k: string, v?: Record<string, unknown>) => string): string {
  const profiles = node.profiles.length;
  if (node.level === "pa") {
    const teams = node.children.length;
    const key = teams === 1 ? "aggregator.card.profilesAcrossTeamsOne"
                            : "aggregator.card.profilesAcrossTeamsMany";
    return t(key, { profiles, teams });
  }
  const key = profiles === 1 ? "aggregator.card.profilesOne" : "aggregator.card.profilesMany";
  return t(key, { count: profiles });
}

function individualProfileOf(p: ImportedProfile | undefined) {
  const out: Record<string, number> = {};
  if (!p) return out;
  for (const code of Object.keys(p.doc.assessments)) {
    out[code] = p.doc.assessments[code].level;
  }
  return out;
}

function RejectsList({
  rejects,
  onClose
}: { rejects: { filename: string; errors: string[] }[]; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rejects" role="alert">
      <header>
        <h3>{t("aggregator.validation.heading")}</h3>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          {t("aggregator.validation.close")}
        </button>
      </header>
      <ul>
        {rejects.map((r, i) => (
          <li key={i}>
            <strong>{r.filename}</strong> — {r.errors.join(" ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
