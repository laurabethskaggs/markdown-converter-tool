"use client";

type Props = { html: string };

export default function Preview({ html }: Props) {
  return (
    <div className="preview" aria-live="polite" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
