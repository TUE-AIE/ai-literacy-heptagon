import { AssessmentDraft } from "./types";

/**
 * Draft is keyed by schema version so a v2 → v3 upgrade naturally discards
 * old drafts (rather than trying to migrate incomplete answers).
 */
const KEY = "ailh.draft.v3";

export function loadDraft(): AssessmentDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AssessmentDraft;
    if (!parsed || typeof parsed !== "object" || parsed.version !== "3.0" || !parsed.subject) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: AssessmentDraft): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch { /* quota, private mode, etc — silently ignore */ }
}

export function clearDraft(): void {
  try { window.localStorage.removeItem(KEY); } catch { /* noop */ }
}
