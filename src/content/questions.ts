/**
 * Self-reflection questions — four per dimension, each scored 0..3.
 * The dimension score is the mean of its four sub-scores (a fractional level).
 *
 * Source: "AI Literacy Mapping LIS" (AI Literacy Team, TU/e LIS, 2026).
 * The text below is only the English source; the i18n layer provides
 * translated copies keyed by `questions.<dimCode>.<subKey>`.
 */

import { DimensionCode } from "./dimensions";

export interface SubQuestion {
  /** Stable id within the dimension (e.g. "TKS1"). Also the i18n key suffix. */
  id: string;
  /** Number of answer levels — always 4 (Unaware, Beginner, Intermediate, Expert). */
}

/** Number of sub-questions per dimension. Change cautiously — it affects the mean. */
export const SUBS_PER_DIM = 4;

/** i18n keys for each sub-question, in display order. */
export const SUB_QUESTIONS: Record<DimensionCode, string[]> = {
  TKS: ["TKS1", "TKS2", "TKS3", "TKS4"],
  AP:  ["AP1",  "AP2",  "AP3",  "AP4"],
  CTA: ["CTA1", "CTA2", "CTA3", "CTA4"],
  IS:  ["IS1",  "IS2",  "IS3",  "IS4"],
  LRK: ["LRK1", "LRK2", "LRK3", "LRK4"],
  EAR: ["EAR1", "EAR2", "EAR3", "EAR4"],
  SIU: ["SIU1", "SIU2", "SIU3", "SIU4"]
};

/** Flat list, handy for iteration. */
export const ALL_SUB_QUESTIONS: { dim: DimensionCode; sub: string }[] =
  (Object.keys(SUB_QUESTIONS) as DimensionCode[]).flatMap((dim) =>
    SUB_QUESTIONS[dim].map((sub) => ({ dim, sub }))
  );

/**
 * Compute the fractional mean of an array of integer sub-scores.
 * Returns `undefined` if any sub-score is missing (incomplete answer).
 */
export function meanOfSubScores(subs: (number | undefined)[]): number | undefined {
  if (subs.length === 0) return undefined;
  if (subs.some((s) => typeof s !== "number")) return undefined;
  return (subs as number[]).reduce((a, b) => a + b, 0) / subs.length;
}
