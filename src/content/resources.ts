/**
 * Learning-resource pointers shown at the bottom of the Results page.
 *
 * Two buckets:
 *   - GENERAL_RESOURCES: items that aren't tied to a single dimension
 *     (libguides home, AI policy page, recommended books, training catalog).
 *   - PER_DIMENSION_RESOURCES: items grouped by dimension code (TKS, AP, …).
 *
 * Both arrays ship empty at v3.0 launch — the Results UI hides any section
 * whose list is empty. Fill in the placeholders below as content becomes
 * available; no code change is needed.
 */

import { DimensionCode } from "./dimensions";

export type ResourceKind = "libguide" | "guide" | "book" | "policy" | "course" | "other";

export interface Resource {
  title: string;
  url: string;
  kind: ResourceKind;
  /** Optional one-line subtitle / publisher / author shown next to the title. */
  by?: string;
}

/** Resources that aren't tied to a single dimension. */
export const GENERAL_RESOURCES: Resource[] = [
  // { title: "TU/e LIS — AI literacy libguide", url: "https://...", kind: "libguide" },
  // { title: "TU/e Copilot guide", url: "https://...", kind: "guide" },
];

/** Per-dimension resources. Missing keys / empty arrays are hidden in the UI. */
export const PER_DIMENSION_RESOURCES: Partial<Record<DimensionCode, Resource[]>> = {
  // TKS: [{ title: "How LLMs work — explainer", url: "https://...", kind: "guide" }],
  // AP:  [{ title: "Prompt engineering for educators", url: "https://...", kind: "guide" }],
  // CTA: [],
  // IS:  [],
  // LRK: [],
  // EAR: [],
  // SIU: [],
};
