# AI Literacy Heptagon — Interactive Assessment Tool

**Context:** AI Literacy Team · AI Enablement Program · Library and Information Services (LIS) · TU/e
**Basis:** Hackl, Müller, Sailer (2025), *The AI Literacy Heptagon: A Structured Approach to AI Literacy in Higher Education* (arXiv:2509.18900)

---

## 1. Goals

Build two connected web tools:

1. **Assessment Tool** — an individual or a team fills in a self-assessment against the 7 dimensions and 4 proficiency levels, sees an animated heptagon of their profile, and exports the result.
2. **Aggregator Tool** — loads many exports and produces a zoomable, drill-down view of AI literacy across LIS → Product Area → Team → Individual.

Design priorities: **visually striking in an editorial, publication-grade way** (see §8 for the committed aesthetic direction), **fast to complete** (≤ 10 min for an individual), **honest** (self-assessment with concrete anchors so people don't just pick "Intermediate" for everything), **trivial to share** (file-based export), and **privacy-by-design**: nothing is ever uploaded to a server — the tool is a static site, data lives only in the user's browser and in the files they choose to download.

---

## 2. The framework (from the paper)

**7 dimensions** (equal weight, radial axes of the heptagon):

| Code | Dimension |
|---|---|
| TKS | Technical Knowledge and Skills |
| AP  | Application Proficiency |
| CTA | Critical Thinking Ability |
| IS  | Integration Skills |
| LRK | Legal and Regulatory Knowledge |
| EAR | Ethical Awareness and Reasoning |
| SIU | Social Impact Understanding |

**4 proficiency levels** (concentric rings, Bloom-aligned):
`Unaware (0) → Beginner (1) → Intermediate (2) → Expert (3)`

Paper Table 3 gives a one-line behavioural anchor per (dimension × level) cell — these become the question text. Baseline expectation for any HE stakeholder is **Beginner across all 7** ("generic AIL"); Intermediate/Expert is domain-specific.

---

## 3. Users & scenarios

| Persona | Need | Entry point |
|---|---|---|
| LIS staff member | Self-assess, see where I stand, get pointers to grow | Assessment Tool (individual mode) |
| Team lead | Run a team session, capture a team profile, identify gaps | Assessment Tool (team mode) |
| Product Area lead | See my PA's profile vs LIS average, spot weak dimensions | Aggregator Tool |
| AI Literacy Team / AIE Program | Organisation-wide view, track maturity over time | Aggregator Tool (LIS root view) |

---

## 4. Tool 1 — Assessment Tool

### 4.1 Flow

1. **Landing** — short explainer of the heptagon (one animated hero: rings draw in, axes fan out, example profile morphs between two archetypes). Two CTAs: *Assess myself* / *Assess my team*.
2. **Scope form** — name (optional), Product Area (dropdown, configurable), Team, role, date. For team mode: team name + optional participant count.
3. **Assessment** — 7 dimensions × 1 primary question each, showing the 4 Bloom-anchored level descriptors from Table 3 as radio options, with an optional free-text "evidence" field per dimension. Progress bar + current dimension highlighted on a small live heptagon in the sidebar.
4. **Results** — full heptagon renders with animated fill, per-dimension cards showing level, anchor text, and 1–2 suggested next actions (curated by the AI Literacy Team, stored in a content JSON).
5. **Export** — download `.json` (see §6) + optional `.png` of the heptagon.

### 4.2 Heptagon visualisation (d3.js) — "the plate"

The heptagon is the hero of the product and is designed as an **engraved scientific-journal plate**, not a dashboard chart. See §8 for the full aesthetic brief; the mechanics are:

- **Geometry**: 7 radial axes at 360°/7 ≈ 51.43° apart, 4 concentric heptagonal rings for the levels. Render as inline SVG (required for text-as-SVG, filter effects, and clean PNG export).
- **Layers** (bottom-up):
  1. Warm paper ground with a subtle SVG `feTurbulence` grain filter (opacity ~0.04).
  2. Hairline level grid (0.5 px strokes, near-black ink colour).
  3. Dimension axes with serif small-caps labels set on tangent curves following the outer ring (labels follow a `<textPath>`, so they arc with the heptagon edge).
  4. **Baseline band** — the Beginner ring filled with a dusty terracotta wash (the paper's Figure 3 orange, reinterpreted as ink not fill), with a slightly irregular edge via `feDisplacementMap` so it reads as printed, not vector.
  5. Profile polygon, stroked in TU/e red, filled with a translucent crimson wash; a secondary "bleed" copy of the polygon underneath with `feGaussianBlur(stdDeviation=1.5)` gives the ink-on-paper halo.
  6. Vertex markers as small filled circles with tick labels showing the numeric level (0–3) in mono.
  7. Hover tooltips styled as marginalia — serif, italic, with a hairline leader line from vertex to tooltip, not a box.
- **Animations** (d3 v7 transitions, ease `d3.easeCubicInOut` unless noted):
  - **Landing reveal (the hero moment, ~2.2 s total):** the seven axes draw from the centre outward like a compass opening — `stroke-dasharray` animation, staggered 60 ms — then the four rings materialise from inside out, then the dimension labels typeset in sequence (opacity + 2 px downward slide, 40 ms stagger, like letters hitting a page from a printing press), then the baseline band ink-washes in (`fill-opacity` 0 → full with slight `feTurbulence` seed drift for an inky spread).
  - **On answer**: the affected vertex interpolates from its previous level to the new one using `d3.interpolate` on the polygon's `points`; simultaneously the blurred "bleed" polygon eases 120 ms behind the crisp one, exaggerating the wet-ink feel.
  - **On reveal / completion**: a brief, single pulse on vertices that fall below the Beginner baseline — not a jitter, a one-time 400 ms breath — paired with a short serif annotation "below baseline" appearing as marginalia with a leader line.
  - **Team mode**: each individual polygon draws in sequence (300 ms each, 150 ms stagger) as faint grey outlines, then all collapse inward with `d3.interpolate` into the team mean polygon; the min–max band remains as a hatched wash (SVG `<pattern>` with diagonal hairlines) between the outermost and innermost per dimension.
  - **Reduced motion**: `@media (prefers-reduced-motion: reduce)` — all polygon changes snap; axes/rings appear with opacity 0→1, 180 ms, no drawing effect; ink-bleed filter disabled.
- **Interaction**: hover a vertex → marginalia tooltip with dimension name (serif italic), current level, and Bloom anchor text. Click a vertex → smooth-scroll to that dimension's card, which animates a highlight bar across its left edge like a library due-date stamp.
- **Responsive**: SVG `viewBox` with aspect-preserving container; below 640 px the serif labels arc less aggressively and the title shortens. Labels never collide — if width forces it, they flip from curved-tangent to straight-radial placement below a breakpoint.
- **PNG export**: server-less via `canvg` or `dom-to-image-more`, preserving the filter effects. Exported image includes a typeset caption (subject, date, LIS / PA / Team) styled as a real figure caption.

### 4.3 Team mode specifics

- Either (a) each participant fills it in on their own device and team lead imports their JSON files, or (b) team lead runs it as a group in one session and captures a consensus.
- Show aggregate as: mean polygon (solid), min–max band (shaded), individual polygons (thin lines, toggleable).

### 4.4 Export format — see §6.

---

## 5. Tool 2 — Aggregator Tool

### 5.1 Import

- Drag-and-drop one or many `.json` exports. Files self-describe their scope (individual / team) and their place in the org hierarchy (Product Area, Team).
- Validation on import: schema check, duplicate detection (same person + date), stale-file warning (> 12 months old).

### 5.2 Hierarchy and zoom levels

```
LIS (root)
 ├── Product Area A
 │    ├── Team A1  ──  individuals…
 │    └── Team A2  ──  individuals…
 ├── Product Area B
 │    └── …
 └── …
```

Zoom levels in the UI:

| Level | Shown | Aggregation |
|---|---|---|
| LIS | One large heptagon = mean across all individuals; small heptagons per PA arranged around it | mean, + min/max band |
| Product Area | PA heptagon prominent; small heptagons per team around it | mean within PA |
| Team | Team heptagon; thin lines per individual, anonymised by default | mean, min/max band |
| Individual | Full individual profile (read-only view of their export) | — |

### 5.3 Zoom interaction (d3)

- **Semantic zoom**, not pixel zoom. Clicking a child heptagon smoothly transitions it to centre stage, the current centre shrinks and moves to a "breadcrumb rail" at the top, siblings reflow.
- Use `d3.transition()` with coordinated transforms; animate polygon interpolation between the parent's mean and the child's mean so the user *sees* how the child differs from the aggregate they came from.
- Breadcrumb rail doubles as a back button: `LIS ▸ PA-Research ▸ Team-Discovery`. Clicking any crumb zooms back out with the reverse transition.

### 5.4 Comparison modes

- **Overlay**: select ≤ 3 nodes (teams/PAs), overlay their polygons in distinct colours on one heptagon (matches paper Figure 4 style).
- **Diff vs baseline**: pick baseline (e.g. LIS mean, or Beginner ring), highlight dimensions below baseline in red, above in green.
- **Time travel** (stretch): if multiple exports exist over time, scrub a timeline to animate profile evolution.

### 5.5 Privacy

- Individual names hidden by default at team+ levels; only team lead role can toggle.
- Option to require a minimum n (e.g. ≥ 3) before showing team-level aggregates, to avoid de-anonymisation.

---

## 6. Data format (export JSON)

```json
{
  "schemaVersion": "1.0",
  "heptagonVersion": "Hackl2025",
  "scope": "individual",            // "individual" | "team"
  "subject": {
    "name": "optional",
    "role": "optional",
    "productArea": "Research Support",
    "team": "Discovery Services",
    "participantCount": 1            // > 1 for team scope
  },
  "timestamp": "2026-04-16T10:30:00Z",
  "assessments": {
    "TKS": { "level": 1, "evidence": "…" },
    "AP":  { "level": 2, "evidence": "…" },
    "CTA": { "level": 2, "evidence": null },
    "IS":  { "level": 1, "evidence": null },
    "LRK": { "level": 0, "evidence": null },
    "EAR": { "level": 2, "evidence": null },
    "SIU": { "level": 1, "evidence": null }
  },
  "notes": "optional free text",
  "signature": "sha256(...)"         // optional integrity hash
}
```

- Single file per individual; team export is either a flat team average + individual array, or a zip of individual files. Recommend the latter — the aggregator can always compute means.
- JSON Schema file shipped with the repo (`schema/heptagon-export.schema.json`) and validated on both export and import.

---

## 7. Architecture

- **Static SPA, no backend — ever.** This is a durable principle of the product, not a temporary v1 shortcut. Exported `.json` files are the only persistence mechanism. Aggregation happens entirely client-side.
- **Hosting: GitHub Pages.** Repo lives under a TU/e-LIS GitHub organisation; `main` auto-deploys. No server, no database, no logs.
- **Stack**: Vite + TypeScript + **React** + **d3 v7** for all SVG/animation. Tailwind CSS as utility layer on top of the editorial colour tokens in §8.5 (so the aesthetic is structural, not a Tailwind default).
- **State**: Zustand for app state (lightweight, no Redux ceremony).
- **i18n: English and Dutch.** Using **react-i18next** with two locale files (`en.json`, `nl.json`) covering all UI strings, question wording, Bloom anchors, and growth suggestions. Language toggle in the header persists to `localStorage`. The AI Literacy Team authors content in both languages in a single `content/` JSON keyed by dimension code.
- **Persistence**: `localStorage` only for draft-in-progress of an assessment (cleared on export or explicit "clear draft"); file download for final export; `File System Access API` where available for "save to known folder."
- **No accounts, no telemetry, no analytics.** Not even first-party. The HTML served from Pages is fully self-contained — the only network calls are Google Fonts at load time (optionally self-hosted if the LIS CSP forbids third-party font CDNs).

---

## 8. Visual design direction — "Editorial Diagram"

> Applying the Anthropic `frontend-design` skill. The skill mandates a committed, specific aesthetic direction — not a generic "clean modern dashboard." One direction, executed precisely.

### 8.1 The concept in one sentence

**This tool looks and behaves like an interactive engraved plate from a scientific journal — the kind of figure a reader would tear out and pin to a wall.** Every surface earns that framing: the heptagon is *the* plate, the assessment flow is the *accompanying text*, the aggregator is the *supplement of figures*.

### 8.2 What this explicitly is *not*

- Not a SaaS dashboard (no card-and-shadow grids, no hero purple gradient, no Lucide icon pack everywhere).
- Not a quiz app (no gamified progress bursts, no "you got X%!").
- Not a brand microsite (no TU/e-red hero wash, no full-bleed marketing imagery).
- Not "clean minimal" by default — there is deliberate texture, grain, and marginalia that a generic minimal template would strip out.

### 8.3 The one thing people remember

The heptagon **draws itself like ink on paper** — axes unfurl from a centre point, labels typeset in sequence, the baseline band washes in with a slight irregular edge. When a user answers a question, their polygon redraws with a soft bleed shadow. Staff at TU/e will say "the one where it prints itself."

### 8.4 Typography

Paired, contrasting, and deliberately not a default stack:

| Role | Face | Notes |
|---|---|---|
| Display (plate titles, hero heading, numeric levels) | **Fraunces** (open-source, variable) | Tuned to a high optical size, soft axis ~40, slight `WONK` — gives a warm, romantic editorial feel; avoids the flat modernist serifs that are themselves becoming cliché. |
| Dimension labels on the heptagon | **Fraunces** small caps, letter-spaced +40 | Set on `<textPath>`, arcs tangent to the ring. |
| Body, UI controls | **Söhne** (if TU/e has it licensed) or open-source **Geist** | Refined, restrained grotesque; stays out of the heptagon's way. |
| Mono (dimension codes TKS · AP · CTA · IS · LRK · EAR · SIU, numerals, data tables) | **Commit Mono** or **JetBrains Mono** | Gives the technical-diagram register. Use tabular figures everywhere numeric. |

**Explicitly banned** (per the skill): Inter, Roboto, Arial, system fonts, and Space Grotesk.

### 8.5 Colour

Not a "primary / secondary / accent" design-system palette — a committed editorial one:

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#14121A` | Near-black with a blue-violet undertone — all strokes, text, axes. |
| `--paper` | `#F2EDE3` | Warm off-white archive-paper ground. Never pure white. |
| `--paper-shadow` | `#E6DECC` | Subtle ground shift for layering, never for full panels. |
| `--baseline` | `#C04A2A` | Terracotta wash for the Beginner baseline band (honouring paper Figure 3 but warmer). |
| `--profile` | `#C8102E` | TU/e red, reserved *only* for "your profile" polygon and the one primary CTA per screen. |
| `--gap-marker` | `#8A6A1E` | Muted ochre for below-baseline annotation — deliberately **not** red (red is already "you"). |
| `--annotation` | `#5B4F3A` | Warm brown-grey for marginalia, leader lines, captions. |

**Dark mode** is its own deliberate variant, not a mechanical inversion: `--ink` becomes a warm amber `#E8D6A8`, `--paper` becomes deep midnight indigo `#0E1020`, baseline band deepens to rust. It reads like a lithograph under a warm reading lamp, not like "dashboard dark theme."

### 8.6 Spatial composition

- **7-column grid.** The underlying grid echoes the heptagon (yes, 7 columns, gutters proportional to the ring spacing). On the assessment flow, the 7 dimensions map 1:1 to columns in the progress strip. On the aggregator, PA cards tile into 7-column rhythm.
- **Asymmetric page**, not centred. Hero heptagon sits left-of-centre at ~42% width; the right column holds marginalia, anchor text, and current-dimension detail. Titles hang into the left margin like a scholarly book.
- **Generous negative space around the plate.** At least 120 px of paper-ground around the heptagon at desktop widths. Density appears only in the right-hand annotation column and the numeric tables.
- **One full-bleed moment per tool**: the landing hero. Everywhere else, content sits within paper margins like a printed page.

### 8.7 Surface and atmosphere

- **Paper grain** on every screen: a single SVG `<filter>` combining `feTurbulence (baseFrequency 0.9, numOctaves 2)` and `feColorMatrix` for a near-invisible warm noise at ~4% opacity. Applied once at root.
- **Plate borders**: a 1px `--ink` hairline with a 6 px negative-space gutter and a second 0.25 px outer hairline — the double rule of a printed figure.
- **Leader lines** connect vertices to marginalia with hand-drawn-feeling slight jitter (SVG `stroke-dasharray` plus `feDisplacementMap` seeded differently per line so no two leaders are identical).
- **Library-card stamps** for completion/export states: a rotated mono rectangle with a serial number and date, overprinted in faded terracotta on the paper. Rare, never twice on the same screen.
- **No drop shadows as depth signalling.** Depth comes from ink weight and paper layering, not `box-shadow: 0 4px 12px`.

### 8.8 Motion principles

Motion is **choreographed once per view and then still.** Not "micro-interactions sprinkled throughout" — a printed page doesn't fidget.

- One hero reveal per view (described in §4.2 for the heptagon; simpler for list views).
- All transitions 180–600 ms, `easeCubicInOut` or `easeQuadOut` only. No bouncing, no spring physics, no parallax.
- Polygon interpolation is the *only* place where motion carries information; everywhere else, motion is ceremony, not feedback. Controls respond with ink-weight change, not transforms.
- Full `prefers-reduced-motion` honouring — ink-bleed filters disable, draw animations become opacity fades.

### 8.9 Differentiation — the memorable detail

**Marginalia.** Every vertex and every significant UI element has the option to sprout a serif, italic note with a hand-drawn-feel leader line pointing back to it — the way a scholar annotates a printed figure. This pattern shows up for tooltips, gap explanations, time-travel notes in the aggregator, and figure captions on exports. Nothing else in the institutional-tool landscape looks like this.

### 8.10 Accessibility (non-negotiable)

The aesthetic does not compromise access:
- WCAG AA contrast verified for all ink-on-paper pairs in both themes (the warm palette is chosen to clear 4.5:1 at body sizes and 3:1 at display sizes).
- Full keyboard path through the assessment; focus rings are 2 px terracotta, not browser-default blue.
- The heptagon SVG has `role="img"`, an `aria-labelledby` title, and a linked `<desc>` with a structured text summary ("Profile: TKS Beginner; AP Intermediate; …"). A collapsible text-equivalent table sits under every heptagon.
- Level anchors are **always** shown as text — colour, position, and grain-texture are decorative, never the sole carrier of meaning.
- Font loading uses `font-display: swap` with a well-matched fallback metric to prevent layout shift that would reflow the plate.

### 8.11 Implementation notes for the aesthetic

- Tailwind is fine as a utility layer, but the colour tokens above are defined in `:root` CSS variables first so theming (dark mode, future departments re-skinning) stays declarative.
- The paper grain and ink-bleed filters are defined once in a hidden `<svg>` at app root and referenced by `filter="url(#paper)"` / `filter="url(#bleed)"` — no per-component filter re-declaration.
- One shared React component, `<Plate>`, wraps every "page" — it owns the paper ground, the double-hairline border, the grain filter, and the hanging title — so consistency is structural, not disciplinary.

---

## 9. Content that the AI Literacy Team needs to produce

- Final question wording per dimension (can start verbatim from paper Table 3 anchors).
- Growth suggestions per (dimension × level) — 1–2 bullets each, linking to TU/e internal resources, LIS trainings, external courses.
- Org hierarchy: canonical list of Product Areas and Teams within LIS (dropdown source).
- Short video/animated explainer for the landing page (optional).

This lives in a separate `content/` JSON so copy edits don't require a redeploy by a developer.

---

## 10. Delivery phases

1. **Phase 0 — Spike ✅ (done, 2026-04-16):** Vite + React + TS + d3 scaffold. Editorial Diagram aesthetic implemented as reusable components (`Plate`, `PageHeader`, `Margin`, `Heptagon`, `LanguageToggle`). EN + NL via react-i18next. Reveal choreography working end-to-end. Typecheck and production build clean. GitHub Pages deploy workflow in place. See §13 for what Phase 0 delivered.
2. **Phase 1 — Assessment Tool MVP ✅ (done, 2026-04-17):** Full flow ships — landing with paper citation, scope form, 7-step assessment with live mini-plate sidebar and keyboard navigation, results view with per-dimension cards and JSON + PNG exports. Draft auto-saves to `localStorage` and resumes from landing. Level-to-ring mapping corrected so Unaware sits on the innermost ring (matching paper Figure 3) and the baseline band is the annulus between Unaware and Beginner. Vertex hover tooltips show Bloom anchors. All copy EN + NL. See §15.
3. **Phase 2 — Aggregator Tool MVP ✅ (done, 2026-04-17):** Drag-and-drop JSON import with schema validation and duplicate detection. Hierarchy LIS → Product Area → Team → Individual with breadcrumb navigation. Aggregate heptagon at every level (fractional mean polygon + translucent min–max band). Child grid with mini heptagons; each card shows aggregate shape, count, and a below-baseline warning. Privacy min-n rule hides individual profiles at team level below 3 profiles; toggleable above. Invalid imports produce a plain-English "Files skipped" panel. See §16.
4. **Phase 3 — Polish ✅ (done, 2026-04-17):** Compare mode (select up to 3 sibling nodes and overlay their aggregate polygons in distinct colours — TU/e red, deep blue, forest green — with a legend and numbered badges on selected cards). Baseline-diff mode: numeric delta badges at every vertex with ochre below baseline, terracotta at, warm-grey above, and a legend at the foot of the plate. A11y essentials: `aria-current` on breadcrumb, `aria-live` on children grid, `role="tablist"` on the mode strip, `:focus-visible` rings on every interactive element. See §17.
5. **Phase 4 — Nuanced scoring + role targets ✅ (done, 2026-04-22):** Bumps assessment from one abstract question per dimension to **four behavioural sub-questions** (28 total) with first-person anchors sourced from the AI Literacy Team's mapping document. Dimension score becomes the **fractional mean** of its sub-scores; the heptagon already rendered fractional values so this required no visual change. Introduces **six LIS role archetypes** with target profiles (ranges like B–I, I–E honoured as translucent bands with midpoint deltas). Adds the "About this tool" onboarding block (Why / Reasons / What this is not / How to approach / What happens next). **Schema bumped to v2.0** — v1.0 exports are now rejected with a specific upgrade message. See §18.
5. **Phase 4 — Validation:** pilot with 1 Product Area, gather feedback, iterate on question wording and growth suggestions.

## 13. Phase 0 — what shipped

```
ai-literacy-heptagon/
├── PLAN.md                       this plan
├── README.md                     how to run
├── index.html                    Google Fonts preconnect, root div
├── package.json                  React 18, d3 v7, react-i18next, Vite 5
├── tsconfig.json                 strict mode
├── vite.config.ts                reads VITE_BASE for GitHub Pages
├── .github/workflows/deploy.yml  Pages deploy on push to main
├── sketch/heptagon-hero.html     single-file sketch (phase-0 proof)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── i18n.ts                   language persistence, em-parsing enabled
    ├── locales/
    │   ├── en.json
    │   └── nl.json
    ├── content/
    │   ├── dimensions.ts         seven dimensions, level types, sample profile
    │   └── org.ts                full LIS hierarchy from supplied screenshots
    ├── styles/
    │   ├── tokens.css            editorial palette + type + motion tokens
    │   └── base.css              plate, margin, grid, SVG class styling
    └── components/
        ├── PageHeader.tsx
        ├── Plate.tsx             figure frame + stamp slot + caption
        ├── Margin.tsx             right-column marginalia
        ├── LanguageToggle.tsx
        └── Heptagon.tsx          d3 reveal choreography + a11y desc
```

**Verified**: `npm run typecheck` clean; `npm run build` produces 83 kB gzipped bundle; dev server renders the full reveal on first load; `EN ↔ NL` toggle swaps every piece of copy including axis labels and marginalia; sample below-baseline dimension (LRK) renders the ochre gap vertex and marginalia leader line.

**Not yet built** (deliberate — these are Phase 1):
- Vertex hover tooltips with Bloom anchors.
- The assessment flow itself (questions, state machine, results).
- JSON/PNG export.
- Textpath arcing of dimension labels along the outer ring (sketch uses radial).
- Hot polygon interpolation on profile change (currently does a full redraw, which is fine for now).

---

## 11. Decisions locked in (from conversation 2026-04-16)

| Question | Decision |
|---|---|
| Framework | React + Vite + TypeScript (developer's choice) |
| Hosting | GitHub Pages |
| Org hierarchy | Supplied — see §12 |
| Backend / storage | **None, ever.** Elevated to a product principle (§1, §7). |
| Languages | English + Dutch |
| Multi-tenant / reuse outside LIS | Future feature, not in scope for v1 |

## 15. Phase 1 — what shipped

```
src/
├── state/
│   ├── types.ts                 View | Subject | DraftProfile | EvidenceMap
│   └── draft.ts                 localStorage persistence (key: ailh.draft.v1)
├── export/
│   ├── json.ts                  Builds ExportDocument, downloads with sanitized filename
│   └── png.ts                   SVG → rasterised PNG via canvas (preserves ink-bleed filter)
├── components/
│   ├── Citation.tsx             Paper attribution block (Hackl/Müller/Sailer 2025, arXiv link)
│   └── Heptagon.tsx             +animate mode ("reveal" | "static"), +highlightDim,
│                                 +interactive hover tooltips with Bloom anchors
└── views/
    ├── Landing.tsx              Hero plate + CTAs + notes + Citation
    ├── ScopeForm.tsx            Optional name/role + PA/Team dropdowns from content/org.ts
    ├── Assessment.tsx           One dimension at a time: radios w/ anchor text + evidence
    │                             textarea + mini heptagon sidebar + dimension pip nav
    │                             + arrow-key / 1–4 keyboard shortcuts
    └── Results.tsx              Full plate + JSON export + PNG export + per-dim cards
                                  (below-baseline cards rendered in ochre)
```

**Verified end-to-end in the preview:**
- Landing → Scope → Assessment (7 dims) → Results → Start over.
- JSON export downloads a valid file; round-tripped levels match what was clicked.
- Source citation renders prominently on the landing with arXiv link.
- Language toggle re-renders everything including axis labels, Bloom anchors, and marginalia.

**Paper citation implementation:** the `<Citation>` component renders inside `<main class="page">` with a `grid-column: 1 / -1` band. Full bibliographic entry: authors in small-caps, year, italic title, arXiv venue in mono, direct link, and a note clarifying that this tool is a TU/e LIS implementation aid, not affiliated with the authors. Visible in both languages.

**Level-to-ring semantics (corrected in Phase 1):** level 0 (Unaware) sits on ring 1, level 3 (Expert) sits on ring 4 — matching paper Figure 3. The baseline band is the annulus between ring 1 and ring 2 (the Beginner band). "Below baseline" = level 0, rendering as an ochre vertex on the innermost ring with a leader-line marginalia.

**Known non-issues / by-design deferrals (→ Phase 2+):**
- No URL hash routing yet — views are pure state, refreshing drops you to landing (draft resumes if present). Will add when Aggregator lands in Phase 2.
- Growth suggestions per (dimension × level) not yet populated — cards show the Bloom anchor. Content pass is Phase 3.
- PNG filter fidelity depends on browser SVG rasterisation; tested path exists, visual QA needed on Safari.

## 16. Phase 2 — what shipped

```
src/
├── aggregator/
│   ├── types.ts                 ImportedProfile, Aggregate, Node (hierarchy), Path, Level
│   ├── aggregate.ts             aggregate(), buildTree(), nodeAt(), profileIdOf()
│   └── validate.ts              validateExport() with plain-English errors
├── components/
│   ├── Dropzone.tsx             Drag-and-drop + click-to-select, keyboard accessible
│   └── Heptagon.tsx             +fractional profile values, +band (min–max annulus), +hideVertices
└── views/
    └── Aggregator.tsx           Full view: empty state, breadcrumb, main plate,
                                  side panel with privacy toggle, child grid
```

**Verified end-to-end in the preview with 10 synthetic profiles across 2 PAs and 3 teams:**
- LIS root renders a fractional mean polygon with a dashed translucent min–max band behind it.
- Breadcrumb navigation drills LIS → Library & Open Science → Information Literacy and Education → Alex.
- Child counts display correctly ("3 profiles · 1 team" / "5 profiles").
- At team level, individuals are redacted by default ("Profiles hidden for privacy (need ≥ 3)") and revealed by the "Show individual profiles" toggle.
- Invalid JSON → "Files skipped" panel lists the specific schema violations per file.
- Duplicate detection (same person, team, date, filename) flags re-imports.

**Architectural notes:**
- The aggregator is a *pure function* of the imported profile list. `buildTree` + `aggregate` + `nodeAt` together make drill-down a stateless view over immutable data; the only mutable state is the user's current `path` and `profiles[]`.
- Fractional means are rendered by the same `<Heptagon>` as integer profiles. Vertex position is `R * (level + 1) / 4` — works for any non-negative number, so 1.83 renders on the imaginary ring between Beginner and Intermediate without any extra code path.
- The min–max band is an annulus computed with SVG even-odd fill between the per-dimension max polygon (outer) and min polygon (inner).
- Privacy min-n (default 3) is a UI gate only. The aggregate itself is always computed; the list of individuals is what's hidden. Suitable for a tool with no server persistence.

**Deliberate deferrals (→ Phase 3):**
- Overlay comparison mode (select ≤ 3 siblings and overlay on one plate). Foundations are in place: `<Heptagon>` could render multiple profiles with distinct colours; needs UI affordance for selection + a colour-by-node mapping.
- Diff-vs-baseline mode (highlight dimensions whose mean < 1 in red). Currently implicit via the ochre "N dimensions below baseline" warning + below-baseline card border.
- Time-travel scrubbing across multi-dated imports. Requires grouping profiles by month/quarter and animating polygon interpolation.
- Semantic *zoom* animation on drill (polygon interpolating from parent mean to child mean). Currently snap-navigation.

## 17. Phase 3 — what shipped

```
src/
├── components/Heptagon.tsx     +overlays: HeptagonOverlay[] (multi-profile compare)
│                                +showDeltas: boolean (numeric badges vs baseline)
│                                +hideVertices already existed — now respected by tooltips too
└── views/Aggregator.tsx        +mode toggle (Drill | Compare | Show deltas)
                                 +selection state (≤ 3 child nodes)
                                 +compare legend + numbered card badges
                                 +diff legend swatches (neg / zero / pos)
                                 +a11y: aria-current, aria-live, role=tablist, aria-pressed
```

**Verified end-to-end in the preview:**
- At PA level with 2 teams, Compare mode overlays both team aggregate polygons (red + blue) on one plate, with a "Overlay — Library and Open Science" caption, a "2 / 3" counter, a legend with coloured swatches, and numbered badges "1" / "2" on the selected child cards.
- Show-deltas mode renders per-vertex badges at each axis. LRK on *Information Literacy & Education* renders "−0.2" in ochre (below-baseline hue), all other dims show positive deltas in warm-grey — a team lead can see the one gap at a glance.
- Cards deselect by clicking again; the "Clear selection" button resets. Switching mode clears selection to avoid cross-mode surprises.
- Breadcrumb crumbs have `aria-current="page"` on the active step; children grid has `aria-live="polite"` so assistive tech announces count changes after imports.

**Colour choices for compare overlays:**
- 1 = `var(--profile)` — TU/e red (reserved for "primary selection", matching the profile colour used everywhere else)
- 2 = `#1E4E8C` — deep editorial blue
- 3 = `#3E6B3A` — forest green
Chosen for reliable contrast against the warm paper ground and against each other at ~1.4px stroke weight. Each selected card carries a coloured rim outline + a filled numbered disc badge so the mapping from card to polygon is never ambiguous.

**Deliberate deferrals (→ Phase 4 polish, needs real usage data):**
- **Polygon tween on drill-down.** Currently snap navigation. Requires Heptagon to track previous profile in a ref and use d3's general-update pattern rather than remove+recreate. High polish, moderate code churn — worth doing when the tool has real users to appreciate it.
- **Time-travel scrubbing.** Needs multi-dated imports from the same individuals; defer until teams have run the assessment twice.
- **Onboarding explainer video/tour.** Moderate value; the current landing notes cover the basics.
- **Self-hosted fonts.** Defer until the LIS CSP actually blocks Google Fonts at deploy time.
- **Full screen-reader walkthrough.** A11y essentials are in place; a formal VoiceOver/NVDA audit is cheaper after the content pass.

## 18. Phase 4 — what shipped

```
src/
├── content/
│   ├── questions.ts             +SUB_QUESTIONS map, SUBS_PER_DIM, meanOfSubScores()
│   └── targetProfiles.ts        +6 LIS role archetypes with ranges + rationales
├── components/Heptagon.tsx      +targetBand (dashed annulus + outer dashed outline)
│                                 +deltaMode "off" | "baseline" | "target"
├── views/
│   ├── Assessment.tsx            7 dimension pages × 4 questions each, stacked radios
│   ├── Results.tsx               Fractional mean + sub-score breakdown per dim card
│   │                             + target overlay + "deltas vs baseline" / "vs role target" toggle
│   ├── ScopeForm.tsx             +optional "LIS role archetype" dropdown
│   ├── Aggregator.tsx            Auto-overlays role target when all profiles share a role
│   └── Landing.tsx               Collapsible "About this tool" block with onboarding copy
├── export/json.ts                Schema v2.0: subScores[4] per dimension; roleArchetype on subject
├── aggregator/validate.ts        v1.0 → specific "please retake" error; v2.0 subScores validated
├── state/
│   ├── types.ts                   DraftProfile → DraftSubScores (sub-score arrays)
│   └── draft.ts                   draft key bumped to ailh.draft.v2, version-stamped
└── locales/{en,nl}.json          +28 sub-questions × 4 anchors, +6 role names + descriptions,
                                   +onboarding section (why / reasons / not-a-test / approach / next)
```

**Verified end-to-end in the preview:**
- Individual flow: picks role "Information Literacy & Teaching Support" on the scope form → answers 28 questions → results page shows the red polygon, a dashed target band (the role's point-target profile), and per-vertex delta badges relative to the role target midpoint. SIU came out at 0.50 with a target of Expert (3) → delta "−2.5" rendered in ochre. Mean values round-trip correctly to the JSON export (e.g. TKS = 1.75 from subScores [2,1,2,2]).
- Results view delta-mode toggle switches between *off*, *vs baseline*, and *vs role target* (last option only appears when a role was selected).
- Aggregator rejects v1.0 JSONs with "This is a v1.0 export. The assessment has been upgraded to v2.0 (four sub-questions per dimension); please ask the respondent to re-run the assessment." Dropzone hint updated to "…JSON exports (schema v2.0)…".
- Landing → *About this tool* expands into the full onboarding block (Why / Reasons / What this is not / How to approach / What happens next), typeset inside a double-rule plate with the "What this is not" article set off by horizontal rules and terracotta header.

**Notable implementation choices:**
- **Ranges as bands + midpoint deltas.** A target of B–I renders as a dashed annulus between level 1 and level 2; numeric delta uses the midpoint (1.5). Honours "anywhere in this range is fine" without forcing a single number.
- **No v1 migration.** Simpler, and v1 drafts / exports can't represent sub-score detail. Old drafts orphan under `ailh.draft.v1`; the new flow uses `ailh.draft.v2` keyed by schema version.
- **Target-band rendering reuses the `band` annulus path** — one extra layer with different styling, no new geometry code. Point targets (min === max) get an explicit dashed outer outline so the annulus-collapse doesn't hide them.
- **Role archetype auto-overlay in the aggregator**: when *every* profile at the current node shares a role (Set of role keys has size 1), its target band is drawn automatically; mixed-role groups show no overlay because there's no unambiguous target.
- **Dutch translations are first-pass author drafts and need AI Literacy Team review** before release. Structure is set so review-and-merge is a single-file edit.

**Deliberate deferrals (→ future):**
- **Team-target setter tool.** A simple 7-slider UI for a team lead to set their team's own target and export `team-target.json` for the aggregator. Not blocking; role archetypes cover most cases.
- **Printable team-reflection session guide.** The seven discussion prompts from the mapping document would make a nice printable session sheet. Content exists; rendering is a static export job.
- **Content pass on the Dutch translations.** Structurally done, but a native speaker in the AI Literacy Team should review before wide release.

## 14. Canonical org hierarchy (LIS)

Eight Product Areas. Team list captured verbatim from the supplied screenshots; truncated labels (`…`) are marked **[TRUNCATED]** and must be confirmed with the AI Literacy Team before release.

**Education**
- Alliance Support
- Assessment Support
- Learning Support
- Hybrid Education and Audio Visual … **[TRUNCATED]**
- Student and Education Logistics Su… **[TRUNCATED]**

**Research**
- Data Stewards
- Research IT
- Research Data Literacy & Curation
- Research Data Platform
- Research Tooling
- Research Workflows
- Service Design & User Experience
- Supercomputing Center

**Library and Open Science**
- Information Literacy and Education
- Library Front and Back Office
- Library Collection and Research Inf… **[TRUNCATED]**
- Open Science Support

**Corporate**
- Campus Safety and Security
- Communication and CRM
- Enterprise Service and Process Opti… **[TRUNCATED]**
- Facility Management Support
- Finance and Procurement
- Human Resources Management

**Data and Insights**
- Archive
- Business Intelligence and Analytics
- Data Domain Coordinators
- Data Management
- Privacy Operations

**Platforms**
- Collaboration and Productivity
- Compute and Storage Services
- Identity and Access Management
- Integration Services
- Network and Connectivity Services
- Security Operations
- Workplace Management

**Services**
- Departmental Support
- Service Operations
- Student and Employee Service Desk
- Workplace Devices

**Office of the CIO** *(structurally parallel to the eight Product Areas; render in the aggregator as a ninth top-level node)*
- Agile Center of Excellence (ACE)
- Contract and Supplier management
- Communication
- Enterprise Architecture
- Governance, Risk and Compliance

This list lives in `content/org.json` so updates don't require a code change.
