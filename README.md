# AI Literacy Heptagon

Interactive self-assessment tool for AI literacy at TU/e Library & Information Services,
based on the heptagon framework in Hackl, Müller, Sailer (2026).

See [PLAN.md](PLAN.md) for the full product plan and aesthetic direction.
See [sketch/heptagon-hero.html](sketch/heptagon-hero.html) for the standalone phase-0 sketch.

## Develop

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the built bundle
npm run typecheck
```

## Principles

- **No backend, ever.** Static site; data only leaves the browser when the user downloads an export.
- **GitHub Pages** hosted via the workflow in `.github/workflows/deploy.yml`.
- **EN + NL** via `react-i18next`.
- **Editorial Diagram** aesthetic — committed direction, not a generic dashboard (see PLAN §8).
