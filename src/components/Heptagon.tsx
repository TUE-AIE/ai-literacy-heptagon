import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as d3 from "d3";
import { useTranslation } from "react-i18next";
import { DIMENSIONS, DimensionCode } from "../content/dimensions";

/**
 * Profile values can be integer (0–3) for completed assessments or fractional
 * (e.g. 1.83) for aggregate means. Both are rendered the same way.
 */
export type HeptagonProfile = Partial<Record<DimensionCode, number>>;

/** Optional min–max band: drawn behind the mean polygon as a hatched annular wash. */
export interface HeptagonBand {
  min: HeptagonProfile;
  max: HeptagonProfile;
}

/** A named overlay profile — used for side-by-side comparison (up to three). */
export interface HeptagonOverlay {
  profile: HeptagonProfile;
  /** Display label shown in the legend. */
  label: string;
  /** Any CSS colour token, usually a CSS variable reference. */
  color: string;
}

interface HeptagonProps {
  profile: HeptagonProfile;
  /** Controls the imperative reveal animation. When this value changes, the reveal replays. */
  revealNonce?: number;
  /** "reveal" plays the full choreography on mount; "static" draws immediately. */
  mode?: "reveal" | "static";
  /** Highlight a given dimension axis (e.g. the one currently being assessed). */
  highlightDim?: DimensionCode;
  /** Show marginalia leader line for the first below-baseline dimension. Default true. */
  showGapMarginalia?: boolean;
  /** Enable interactive hover tooltips on vertices. Default true. */
  interactive?: boolean;
  /** Aggregate range: if supplied, renders a min–max band behind the mean polygon. */
  band?: HeptagonBand;
  /**
   * Target range band: the desired role-target min..max polygon. Drawn with
   * dashed stroke and light fill between the two polygons; honours "anywhere
   * in this range is fine" for role targets that have ranges like B–I.
   */
  targetBand?: HeptagonBand;
  /** Comparison overlays. When non-empty, `profile` is not rendered; each overlay
   *  is drawn as its own polygon in the given colour. */
  overlays?: HeptagonOverlay[];
  /**
   * Delta badge mode at each vertex:
   *   "off"      no badges (default)
   *   "baseline" level − 1 (Beginner baseline)
   *   "target"   level − targetMidpoint(dim); requires targetBand
   */
  deltaMode?: "off" | "baseline" | "target";
  /**
   * Legacy alias for `deltaMode === "baseline"`. Prefer `deltaMode` for new code.
   * Kept so existing callers (compare / diff modes in Aggregator) keep working.
   */
  showDeltas?: boolean;
  /** Suppress rendering of vertex dots (useful for tiny sparkline heptagons). */
  hideVertices?: boolean;
  /** Override the SVG viewbox width/height. */
  width?: number;
  height?: number;
}

/** Imperative handle exposed to parents (primarily for PNG export). */
export interface HeptagonHandle {
  /** The inline <svg> root — used by the PNG rasteriser. */
  getSvg: () => SVGSVGElement | null;
}

const W_DEFAULT = 880;
const H_DEFAULT = 800;

export const Heptagon = forwardRef<HeptagonHandle, HeptagonProps>(function Heptagon(
  {
    profile,
    revealNonce = 0,
    mode = "reveal",
    highlightDim,
    showGapMarginalia = true,
    interactive = true,
    band,
    targetBand,
    overlays,
    deltaMode = "off",
    showDeltas = false,
    hideVertices = false,
    width = W_DEFAULT,
    height = H_DEFAULT
  },
  ref
) {
  // Normalise legacy prop. showDeltas has precedence only when deltaMode is default.
  const effectiveDelta: "off" | "baseline" | "target" =
    deltaMode !== "off" ? deltaMode : (showDeltas ? "baseline" : "off");
  const svgRef   = useRef<SVGSVGElement>(null);
  const sceneRef = useRef<SVGGElement>(null);
  const tipRef   = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  useImperativeHandle(ref, () => ({ getSvg: () => svgRef.current }), []);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = d3.select(sceneRef.current);
    draw(scene, profile, t, mode, highlightDim, showGapMarginalia, interactive, band, targetBand, overlays, effectiveDelta, hideVertices, tipRef.current);
    return () => { scene.selectAll("*").interrupt(); };
  }, [profile, i18n.language, revealNonce, mode, highlightDim, showGapMarginalia, interactive, band, targetBand, overlays, effectiveDelta, hideVertices, t]);

  const descParts = DIMENSIONS.map((d) => {
    const level = profile[d.code] ?? 0;
    const rounded = Math.round(level);
    const name = t(`dimensions.${d.key}.short`);
    const levelName = t(`levels.${["unaware", "beginner", "intermediate", "expert"][rounded]}`);
    const belowBaseline = level < 1 ? ` ${t("heptagon.desc.below")}` : "";
    const nuance = Math.abs(level - rounded) > 0.05 ? ` (≈${level.toFixed(1)})` : "";
    return `${name}: ${levelName}${nuance}${belowBaseline}.`;
  }).join(" ");

  return (
    <div className="heptagon-wrap">
      <svg
        ref={svgRef}
        className="hept"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="hept-title hept-desc"
        width="100%"
      >
        <title id="hept-title">{t("heptagon.title")}</title>
        <desc id="hept-desc">
          {t("heptagon.desc.intro")} {descParts}
        </desc>
        <defs>
          <filter id="bleed" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" />
          </filter>
        </defs>
        <g ref={sceneRef} />
      </svg>
      {interactive && <div ref={tipRef} className="hept-tooltip" role="tooltip" aria-hidden="true" />}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* d3 drawing                                                         */
/* ------------------------------------------------------------------ */

const N = 7;
const CX = 440;
const CY = 410;
const R = 260;

const angle   = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
const pt      = (i: number, r: number): [number, number] =>
  [CX + Math.cos(angle(i)) * r, CY + Math.sin(angle(i)) * r];
/** Ring radius: k runs 1..4 for rings labelled Unaware/Beginner/Intermediate/Expert. */
const ringR   = (k: number) => (R * k) / 4;
/** Profile vertex radius for a given level 0..3 (fractional allowed for means). */
const levelR  = (level: number) => ringR(level + 1);
const heptPts = (k: number): [number, number][] => d3.range(N).map((i) => pt(i, ringR(k)));
const polyStr = (pts: [number, number][]): string =>
  pts.map((p) => p.map((v) => v.toFixed(2)).join(",")).join(" ");

type TFn = (key: string) => string;
type Scene = d3.Selection<SVGGElement, unknown, null, undefined>;

function draw(
  scene: Scene,
  profile: HeptagonProfile,
  t: TFn,
  mode: "reveal" | "static",
  highlightDim: DimensionCode | undefined,
  showGapMarginalia: boolean,
  interactive: boolean,
  band: { min: HeptagonProfile; max: HeptagonProfile } | undefined,
  targetBand: { min: HeptagonProfile; max: HeptagonProfile } | undefined,
  overlays: HeptagonOverlay[] | undefined,
  deltaMode: "off" | "baseline" | "target",
  hideVertices: boolean,
  tipEl: HTMLDivElement | null
): void {
  scene.selectAll("*").remove();

  const animate = mode === "reveal";

  /* 1 — axes */
  const axisLines = scene.selectAll<SVGLineElement, number>(".axis")
    .data(d3.range(N)).enter().append("line")
    .attr("class", (_, i) => {
      const code = DIMENSIONS[i].code;
      return code === highlightDim ? "axis axis-highlight" : "axis";
    })
    .attr("x1", CX).attr("y1", CY);

  if (animate) {
    axisLines.attr("x2", CX).attr("y2", CY)
      .transition().delay((_, i) => 200 + i * 60).duration(680).ease(d3.easeCubicOut)
      .attr("x2", (_, i) => pt(i, R + 6)[0])
      .attr("y2", (_, i) => pt(i, R + 6)[1]);
  } else {
    axisLines
      .attr("x2", (_, i) => pt(i, R + 6)[0])
      .attr("y2", (_, i) => pt(i, R + 6)[1]);
  }

  /* 2 — rings */
  [1, 2, 3, 4].forEach((k) => {
    const target = heptPts(k);
    if (animate) {
      const seed: [number, number][] = target.map(() => [CX, CY]);
      scene.append("polygon")
        .attr("class", "ring")
        .attr("points", polyStr(seed))
        .transition().delay(900 + (k - 1) * 140).duration(460).ease(d3.easeCubicOut)
        .attrTween("points", () => tweenPoints(seed, target));
    } else {
      scene.append("polygon").attr("class", "ring").attr("points", polyStr(target));
    }
  });

  /* 3 — level labels */
  const levelKeys = ["unaware", "beginner", "intermediate", "expert"] as const;
  const levelSel = scene.selectAll<SVGTextElement, string>(".level-label")
    .data(levelKeys).enter().append("text")
    .attr("class", "level-label")
    .attr("x", CX + 6)
    .attr("y", (_, i) => CY - ringR(i + 1) + 3)
    .text((k) => t(`levels.${k}`));
  if (animate) {
    levelSel.attr("opacity", 0)
      .transition().delay((_, i) => 1400 + i * 80).duration(320)
      .attr("opacity", 0.75);
  } else {
    levelSel.attr("opacity", 0.75);
  }

  /* 4 — dimension labels */
  DIMENSIONS.forEach((d, i) => {
    const [x, y] = pt(i, R + 42);
    const cos = Math.cos(angle(i));
    const anchor = cos > 0.15 ? "start" : cos < -0.15 ? "end" : "middle";

    const label = scene.append("text")
      .attr("class", d.code === highlightDim ? "axis-label axis-label-active" : "axis-label")
      .attr("text-anchor", anchor)
      .attr("x", x).attr("y", y)
      .text(t(`dimensions.${d.key}.short`));
    const code = scene.append("text")
      .attr("class", "axis-code")
      .attr("text-anchor", anchor)
      .attr("x", x).attr("y", y + 14)
      .text(d.code);

    if (animate) {
      label.attr("transform", "translate(0,-4)").attr("opacity", 0)
        .transition().delay(1600 + i * 55).duration(420).ease(d3.easeCubicOut)
        .attr("transform", "translate(0,0)").attr("opacity", 1);
      code.attr("transform", "translate(0,-4)").attr("opacity", 0)
        .transition().delay(1680 + i * 55).duration(420).ease(d3.easeCubicOut)
        .attr("transform", "translate(0,0)").attr("opacity", 1);
    }
  });

  /* 5 — baseline band: annulus between Unaware ring (1) and Beginner ring (2),
        highlighting the Beginner ring, using the even-odd fill rule. */
  const outerPath = "M " + heptPts(2).map(p => p.join(",")).join(" L ") + " Z";
  const innerPath = "M " + heptPts(1).map(p => p.join(",")).join(" L ") + " Z";
  const baselineEl = scene.append("path")
    .attr("class", "baseline-band")
    .attr("fill-rule", "evenodd")
    .attr("d", outerPath + " " + innerPath);
  if (animate) {
    baselineEl.attr("opacity", 0)
      .transition().delay(1700).duration(780).ease(d3.easeQuadIn)
      .attr("opacity", 0.22);
  } else {
    baselineEl.attr("opacity", 0.22);
  }

  /* 5b — min–max band (aggregate range): annulus between min and max polygons. */
  if (band) {
    const minPts: [number, number][] = DIMENSIONS.map((d, i) => pt(i, levelR(band.min[d.code] ?? 0)));
    const maxPts: [number, number][] = DIMENSIONS.map((d, i) => pt(i, levelR(band.max[d.code] ?? 0)));
    const bandPath =
      "M " + maxPts.map(p => p.join(",")).join(" L ") + " Z " +
      "M " + minPts.map(p => p.join(",")).join(" L ") + " Z";
    const minmaxEl = scene.append("path")
      .attr("class", "minmax-band")
      .attr("fill-rule", "evenodd")
      .attr("d", bandPath);
    if (animate) {
      minmaxEl.attr("opacity", 0)
        .transition().delay(2200).duration(600).attr("opacity", 0.55);
    } else {
      minmaxEl.attr("opacity", 0.55);
    }
  }

  /* 5c — target band (role archetype target range): dashed annular band. */
  if (targetBand) {
    const tMinPts: [number, number][] = DIMENSIONS.map((d, i) => pt(i, levelR(targetBand.min[d.code] ?? 0)));
    const tMaxPts: [number, number][] = DIMENSIONS.map((d, i) => pt(i, levelR(targetBand.max[d.code] ?? 0)));
    const tBandPath =
      "M " + tMaxPts.map(p => p.join(",")).join(" L ") + " Z " +
      "M " + tMinPts.map(p => p.join(",")).join(" L ") + " Z";
    const targetEl = scene.append("path")
      .attr("class", "target-band")
      .attr("fill-rule", "evenodd")
      .attr("d", tBandPath);
    // Also draw the upper bound outline as a dashed polygon so a point target
    // (min === max) remains visible (since the annulus collapses to nothing).
    const outlineEl = scene.append("polygon")
      .attr("class", "target-outline")
      .attr("points", polyStr(tMaxPts));
    if (animate) {
      targetEl.attr("opacity", 0)
        .transition().delay(2000).duration(600).attr("opacity", 0.55);
      outlineEl.attr("opacity", 0)
        .transition().delay(2000).duration(600).attr("opacity", 0.8);
    } else {
      targetEl.attr("opacity", 0.55);
      outlineEl.attr("opacity", 0.8);
    }
  }

  /* 6a — overlay comparison: multiple polygons in distinct colours, no bleed */
  if (overlays && overlays.length > 0) {
    overlays.forEach((ov, idx) => {
      const anyAnswered = DIMENSIONS.some((d) => ov.profile[d.code] !== undefined);
      if (!anyAnswered) return;
      const target: [number, number][] = DIMENSIONS.map((d, i) =>
        pt(i, levelR(ov.profile[d.code] ?? 0))
      );
      const seed: [number, number][] = DIMENSIONS.map(() => [CX, CY]);
      const poly = scene.append("polygon")
        .attr("class", "overlay-profile")
        .attr("stroke", ov.color)
        .attr("fill", ov.color)
        .attr("fill-opacity", 0.10)
        .attr("stroke-width", 1.4);
      // Vertex dots for each overlay.
      DIMENSIONS.forEach((d, i) => {
        if (ov.profile[d.code] === undefined) return;
        const [vx, vy] = pt(i, levelR(ov.profile[d.code]!));
        scene.append("circle")
          .attr("class", "overlay-vertex")
          .attr("cx", vx).attr("cy", vy).attr("r", animate ? 0 : 3.2)
          .attr("fill", ov.color)
          .attr("stroke", "var(--paper)").attr("stroke-width", 1)
          .call((sel) => {
            if (animate) sel.transition().delay(2400 + idx * 120).duration(280).attr("r", 3.2);
          });
      });
      if (animate) {
        poly.attr("points", polyStr(seed))
          .transition().delay(2400 + idx * 120).duration(700).ease(d3.easeCubicInOut)
          .attrTween("points", () => tweenPoints(seed, target));
      } else {
        poly.attr("points", polyStr(target));
      }
    });
  } else {

  /* 6b — profile polygon + bleed (only if there's at least one answer) */
  const anyAnswered = DIMENSIONS.some((d) => profile[d.code] !== undefined);
  if (anyAnswered) {
    const profileTarget: [number, number][] = DIMENSIONS.map((d, i) =>
      pt(i, levelR(profile[d.code] ?? 0))
    );
    const profileSeed: [number, number][] = DIMENSIONS.map(() => [CX, CY]);

    const bleed = scene.append("polygon").attr("class", "profile-bleed")
      .attr("filter", "url(#bleed)");
    const polyEl = scene.append("polygon").attr("class", "profile");

    if (animate) {
      bleed.attr("opacity", 0).attr("points", polyStr(profileSeed))
        .transition().delay(2520).duration(900).ease(d3.easeCubicInOut)
        .attrTween("points", () => tweenPoints(profileSeed, profileTarget))
        .attr("opacity", 1);
      polyEl.attr("points", polyStr(profileSeed))
        .transition().delay(2400).duration(900).ease(d3.easeCubicInOut)
        .attrTween("points", () => tweenPoints(profileSeed, profileTarget));
    } else {
      bleed.attr("points", polyStr(profileTarget)).attr("opacity", 1);
      polyEl.attr("points", polyStr(profileTarget));
    }
  }
  }  // end: no overlays

  /* 7 — vertex dots only for answered dimensions (skipped when hideVertices or when overlays present). */
  type Vtx = { i: number; d: typeof DIMENSIONS[number]; level: number };
  const answeredIdx: Vtx[] = DIMENSIONS
    .map((d, i) => ({ i, d, level: profile[d.code] }))
    .filter((x): x is Vtx => typeof x.level === "number");

  const skipVertices = hideVertices || (overlays && overlays.length > 0);
  const vertices = !skipVertices
    ? scene.selectAll<SVGCircleElement, Vtx>(".vertex, .vertex-gap")
        .data(answeredIdx).enter().append("circle")
        .attr("class", (x) => (x.level < 1 ? "vertex-gap" : "vertex"))
        .attr("cx", (x) => pt(x.i, levelR(x.level))[0])
        .attr("cy", (x) => pt(x.i, levelR(x.level))[1])
        .attr("r", animate ? 0 : 3.8)
    : null;

  if (!skipVertices && animate && vertices) {
    vertices.attr("cx", CX).attr("cy", CY).attr("r", 0)
      .transition().delay((_, j) => 2600 + j * 55).duration(280).ease(d3.easeCubicOut)
      .attr("cx", (x) => pt(x.i, levelR(x.level))[0])
      .attr("cy", (x) => pt(x.i, levelR(x.level))[1])
      .attr("r", 3.8);
  }

  /* 7b — delta badges vs a reference (baseline or role target midpoint). */
  if (deltaMode !== "off") {
    DIMENSIONS.forEach((d, i) => {
      const level = profile[d.code];
      if (typeof level !== "number") return;
      let reference: number;
      if (deltaMode === "target" && targetBand) {
        const lo = targetBand.min[d.code] ?? 1;
        const hi = targetBand.max[d.code] ?? lo;
        reference = (lo + hi) / 2;
      } else {
        reference = 1; // Beginner baseline
      }
      const delta = level - reference;
      const [bx, by] = pt(i, levelR(level) + 16);
      const rounded = Math.round(delta * 10) / 10;
      const text = (rounded > 0 ? "+" : "") + rounded.toFixed(rounded % 1 === 0 ? 0 : 1);
      const klass = "delta-badge " + (delta < -0.05 ? "delta-neg" : delta > 0.05 ? "delta-pos" : "delta-zero");
      scene.append("text")
        .attr("class", klass)
        .attr("x", bx).attr("y", by)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(text)
        .attr("opacity", animate ? 0 : 1)
        .call((sel) => {
          if (animate) sel.transition().delay(2900 + i * 40).duration(300).attr("opacity", 1);
        });
    });
  }

  /* 8 — marginalia for first below-baseline dimension */
  if (showGapMarginalia) {
    const gapIdx = DIMENSIONS.findIndex((d) => (profile[d.code] ?? -1) === 0);
    if (gapIdx >= 0) {
      const [vx, vy] = pt(gapIdx, levelR(0));   // vertex sits on Unaware (innermost) ring
      const [ex, ey] = pt(gapIdx, R + 90);
      const cosA = Math.cos(angle(gapIdx));

      const leader = scene.append("path")
        .attr("class", "leader")
        .attr("d", `M ${vx},${vy} Q ${(vx + ex) / 2 + 12},${(vy + ey) / 2 + 8} ${ex},${ey}`);

      const noteText = scene.append("text")
        .attr("class", "marginalia")
        .attr("x", ex + (cosA > 0 ? 6 : -6))
        .attr("y", ey + 4)
        .attr("text-anchor", cosA > 0 ? "start" : "end")
        .text(t("heptagon.gap.marginalia"));

      if (animate) {
        const len = leader.node()!.getTotalLength();
        leader.attr("stroke-dasharray", `0 ${len}`)
          .transition().delay(3200).duration(520).ease(d3.easeQuadOut)
          .attrTween("stroke-dasharray", () => (tt: number) => `${tt * len} ${len}`);
        noteText.attr("opacity", 0)
          .transition().delay(3500).duration(440).ease(d3.easeCubicOut)
          .attr("opacity", 1);
      }
    }
  }

  /* 9 — hover tooltips on vertices (interactive only, when we actually drew vertices) */
  if (interactive && tipEl && vertices && !skipVertices) {
    const tip = d3.select(tipEl);

    const onEnter = (event: PointerEvent, x: Vtx) => {
      const d = DIMENSIONS[x.i];
      const dimName = t(`dimensions.${d.key}.full`);
      const rounded = Math.max(0, Math.min(3, Math.round(x.level)));
      const levelKey = ["unaware", "beginner", "intermediate", "expert"][rounded];
      const levelName = t(`levels.${levelKey}`);
      const anchor = t(`anchors.${d.key}.${levelKey}`);
      const fractional = Math.abs(x.level - rounded) > 0.05 ? ` (≈${x.level.toFixed(1)})` : "";
      tip.html(
        `<span class="dim">${escapeHtml(dimName)} <span class="code">${d.code}</span></span>` +
        `<span class="lvl">${escapeHtml(levelName + fractional)}</span>` +
        `<span class="anchor">${escapeHtml(anchor)}</span>`
      );
      positionTip(tipEl, event);
      tip.classed("is-visible", true);
      tipEl.setAttribute("aria-hidden", "false");
    };
    const onMove = (event: PointerEvent) => positionTip(tipEl, event);
    const onLeave = () => {
      tip.classed("is-visible", false);
      tipEl.setAttribute("aria-hidden", "true");
    };

    vertices
      .style("cursor", "help")
      .on("pointerenter", onEnter)
      .on("pointermove",  onMove)
      .on("pointerleave", onLeave);
  }
}

function tweenPoints(
  from: [number, number][],
  to:   [number, number][]
): (tt: number) => string {
  const interp = d3.interpolateArray(from.flat(), to.flat());
  return (tt: number) => {
    const arr = interp(tt);
    let s = "";
    for (let i = 0; i < arr.length; i += 2) {
      s += arr[i].toFixed(2) + "," + arr[i + 1].toFixed(2) + " ";
    }
    return s.trim();
  };
}

function positionTip(el: HTMLDivElement, ev: PointerEvent): void {
  // Position the tooltip near the cursor but clamped to viewport.
  const margin = 14;
  const rect = el.getBoundingClientRect();
  let x = ev.clientX + margin;
  let y = ev.clientY + margin;
  if (x + rect.width + margin > window.innerWidth)  x = ev.clientX - rect.width - margin;
  if (y + rect.height + margin > window.innerHeight) y = ev.clientY - rect.height - margin;
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
