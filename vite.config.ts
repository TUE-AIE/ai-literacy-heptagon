import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site from `/<repo>/`. The `VITE_BASE` env var lets
// the deploy workflow override this; locally the base is just `/`.
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 5173, host: true }
});
