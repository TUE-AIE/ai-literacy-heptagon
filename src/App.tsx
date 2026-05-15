import { useEffect, useState } from "react";
import { LanguageToggle } from "./components/LanguageToggle";
import { Landing } from "./views/Landing";
import { ScopeForm } from "./views/ScopeForm";
import { Assessment } from "./views/Assessment";
import { Results } from "./views/Results";
import { Aggregator } from "./views/Aggregator";
import { DraftSubScores, EMPTY_SUBJECT, Subject, View } from "./state/types";
import { loadDraft, saveDraft, clearDraft } from "./state/draft";
import { DIMENSIONS } from "./content/dimensions";
import { SUBS_PER_DIM } from "./content/questions";

/**
 * The aggregator is no longer linked from the landing in V3 — facilitators
 * reach it with ?aggregator=1 in the URL. The view is detected once on mount.
 */
function aggregatorRequested(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("aggregator");
}

export default function App() {
  const [view, setView] = useState<View>(
    aggregatorRequested() ? { kind: "aggregator" } : { kind: "landing" }
  );
  const [draftOnDisk, setDraftOnDisk] = useState(loadDraft());

  // Persist draft on every assess-state update.
  useEffect(() => {
    if (view.kind === "assess") {
      saveDraft({
        version: "3.0",
        subject: view.subject,
        subScores: view.subScores,
        evidence: view.evidence,
        updatedAt: new Date().toISOString()
      });
    }
  }, [view]);

  // Scroll to top on view change.
  useEffect(() => { window.scrollTo({ top: 0 }); }, [view.kind]);

  if (view.kind === "landing") {
    return (
      <>
        <LanguageToggle />
        <Landing
          draft={draftOnDisk}
          onResume={(d) => setView({
            kind: "assess",
            subject: d.subject,
            subScores: d.subScores,
            evidence: d.evidence,
            index: firstUnansweredIndex(d.subScores)
          })}
          onStart={() => {
            const subject: Subject = { ...EMPTY_SUBJECT };
            setView({ kind: "scope", subject });
          }}
        />
      </>
    );
  }

  if (view.kind === "aggregator") {
    return <Aggregator onExit={() => setView({ kind: "landing" })} />;
  }

  if (view.kind === "scope") {
    return (
      <>
        <LanguageToggle />
        <ScopeForm
          initial={view.subject}
          onBack={() => setView({ kind: "landing" })}
          onSubmit={(subject) =>
            setView({
              kind: "assess",
              subject,
              subScores: {},
              evidence: {},
              index: 0
            })
          }
        />
      </>
    );
  }

  if (view.kind === "assess") {
    return (
      <>
        <LanguageToggle />
        <Assessment
          subject={view.subject}
          subScores={view.subScores}
          evidence={view.evidence}
          index={view.index}
          onChange={(subScores, evidence) =>
            setView({ ...view, subScores, evidence })
          }
          onNavigate={(index) => setView({ ...view, index })}
          onBack={() => setView({ kind: "scope", subject: view.subject })}
          onFinish={(profile, subScores, evidence) => {
            clearDraft();
            setDraftOnDisk(null);
            setView({ kind: "results", subject: view.subject, profile, subScores, evidence });
          }}
        />
      </>
    );
  }

  // results
  return (
    <>
      <LanguageToggle />
      <Results
        subject={view.subject}
        profile={view.profile}
        subScores={view.subScores}
        evidence={view.evidence}
        onStartOver={() => setView({ kind: "landing" })}
      />
    </>
  );
}

/** Find the first dimension that doesn't have all four sub-scores filled. */
function firstUnansweredIndex(subScores: DraftSubScores): number {
  for (let i = 0; i < DIMENSIONS.length; i++) {
    const subs = subScores[DIMENSIONS[i].code] ?? [];
    const complete = subs.length === SUBS_PER_DIM && subs.every((s) => typeof s === "number");
    if (!complete) return i;
  }
  return DIMENSIONS.length - 1;
}
