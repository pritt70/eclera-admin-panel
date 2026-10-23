"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/helper";
import {
  Calendar,
  Link as LinkIcon,
  Check,
  Copy,
  Pencil,
} from "lucide-react";

interface PolicyViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: any;
  onEdit: () => void;
}

export function PolicyViewDialog({
  open,
  onOpenChange,
  policy,
  onEdit,
}: PolicyViewDialogProps) {
  const [currentPolicy, setCurrentPolicy] = useState<any>(policy);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentPolicy(policy);
    if (policy?._id && open) {
      api("policy/view", { id: policy._id })
        .then((res) => {
          if (res && res.status && res.data) {
            setCurrentPolicy(res.data);
          }
        })
        .catch(() => {});
    }
  }, [policy, open]);

  if (!currentPolicy) return null;


  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      shipping: "Shipping Policy",
      return: "Return & Refund",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      custom: "Custom Policy",
    };
    return (
      <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
        {labels[type] || "Policy"}
      </span>
    );
  };

  const handleCopySlug = () => {
    if (navigator?.clipboard && currentPolicy.slug) {
      navigator.clipboard.writeText(`/policies/${currentPolicy.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Simple parser to nicely display markdown formatted headings, bold, bullet points
  const renderFormattedContent = (content: string) => {
    if (!content) return <p className="text-slate-400 italic">No content provided.</p>;

    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-3" />;
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-900 mt-4 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 inline-block" />
            {trimmed.replace("### ", "")}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-base font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-100">
            {trimmed.replace("## ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-lg font-bold text-slate-900 mt-6 mb-3">
            {trimmed.replace("# ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const itemText = trimmed.replace(/^[\*\-]\s+/, "");
        return (
          <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700 my-1 ml-3">
            <span className="text-slate-400 mt-1">•</span>
            <span>{formatInlineMarkdown(itemText)}</span>
          </div>
        );
      }
      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-700 my-1.5">
          {formatInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    // Basic bold **text** parsing
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {currentPolicy.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {getTypeBadge(currentPolicy.type)}
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border ${
                    currentPolicy.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {currentPolicy.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
              className="h-8 text-xs border-slate-300 gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-600" />
              Edit Policy
            </Button>
          </div>
        </DialogHeader>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-left">
          {/* URL & Meta bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-slate-700">/policies/{currentPolicy.slug}</span>
              <button
                type="button"
                onClick={handleCopySlug}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                title="Copy relative link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Updated:{" "}
                  {currentPolicy.updatedAt
                    ? new Date(currentPolicy.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recently"}
                </span>
              </div>
              {currentPolicy.updatedBy && (
                <span>By: <span className="font-medium text-slate-700">{currentPolicy.updatedBy}</span></span>
              )}
            </div>
          </div>

          {/* Summary Banner */}
          {currentPolicy.summary && (
            <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-lg">
              <p className="text-xs font-semibold text-sky-900 mb-0.5">Quick Summary (Shown in Checkout & Footers):</p>
              <p className="text-xs text-sky-800 leading-relaxed">{currentPolicy.summary}</p>
            </div>
          )}

          {/* Full Policy Content */}
          <div className="border border-slate-200 rounded-lg p-5 bg-white">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Full Policy Document
            </h4>
            <div className="prose prose-sm max-w-none text-slate-800">
              {currentPolicy.content?.includes("<") ? (
                <div
                  className="text-xs leading-relaxed space-y-2"
                  dangerouslySetInnerHTML={{ __html: currentPolicy.content }}
                />
              ) : (
                renderFormattedContent(currentPolicy.content)
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
