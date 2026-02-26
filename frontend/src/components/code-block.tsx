"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki/bundle/web";

interface CodeBlockProps {
  code: string;
  language: string;
  maxLines?: number;
}

export function CodeBlock({ code, language, maxLines }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");

  const displayCode = maxLines
    ? code.split("\n").slice(0, maxLines).join("\n")
    : code;

  useEffect(() => {
    let cancelled = false;
    codeToHtml(displayCode, {
      lang: language || "plaintext",
      theme: "github-dark",
    })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        // Fallback for unsupported languages
        if (!cancelled) {
          codeToHtml(displayCode, {
            lang: "plaintext",
            theme: "github-dark",
          }).then((result) => {
            if (!cancelled) setHtml(result);
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [displayCode, language]);

  if (!html) {
    return (
      <pre className="overflow-x-auto rounded-md bg-[#24292e] p-4 text-sm text-gray-300">
        <code>{displayCode}</code>
      </pre>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-md text-sm [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
