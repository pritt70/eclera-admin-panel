"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Eye,
  Minus,
  RotateCcw,
} from "lucide-react";

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function HtmlEditor({
  value,
  onChange,
  placeholder = "Write content in HTML or rich text...",
  minHeight = "240px",
}: HtmlEditorProps) {
  const [mode, setMode] = useState<"visual" | "html" | "preview">("visual");
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external value changes into the contentEditable div only when not focused or mode switches
  useEffect(() => {
    if (editorRef.current && mode === "visual") {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, mode]);

  const handleVisualInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (mode !== "visual") {
      setMode("visual");
      setTimeout(() => {
        editorRef.current?.focus();
        document.execCommand(command, false, arg);
        handleVisualInput();
      }, 50);
      return;
    }
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleVisualInput();
  };

  const handleCreateLink = () => {
    const url = prompt("Enter link URL (e.g. https://... or /contact):");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  return (
    <div className="border border-slate-200 rounded-[3px] bg-white overflow-hidden shadow-xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-1">
          {/* Format Block Headings */}
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<h2>")}
            className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<h3>")}
            className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<p>")}
            className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Paragraph"
          >
            P
          </button>

          <span className="w-[1px] h-4 bg-slate-300 mx-1" />

          {/* Inline Styles */}
          <button
            type="button"
            onClick={() => executeCommand("bold")}
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("underline")}
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <span className="w-[1px] h-4 bg-slate-300 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => executeCommand("insertUnorderedList")}
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertOrderedList")}
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <span className="w-[1px] h-4 bg-slate-300 mx-1" />

          {/* Link & Line */}
          <button
            type="button"
            onClick={handleCreateLink}
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertHorizontalRule")}
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Horizontal Divider"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("removeFormat")}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition cursor-pointer"
            title="Clear Formatting"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode Toggle: Visual / HTML Code / Preview */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-[3px]">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={`px-2 py-1 text-xs font-medium rounded-[2px] transition-colors cursor-pointer ${
              mode === "visual"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode("html")}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-[2px] transition-colors cursor-pointer ${
              mode === "html"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code className="w-3 h-3" />
            <span>HTML</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-[2px] transition-colors cursor-pointer ${
              mode === "preview"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative bg-white" style={{ minHeight }}>
        {mode === "visual" && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleVisualInput}
            onBlur={handleVisualInput}
            style={{ minHeight }}
            className="p-3.5 text-xs text-slate-800 focus:outline-none max-h-[380px] overflow-y-auto leading-relaxed prose prose-sm max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none empty:before:block"
            data-placeholder={placeholder}
          />
        )}

        {mode === "html" && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "<p>Write your raw HTML here...</p>"}
            style={{ minHeight }}
            className="w-full h-full max-h-[380px] p-3.5 text-xs font-mono bg-slate-900 text-slate-100 focus:outline-none resize-none leading-relaxed"
          />
        )}

        {mode === "preview" && (
          <div className="p-4 max-h-[380px] overflow-y-auto bg-slate-50/50" style={{ minHeight }}>
            {value ? (
              <div
                className="prose prose-sm text-xs max-w-none text-slate-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <p className="text-xs text-slate-400 italic">No content to preview.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
