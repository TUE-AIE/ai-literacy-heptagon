import { ReactNode, useEffect, useRef } from "react";

interface PlateProps {
  children: ReactNode;
  /** Library-card stamp text. Renders in the top-right corner. Optional. */
  stamp?: string;
  /** Caption left side — rich text (ReactNode) so it can include <em>, <strong>, etc. */
  captionLeft?: ReactNode;
  /** Caption right side — terminal meta, mono-cased. */
  captionRight?: ReactNode;
  /** Delay (ms) before the stamp fades in. Default 3800 (matches heptagon reveal). */
  stampDelay?: number;
}

/**
 * A <figure> that styles itself like a printed plate: double hairline rule,
 * interior ruling, and an optional rotated library-card stamp that overprints
 * after the main reveal finishes.
 */
export function Plate({
  children,
  stamp,
  captionLeft,
  captionRight,
  stampDelay = 3800
}: PlateProps) {
  const stampRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stamp || !stampRef.current) return;
    const el = stampRef.current;
    el.classList.remove("is-visible");
    const id = window.setTimeout(() => el.classList.add("is-visible"), stampDelay);
    return () => window.clearTimeout(id);
  }, [stamp, stampDelay]);

  return (
    <figure className="plate">
      {stamp && <div className="stamp" ref={stampRef}>{stamp}</div>}
      {children}
      {(captionLeft || captionRight) && (
        <figcaption>
          {captionLeft && <span>{captionLeft}</span>}
          {captionRight && <span className="meta">{captionRight}</span>}
        </figcaption>
      )}
    </figure>
  );
}
