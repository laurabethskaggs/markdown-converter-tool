# RTF → Markdown Converter

Client-side Next.js tool that converts `.rtf` files to **CommonMark_x + pipe_tables** via `pandoc.wasm`, shows editable Markdown, a sanitized preview, copy/download actions, and diagnostics.

## How it works
- **Conversion**: `pandoc.wasm` with `-f rtf -t commonmark_x+pipe_tables --wrap=none`. Runs inside the API route (`app/api/convert/route.ts`) using the `wasm-pandoc` package; the wasm binary is copied to `public/pandoc.wasm` on `npm install`.
- **Preview dialect**: CommonMark with pipe tables to match pandoc output. Optional GFM extras (task lists, strikethrough, autolink) are off by default and can be toggled; preview uses the same flag.
- **Sanitization**: `rehype-sanitize` guards against XSS. If unsafe nodes are detected, a warning is shown.
- **Tables**: Simple tables become pipe tables. If pandoc emits HTML (merged cells, nested blocks), we keep the HTML and warn that fidelity may be lossy; preview still renders sanitized HTML.
- **Diagnostics**: Shows warnings, stderr (if present), and meta (time, bytes in/out). File size guardrail is 2.5 MB.

## Project layout
- `app/page.tsx` — UI (upload/convert, editor, preview, controls, diagnostics).
- `app/api/convert/route.ts` — Server conversion endpoint using pandoc.wasm.
- `lib/pandoc.ts` — Pandoc wrapper (init + conversion).
- `lib/preview.ts` — Markdown → sanitized HTML renderer (remark/rehype).
- `components/` — Dropzone, Preview, Diagnostics UI pieces.
- `public/pandoc.wasm` — copied from `wasm-pandoc` during postinstall.

## Getting started
```bash
pnpm install   # or npm install / yarn
pnpm dev       # start Next.js dev server
```

If `pandoc.wasm` is missing (e.g., CI), run `node scripts/copy-pandoc-wasm.js`.

## Deploying to Vercel
- No native pandoc needed; wasm binary is served from `public/pandoc.wasm`.
- Keep files ≤2.5 MB to avoid function time/memory blowups.
- Ensure `experimental.wasm` is enabled in `next.config.js` (already set).

## Known limitations
- Complex tables with merged cells stay as HTML; markdown tables cannot express that structure.
- Sanitizer strips unsafe HTML; complex inline scripts/handlers will be removed.
- Conversion depends on `wasm-pandoc`; cold starts may add latency.
