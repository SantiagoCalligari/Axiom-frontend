/// components/comments/ShadcnMDE.tsx

import React from "react";
import ReactMde from "react-mde";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkMath from "remark-math";
import rehypeKaTeX from "rehype-katex";
import "katex/dist/katex.min.css";
import "react-mde/lib/styles/css/react-mde-all.css";
import clsx from "clsx";

interface ShadcnMDEProps {
  value: string;
  onChange: (v: string) => void;
  selectedTab: "write" | "preview";
  onTabChange: (tab: "write" | "preview") => void;
  minHeight?: number;
  placeholder?: string;
}

export function ShadcnMDE({
  value,
  onChange,
  selectedTab,
  onTabChange,
  minHeight = 80,
  placeholder,
}: ShadcnMDEProps) {
  return (
    <div>
      {/* Custom Tabs */}
      <div className="mb-1 flex gap-1">
        <button
          type="button"
          className={clsx(
            "px-3 py-1 rounded-t-md text-xs font-medium border-b-2 transition",
            selectedTab === "write"
              ? "border-primary bg-background text-primary"
              : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onTabChange("write")}
        >
          Escribir
        </button>
        <button
          type="button"
          className={clsx(
            "px-3 py-1 rounded-t-md text-xs font-medium border-b-2 transition",
            selectedTab === "preview"
              ? "border-primary bg-background text-primary"
              : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onTabChange("preview")}
        >
          Vista previa
        </button>
      </div>
      {/* Editor */}
      <div className="[&_.mde-tabs]:hidden [&_.mde-header]:hidden">
        <ReactMde
          value={value}
          onChange={onChange}
          selectedTab={selectedTab}
          onTabChange={onTabChange}
          minEditorHeight={minHeight}
          minPreviewHeight={minHeight}
          generateMarkdownPreview={async (markdown) => (
            <div className="bg-muted border rounded-md p-3 min-h-[80px] prose prose-sm dark:prose-invert text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeSanitize, rehypeKaTeX]}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          )}
          childProps={{
            writeButton: { tabIndex: -1 },
            previewButton: { tabIndex: -1 },
          }}
          classes={{
            textArea:
              "bg-background border rounded-md border-input focus:outline-none focus:ring-2 focus:ring-primary/30 px-3 py-2 min-h-[80px] text-sm font-mono",
            toolbar:
              "flex gap-1 bg-muted border-b rounded-t-md px-2 py-1",
            preview:
              "bg-muted border rounded-md p-3 min-h-[80px] prose prose-sm dark:prose-invert text-foreground",
          }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Soporta <b>Markdown</b> y <b>LaTeX</b> (<span className="font-mono">{"$a^2 + b^2 = c^2$"}</span>).
        <span className="ml-2">Usá los botones para listas, negrita, etc.</span>
      </div>
    </div>
  );
}
