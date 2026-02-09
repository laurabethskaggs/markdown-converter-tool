import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

export type PreviewOptions = {
  enableGfmExtras?: boolean; // task lists, strikethrough, autolink
};

type PreviewResult = { html: string; removedUnsafe?: number };

const tableSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td"
  ],
  attributes: {
    ...(defaultSchema.attributes || {}),
    table: ["className"],
    th: ["colspan", "rowspan", "align"],
    td: ["colspan", "rowspan", "align"],
    code: ["className"]
  }
};

const estimateUnsafe = (md: string) => {
  const matches = md.match(/<script|onerror=|onload=|javascript:/gi);
  return matches ? matches.length : 0;
};

function stripGfmExtras() {
  return (tree: any) => {
    // Flatten strikethrough nodes into plain children.
    visit(tree, "delete", (node, index, parent) => {
      if (!parent || index === null || !Array.isArray(parent.children)) return;
      parent.children.splice(index, 1, ...(node as any).children || []);
    });
    // Remove task list checkboxes.
    visit(tree, "listItem", (node: any) => {
      if (typeof node.checked === "boolean") {
        delete node.checked;
      }
    });
  };
}

export async function renderPreview(markdown: string, options: PreviewOptions = {}): Promise<PreviewResult> {
  const removedGuess = estimateUnsafe(markdown);
  const processor = unified()
    .use(remarkParse)
    // remark-gfm is used primarily for pipe tables; extras are optionally stripped.
    .use(remarkGfm)
    .use(options.enableGfmExtras ? () => {} : stripGfmExtras)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, tableSchema)
    .use(rehypeStringify);

  const file = await processor.process(markdown);
  return { html: String(file), removedUnsafe: removedGuess };
}
