import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
}

/** Drag-and-drop zone with click-to-select fallback. */
export function Dropzone({ onFiles, accept = ".json,application/json" }: DropzoneProps) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files: File[] = [];
      if (e.dataTransfer.items) {
        for (const item of Array.from(e.dataTransfer.items)) {
          if (item.kind === "file") {
            const f = item.getAsFile();
            if (f) files.push(f);
          }
        }
      } else {
        for (const f of Array.from(e.dataTransfer.files)) files.push(f);
      }
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    onFiles(Array.from(list));
    // Reset so selecting the same file again fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className={"dropzone" + (dragging ? " is-dragging" : "")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <p className="dropzone-prompt">
        <span>{t("aggregator.drop.prompt")}</span>
        <span className="dropzone-or">— {t("aggregator.drop.or")} —</span>
        <span className="dropzone-pick">{t("aggregator.drop.pick")}</span>
      </p>
      <p className="dropzone-hint">{t("aggregator.drop.hint")}</p>
    </div>
  );
}
