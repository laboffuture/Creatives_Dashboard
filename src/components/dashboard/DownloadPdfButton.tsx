"use client";

import { Download } from "lucide-react";

export function DownloadPdfButton() {
  return (
    <button 
      onClick={() => window.print()}
      title="Print / Save as PDF"
      aria-label="Print or save this report as PDF"
      className="print:hidden flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-3 py-1 text-sm font-medium transition-colors"
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      <span>Print / Save as PDF</span>
    </button>
  );
}
