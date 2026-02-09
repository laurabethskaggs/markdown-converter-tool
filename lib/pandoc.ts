import { pandoc, ensureInitialized } from "wasm-pandoc";

type ConvertResult = {
  markdown: string;
  meta: { ms: number; bytesIn: number; bytesOut: number };
  stderr?: string;
  warnings: string[];
};

let initialized = false;

async function init() {
  if (initialized) return;
  // Load wasm from public path so Vercel can serve it.
  await ensureInitialized("/pandoc.wasm");
  initialized = true;
}

export async function convertRtfToMarkdown(rtf: string): Promise<ConvertResult> {
  await init();
  const start = performance.now();
  try {
    const result = await pandoc('-f rtf -t commonmark_x+pipe_tables --wrap=none', rtf);
    const markdown = (result?.out ?? "").trim();
    const ms = performance.now() - start;
    const warnings: string[] = [];
    // If Pandoc emitted HTML tables, warn about fidelity.
    if (/<table[\s>]/i.test(markdown) || /colspan=|rowspan=/i.test(markdown)) {
      warnings.push("This table contains merged cells or complex content; Markdown tables may be lossy. Preview uses sanitized HTML.");
    }
    return {
      markdown,
      meta: {
        ms,
        bytesIn: Buffer.byteLength(rtf, "utf-8"),
        bytesOut: Buffer.byteLength(markdown, "utf-8")
      },
      stderr: result?.log?.trim?.() || "",
      warnings
    };
  } catch (err) {
    throw new Error((err as Error).message || "Pandoc conversion failed");
  }
}
