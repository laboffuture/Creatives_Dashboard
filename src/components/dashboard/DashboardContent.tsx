"use client";
import { DownloadPdfButton } from "./DownloadPdfButton";

interface KPIData {
  totalTasks: string;
  completed: string;
  inProgress: string;
  notStarted: string;
  overdue: string;
  onTimeRate: string;
  outputQty: string;
}

interface DashboardContentProps {
  kpis: KPIData;
  subTeams: { name: string; total: string; completed: string; inProgress: string; overdue: string; onTimeRate: string; }[];
  vertexes: { name: string; total: string; completed: string; inProgress: string; overdue: string; onTimeRate: string; }[];
}

export function DashboardContent({ kpis, subTeams, vertexes }: DashboardContentProps) {
  const getSubTeamClass = (name: string) => {
    if (name.includes('Graphics')) return 'team-graphics';
    if (name.includes('Video')) return 'team-video';
    if (name.includes('3D')) return 'team-3d';
    return 'bg-primary text-white'; // default
  };

  const getVertexColors = (idx: number) => {
    const colors = [
      { bg: 'bg-blue-50 border-blue-200', title: 'text-blue-950', text: 'text-blue-800', badge: 'bg-blue-600 text-white', inner: 'bg-white/60 border border-blue-100' },
      { bg: 'bg-emerald-50 border-emerald-200', title: 'text-emerald-950', text: 'text-emerald-800', badge: 'bg-emerald-600 text-white', inner: 'bg-white/60 border border-emerald-100' },
      { bg: 'bg-amber-50 border-amber-200', title: 'text-amber-950', text: 'text-amber-800', badge: 'bg-amber-500 text-white', inner: 'bg-white/60 border border-amber-100' },
      { bg: 'bg-purple-50 border-purple-200', title: 'text-purple-950', text: 'text-purple-800', badge: 'bg-purple-600 text-white', inner: 'bg-white/60 border border-purple-100' },
      { bg: 'bg-rose-50 border-rose-200', title: 'text-rose-950', text: 'text-rose-800', badge: 'bg-rose-600 text-white', inner: 'bg-white/60 border border-rose-100' },
      { bg: 'bg-cyan-50 border-cyan-200', title: 'text-cyan-950', text: 'text-cyan-800', badge: 'bg-cyan-600 text-white', inner: 'bg-white/60 border border-cyan-100' },
    ];
    return colors[idx % colors.length];
  };

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      
      {/* Sub Header */}
      <div className="bg-navy text-white px-6 py-3 flex items-center justify-between border-b border-white/20 rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-xl">monitoring</span>
          <h2 className="text-lg font-bold tracking-tight uppercase">CREATIVES MONTHLY DASHBOARD</h2>
        </div>
        <DownloadPdfButton />
      </div>

      {/* Period Bar */}
      <div className="bg-navy text-white px-6 py-2 flex justify-between items-center text-[12px] font-bold border-b border-white/20 -mt-6 rounded-b-xl mb-6">
        <div className="opacity-80 italic font-normal">{currentDate}</div>
        <div className="italic font-normal opacity-80">Generated on {currentDate}</div>
      </div>
      <div className="p-6 space-y-6">
        
        {/* TOP ROW: Overall KPIs */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">leaderboard</span> Overall Team KPIs
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { title: "Total Tasks", value: kpis.totalTasks, bg: "bg-primary text-white" },
              { title: "Completed", value: kpis.completed, bg: "bg-secondary text-white" },
              { title: "In Progress", value: kpis.inProgress, bg: "bg-surface-container-highest text-on-surface" },
              { title: "Overdue", value: kpis.overdue, bg: "bg-error text-white" },
              { title: "On-Time", value: kpis.onTimeRate, bg: "bg-tertiary text-white" },
              { title: "Not Started", value: kpis.notStarted, bg: "bg-surface-container text-on-surface" },
            ].map((kpi, idx) => (
              <div key={idx} className={`card-container p-4 rounded-xl flex flex-col items-center justify-center text-center ${kpi.bg}`}>
                <span className="text-[10px] uppercase font-bold opacity-80">{kpi.title}</span>
                <span className="text-xl font-black mt-1">{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECOND ROW: Team-Wise Summary Bento Grid */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">groups</span> Team-Wise Summary
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subTeams.map((team, idx) => (
              <div key={idx} className="card-container bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col">
                <div className={`${getSubTeamClass(team.name)} px-4 py-3 flex justify-between items-center`}>
                  <span className="font-bold text-sm">{team.name}</span>
                  <span className="text-xl font-black">{team.onTimeRate}</span>
                </div>
                <div className="p-5 grid grid-cols-4 gap-2 text-center items-center">
                  <div className="flex flex-col"><span className="text-[11px] text-outline uppercase font-bold mb-1">Total</span><span className="text-2xl font-black">{team.total}</span></div>
                  <div className="flex flex-col"><span className="text-[11px] text-outline uppercase font-bold mb-1">Comp.</span><span className="text-2xl font-black text-secondary">{team.completed}</span></div>
                  <div className="flex flex-col"><span className="text-[11px] text-outline uppercase font-bold mb-1">In Prog</span><span className="text-xl font-bold">{team.inProgress}</span></div>
                  <div className="flex flex-col"><span className="text-[11px] text-outline uppercase font-bold mb-1">Overdue</span><span className="text-xl font-bold text-error">{team.overdue}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THIRD ROW: Vertex-Wise Task Summary Bento */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">account_tree</span> Vertex-Wise Task Summary
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vertexes.filter(v => v.name !== 'TOTAL').map((vertex, idx) => {
              const c = getVertexColors(idx);
              return (
                <div key={idx} className={`card-container ${c.bg} p-5 rounded-xl border relative`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`${c.title} font-bold text-sm`}>{vertex.name}</h3>
                      <p className="text-[10px] opacity-70 font-bold uppercase">{vertex.total} TOTAL TASKS</p>
                    </div>
                    <div className={`${c.badge} w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs`}>{vertex.onTimeRate}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`${c.inner} p-2 rounded text-center`}>
                      <div className="text-[10px] opacity-70">Comp</div>
                      <div className="text-sm font-bold">{vertex.completed}</div>
                    </div>
                    <div className={`${c.inner} p-2 rounded text-center`}>
                      <div className="text-[10px] opacity-70">IP</div>
                      <div className="text-sm font-bold">{vertex.inProgress}</div>
                    </div>
                    <div className={`${c.inner} p-2 rounded text-center`}>
                      <div className="text-[10px] opacity-70">OVD</div>
                      <div className="text-sm font-bold">{vertex.overdue}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
