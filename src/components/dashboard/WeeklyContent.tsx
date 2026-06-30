"use client";
import { DownloadPdfButton } from "./DownloadPdfButton";

interface WeeklyContentProps {
  reportTitle: string;
  titleSuffix?: string;
  weekInfo: { weekNo: string; dateRange: string; };
  kpis: { tasks: string; completed: string; inProgress: string; overdue: string; onTimeRate: string; outputQty: string; };
  members: { name: string; team: string; tasks: string; completed: string; inProgress: string; overdue: string; onTimeRate: string; outputQty: string; }[];
  subTeams: { name: string; tasks: string; completed: string; inProgress: string; overdue: string; onTimeRate: string; outputQty: string; }[];
  vertexes: { name: string; total: string; completed: string; inProgress: string; overdue: string; onTimeRate: string; workload: string; }[];
  hideHeader?: boolean;
}

export function WeeklyContent({ reportTitle, titleSuffix, weekInfo, kpis, members, subTeams, vertexes, hideHeader }: WeeklyContentProps) {
  const getSubTeamClass = (name: string) => {
    if (name.includes('Graphics')) return 'team-graphics';
    if (name.includes('Video')) return 'team-video';
    if (name.includes('3D')) return 'team-3d';
    return 'bg-primary text-white'; // default
  };

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={`space-y-6 ${hideHeader ? 'pb-4' : 'pb-12'}`}>
      
      {!hideHeader && (
        <>
          {/* Sub Header */}
          <div className="bg-navy text-white px-6 py-3 flex items-center justify-between border-b border-white/20 rounded-t-xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">calendar_view_week</span>
              <h2 className="text-lg font-bold tracking-tight uppercase">{reportTitle} — <span className="font-normal">{titleSuffix}</span></h2>
            </div>
            <DownloadPdfButton />
          </div>

          {/* Period Bar */}
          <div className="bg-navy text-white px-6 py-2 flex justify-between items-center text-[12px] font-bold border-b border-white/20 -mt-6 rounded-b-xl mb-6">
            <div className="flex items-center gap-2">
              <span className="bg-secondary/20 text-secondary-fixed px-2 rounded-full">{weekInfo.weekNo}</span>
              <span className="opacity-80 italic font-normal">{weekInfo.dateRange}</span>
            </div>
            <div className="italic font-normal opacity-80">Generated on {currentDate}</div>
          </div>
        </>
      )}

      <div className="p-6 space-y-6">
        
        {/* SUMMARY KPIs */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">leaderboard</span> Summary KPIs
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { title: "Total Tasks", value: kpis.tasks, bg: "bg-primary text-white" },
              { title: "Completed", value: kpis.completed, bg: "bg-secondary text-white" },
              { title: "In Progress", value: kpis.inProgress, bg: "bg-surface-container-highest text-on-surface" },
              { title: "Overdue", value: kpis.overdue, bg: "bg-error text-white" },
              { title: "On-Time Rate", value: kpis.onTimeRate, bg: "bg-tertiary text-white" },
              { title: "Output Qty", value: kpis.outputQty, bg: "bg-surface-container text-on-surface" },
            ].map((kpi, idx) => (
              <div key={idx} className={`card-container p-4 rounded-xl flex flex-col items-center justify-center text-center ${kpi.bg}`}>
                <span className="text-[10px] uppercase font-bold opacity-80">{kpi.title}</span>
                <span className="text-xl font-black mt-1">{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TEAM BREAKDOWN Bento Grid */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">groups</span> Sub-Team Breakdown
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {subTeams.map((team, idx) => {
              const teamMembers = members.filter((m) => m.team === team.name);
              return (
              <div key={idx} className="card-container bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col">
                <div className={`${getSubTeamClass(team.name)} px-4 py-3 flex justify-between items-center`}>
                  <span className="font-bold text-sm">{team.name}</span>
                  <span className="text-xl font-black">{team.onTimeRate}</span>
                </div>
                <div className="p-5 grid grid-cols-4 gap-2 text-center items-center">
                  <div className="flex flex-col"><span className="text-[11px] text-outline uppercase font-bold mb-1">Tasks</span><span className="text-2xl font-black">{team.tasks}</span></div>
                  <div className="flex flex-col"><span className="text-[11px] text-outline uppercase font-bold mb-1">Comp.</span><span className="text-2xl font-black text-secondary">{team.completed}</span></div>
                  <div className="flex flex-col"><span className="text-[11px] text-outline uppercase font-bold mb-1">In Prog</span><span className="text-xl font-bold">{team.inProgress}</span></div>
                  <div className="flex flex-col"><span className="text-[11px] text-outline uppercase font-bold mb-1">Overdue</span><span className="text-xl font-bold text-error">{team.overdue}</span></div>
                </div>
                {/* Embedded Member Table */}
                {teamMembers.length > 0 && (
                  <div className="border-t border-outline-variant/30 flex-grow">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface-container-low text-on-surface-variant">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Member</th>
                          <th className="py-2 px-3 font-semibold text-center">Tasks</th>
                          <th className="py-2 px-3 font-semibold text-center">Comp</th>
                          <th className="py-2 px-3 font-semibold text-center">In Prog</th>
                          <th className="py-2 px-3 font-semibold text-center">Overdue</th>
                          <th className="py-2 px-3 font-semibold text-center">On-Time</th>
                          <th className="py-2 px-3 font-semibold text-center">Output</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamMembers.map((m, mIdx) => (
                          <tr key={mIdx} className="border-t border-outline-variant/10 hover:bg-surface-container-low/50">
                            <td className="py-2 px-3 font-medium">{m.name}</td>
                            <td className="py-2 px-3 text-center">{m.tasks}</td>
                            <td className="py-2 px-3 text-center text-primary">{m.completed}</td>
                            <td className="py-2 px-3 text-center">{m.inProgress}</td>
                            <td className="py-2 px-3 text-center">{m.overdue}</td>
                            <td className="py-2 px-3 text-center font-bold text-secondary">{m.onTimeRate}</td>
                            <td className="py-2 px-3 text-center">{m.outputQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>

        {/* VERTEX TABLE */}
        <div className="mt-8">
          <div className="card-container bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col">
            <div className="bg-navy text-white px-4 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">account_tree</span>
              Vertex Status
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse report-table text-left text-sm">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-left">Vertex</th>
                    <th className="py-2 px-3">Total</th>
                    <th className="py-2 px-3">Comp</th>
                    <th className="py-2 px-3">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {vertexes.map((vertex, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low">
                      <td className={`py-2 px-3 font-semibold ${vertex.name === 'TOTAL' ? 'text-primary' : 'text-on-surface'}`}>{vertex.name}</td>
                      <td className="py-2 px-3 text-center">{vertex.total}</td>
                      <td className="py-2 px-3 text-center">{vertex.completed}</td>
                      <td className="py-2 px-3 text-center font-bold text-secondary">{vertex.onTimeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
