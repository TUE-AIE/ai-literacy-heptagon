import { AssessmentDraft } from "./types";

const KEY = "ailh.draft.v1";

export function loadDraft(): AssessmentDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AssessmentDraft;
    // light shape check — anything malformed is treated as no draft
    if (!parsed || typeof parsed !== "object" || !parsed.subject) return null;
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
