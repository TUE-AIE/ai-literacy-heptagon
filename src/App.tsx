import { useEffect, useState } from "react";
import { LanguageToggle } from "./components/LanguageToggle";
import { Landing } from "./views/Landing";
import { ScopeForm } from "./views/ScopeForm";
import { Assessment } from "./views/Assessment";
import { Results } from "./views/Results";
import { Aggregator } from "./views/Aggregator";
import { DraftProfile, EMPTY_SUBJECT, Subject, View } from "./state/types";
import { loadDraft, saveDraft, clearDraft } from "./state/draft";
import { DIMENSIONS } from "./content/dimensions";

export default function App() {
  const [view, setView] = useState<View>({ kind: "landing" });
  const [draftOnDisk, setDraftOnDisk] = useState(loadDraft());

  // Persist draft on every assess-state update.
  useEffect(() => {
    if (view.kind === "assess") {
      saveDraft({
        subject: view.subject,
        levels: view.levels,
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
            levels: d.levels,
            evidence: d.evidence,
            index: firstUnansweredIndex(d.levels)
          })}
          onStart={(mode) => {
            const subject: Subject = { ...EMPTY_SUBJECT, scope: mode };
            setView({ kind: "scope", subject });
          }}
          onOpenAggregator={() => setView({ kind: "aggregator" })}
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
              levels: {},
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
          levels={view.levels}
          evidence={view.evidence}
          index={view.index}
          onChange={(levels, evidence) =>
            setView({ ...view, levels, evidence })
          }
          onNavigate={(index) => setView({ ...view, index })}
          onBack={() => setView({ kind: "scope", subject: view.subject })}
          onFinish={(profile, evidence) => {
            clearDraft();
            setDraftOnDisk(null);
            setView({ kind: "results", subject: view.subject, profile, evidence });
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
        evidence={view.evidence}
        onStartOver={() => setView({ kind: "landing" })}
      />
    </>
  );
}

function firstUnansweredIndex(levels: DraftProfile): number {
  for (let i = 0; i < DIMENSIONS.length; i++) {
    if (levels[DIMENSIONS[i].code] === undefined) return i;
  }
  return DIMENSIONS.length - 1;
}
