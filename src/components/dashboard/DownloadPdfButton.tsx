"use client";

import { Download } from "lucide-react";

export function DownloadPdfButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="print:hidden flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-3 py-1 text-sm font-medium transition-colors"
    >
      <Download className="w-4 h-4" />
      <span>Download PDF</span>
    </button>
  );
}
