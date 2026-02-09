import { NextResponse } from "next/server";
import { convertRtfToMarkdown } from "@/lib/pandoc";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".rtf")) {
    return NextResponse.json({ error: "Only .rtf files are supported." }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File is too large. Max 2.5 MB for browser conversion." }, { status: 413 });
  }

  const rtfText = await file.text();

  try {
    const result = await convertRtfToMarkdown(rtfText);
    return NextResponse.json({
      markdown: result.markdown,
      warnings: result.warnings,
      stderr: result.stderr,
      meta: result.meta
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Conversion failed." },
      { status: 500 }
    );
  }
}
