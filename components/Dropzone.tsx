"use client";

import { useRef, useState } from "react";

type Props = {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  accept?: string;
};

export default function Dropzone({ onFileSelected, disabled, accept = ".rtf,application/rtf" }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFileSelected(files[0]);
  };

  return (
    <div
      className={`dropzone ${isOver ? "dragover" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      aria-label="Upload RTF"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="label">Drop .rtf here or click to choose</div>
      <div className="hint">Only .rtf files. Max 2.5 MB.</div>
    </div>
  );
}
