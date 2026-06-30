"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WeeklyContent } from "./WeeklyContent";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { ParsedReportData } from "@/lib/parsers";

interface WeeklyAccordionProps {
  weeksData: ParsedReportData[];
}

export function WeeklyAccordion({ weeksData }: WeeklyAccordionProps) {
  // By default, open the first week (latest week)
  const [openWeekIdx, setOpenWeekIdx] = useState<number>(0);

  const toggleWeek = (idx: number) => {
    setOpenWeekIdx(openWeekIdx === idx ? -1 : idx);
  };

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-12">
      {/* Global Page Header */}
      <div className="bg-navy text-white px-6 py-3 flex items-center justify-between border-b border-white/20 rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-xl">calendar_month</span>
          <h2 className="text-lg font-bold tracking-tight uppercase">CREATIVES • WEEKLY VIEW</h2>
        </div>
        <DownloadPdfButton />
      </div>

      <div className="bg-navy text-white px-6 py-2 flex justify-between items-center text-[12px] font-bold border-b border-white/20 -mt-6 rounded-b-xl mb-8">
        <div className="flex items-center gap-2">
          <span className="opacity-80 italic font-normal">{currentDate}</span>
        </div>
        <div className="italic font-normal opacity-80">Generated on {currentDate}</div>
      </div>

      <div className="space-y-4">
        {weeksData.map((data, idx) => {
          const isOpen = openWeekIdx === idx;
          const weekLabel = `Week ${idx + 1}`; // Or we can use data.weekInfo.weekNo if they differ

          return (
            <div key={idx} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden card-shadow">
              {/* Accordion Header */}
              <button
                onClick={() => toggleWeek(idx)}
                className="w-full flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container-highest transition-colors border-b border-outline-variant/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {data.weekInfo.weekNo}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-on-surface uppercase tracking-wide">Performance Report</h3>
                    <p className="text-xs text-outline font-medium">
                      {data.weekInfo.dateRange !== "-" ? data.weekInfo.dateRange : `Week ${4 - idx} of ${currentDate}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Preview KPI - total tasks */}
                  <div className="hidden md:flex items-center gap-4 text-sm mr-4">
                    
                    <div className="flex items-center gap-2">
                      <span className="text-outline uppercase text-[10px] font-bold">Total Tasks:</span>
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{data.kpis.tasks}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-outline uppercase text-[10px] font-bold">Completed:</span>
                      <span className="font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">{data.kpis.completed}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-outline uppercase text-[10px] font-bold">In Prog:</span>
                      <span className="font-bold text-on-surface bg-surface-variant/50 px-2 py-0.5 rounded-full">{data.kpis.inProgress}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-outline uppercase text-[10px] font-bold">Overdue:</span>
                      <span className="font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">{data.kpis.overdue}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-outline uppercase text-[10px] font-bold">On-Time Rate:</span>
                      <span className="font-bold text-corp-300 bg-corp-300/10 px-2 py-0.5 rounded-full">{data.kpis.onTimeRate}</span>
                    </div>

                  </div>
                  
                  <div className="p-2 rounded-full bg-surface-container">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </button>

              {/* Accordion Body */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-outline-variant/20 pt-2">
                      <WeeklyContent 
                        reportTitle="CREATIVES • WEEKLY PERFORMANCE REPORT"
                        titleSuffix={weekLabel}
                        weekInfo={data.weekInfo}
                        kpis={data.kpis}
                        members={data.members}
                        subTeams={data.subTeams}
                        vertexes={data.vertexes}
                        hideHeader={true}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
