import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RTF → Markdown Converter",
  description: "Convert RTF to CommonMark with table support and live, sanitized preview."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
