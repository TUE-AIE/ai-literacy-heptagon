import { ReactNode } from "react";

export interface MarginNote {
  title: string;
  /** HTML-rich string (italic <em> etc.) — passed through dangerouslySetInnerHTML. */
  body: string;
}

/** Right-column marginalia. Renders a list of titled notes separated by hairline rules. */
export function Margin({ notes }: { notes: MarginNote[] }) {
  return (
    <aside className="margin">
      {notes.map((n, i) => (
        <div key={n.title}>
          <h3>{n.title}</h3>
          <p dangerouslySetInnerHTML={{ __html: n.body }} />
          {i < notes.length - 1 && <hr className="rule" />}
        </div>
      ))}
    </aside>
  );
}

/** A bare <div> that places its contents in the right-hand margin slot. */
export function MarginSlot({ children }: { children: ReactNode }) {
  return <div className="margin-slot">{children}</div>;
}
