"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import Dropzone from "@/components/Dropzone";
import Preview from "@/components/Preview";
import Diagnostics, { Diagnostic } from "@/components/Diagnostics";
import { renderPreview } from "@/lib/preview";

const EMPTY_MD = `# Ready to convert

- Drop an .rtf file on the left or click Upload + Convert
- Markdown appears in the editor
- Preview updates live (or manually)
- Copy / Download when you're happy

| Feature | Status |
| --- | --- |
| Tables | ✅ |
| Copy/Download | ✅ |
| Diagnostics | ✅ |`;

type ConvertResponse = {
  markdown: string;
  warnings?: string[];
  stderr?: string;
  meta?: { ms?: number; bytesIn?: number; bytesOut?: number };
  error?: string;
};

export default function Page() {
  const [markdown, setMarkdown] = useState(EMPTY_MD);
  const [html, setHtml] = useState("");
  const [livePreview, setLivePreview] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [stderr, setStderr] = useState<string | undefined>(undefined);
  const [meta, setMeta] = useState<{ ms?: number; bytesIn?: number; bytesOut?: number } | undefined>(undefined);
  const [enableGfmExtras, setEnableGfmExtras] = useState(false);
  const lastFileRef = useRef<File | null>(null);

  const addDiag = (level: Diagnostic["level"], message: string) => {
    const now = new Date().toLocaleTimeString();
    setDiagnostics((d) => [{ level, message, time: now }, ...d].slice(0, 12));
  };

  const doRender = useCallback(
    async (md: string) => {
      setIsRendering(true);
      try {
        const { html, removedUnsafe } = await renderPreview(md, { enableGfmExtras });
        setHtml(html);
        if (removedUnsafe && removedUnsafe > 0) {
          addDiag("warn", `Sanitizer removed ${removedUnsafe} unsafe node(s).`);
        }
      } catch (err) {
        addDiag("error", `Preview render failed: ${(err as Error).message}`);
      } finally {
        setIsRendering(false);
      }
    },
    [enableGfmExtras]
  );

  const debouncedRender = useMemo(() => debounce(doRender, 350), [doRender]);

  const handleMarkdownChange = (text: string) => {
    setMarkdown(text);
    if (livePreview) debouncedRender(text);
  };

  const handleConvert = async (file: File) => {
    lastFileRef.current = file;
    if (file.size > 2.5 * 1024 * 1024) {
      addDiag("error", "File exceeds 2.5 MB guardrail.");
      return;
    }
    setIsConverting(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/convert", { method: "POST", body: form });
      const data = (await res.json()) as ConvertResponse;
      if (!res.ok || data.error) {
        addDiag("error", data.error || "Conversion failed");
        setIsConverting(false);
        return;
      }
      setMarkdown(data.markdown || "");
      setStderr(data.stderr);
      setMeta(data.meta);
      data.warnings?.forEach((w) => addDiag("warn", w));
      addDiag("info", `Converted ${file.name}`);
      if (livePreview) doRender(data.markdown || "");
    } catch (err) {
      addDiag("error", `Conversion error: ${(err as Error).message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const onRenderClick = () => doRender(markdown);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addDiag("info", `${label} copied to clipboard.`);
    } catch {
      addDiag("error", "Clipboard copy failed (permission?).");
    }
  };

  const download = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addDiag("info", `Downloaded ${filename}`);
  };

  // initial render
  useEffect(() => {
    doRender(EMPTY_MD);
  }, [doRender]);

  return (
    <>
      <header>
        <h1>RTF → Markdown</h1>
        <p className="hint">CommonMark_x + pipe_tables (pandoc) with sanitized preview.</p>
      </header>
      <main>
        <section className="panel stack" aria-label="Upload and Markdown">
          <Dropzone onFileSelected={handleConvert} disabled={isConverting} />
          <div className="row">
            <button className="btn" onClick={() => lastFileRef.current && handleConvert(lastFileRef.current)} disabled={!lastFileRef.current || isConverting}>
              {isConverting ? "Converting…" : "Convert again"}
            </button>
            <button className="btn secondary" onClick={() => setLivePreview((v) => !v)}>
              Live preview: {livePreview ? "ON" : "OFF"}
            </button>
            <label className="toggle">
              <input
                type="checkbox"
                checked={enableGfmExtras}
                onChange={(e) => setEnableGfmExtras(e.target.checked)}
              />
              Enable task lists/strikethrough/autolink (GFM)
            </label>
            <button className="btn secondary" onClick={onRenderClick} disabled={isRendering}>
              {isRendering ? "Rendering…" : "Render Preview"}
            </button>
          </div>
          <label className="hint" htmlFor="markdown">Markdown (editable)</label>
          <textarea
            id="markdown"
            spellCheck={false}
            value={markdown}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            aria-label="Markdown editor"
          />
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn secondary" onClick={() => copy(markdown, "Markdown")}>Copy Markdown</button>
            <button className="btn secondary" onClick={() => copy(html, "Rendered HTML")}>Copy HTML</button>
            <button className="btn secondary" onClick={() => download(markdown, "converted.md")}>Download .md</button>
          </div>
        </section>
        <section className="panel stack" aria-label="Preview and diagnostics">
          <div className="stack">
            <div className="hint">Rendered preview (sanitized)</div>
            <Preview html={html} />
          </div>
          <Diagnostics items={diagnostics} stderr={stderr} meta={meta} />
        </section>
      </main>
    </>
  );
}
