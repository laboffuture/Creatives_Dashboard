"use client";
import { DownloadPdfButton } from "./DownloadPdfButton";

interface MemberData {
  name: string;
  totalTasks: string;
  completed: string;
  inProgress: string;
  overdue: string;
  onTimeRate: string;
  outputQty: string;
  completionRate: string;
}

interface TeamData {
  title: string;
  members: MemberData[];
  total: MemberData;
  theme: "purple" | "green" | "orange";
}

interface TeamPerformanceContentProps {
  teams: TeamData[];
}

export function TeamPerformanceContent({ teams }: TeamPerformanceContentProps) {
  const getThemeClass = (theme: string) => {
    switch (theme) {
      case 'purple': return 'team-graphics';
      case 'green': return 'team-video';
      case 'orange': return 'team-3d';
      default: return 'bg-primary text-white';
    }
  };
  const getBorderClass = (theme: string) => {
    switch (theme) {
      case 'purple': return 'border-l-on-tertiary-container';
      case 'green': return 'border-l-on-secondary-container';
      case 'orange': return 'border-l-tertiary-container';
      default: return 'border-l-primary';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Sub Header */}
      <div className="bg-navy text-white px-6 py-3 flex items-center justify-between border-b border-white/20 rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-xl">group</span>
          <h2 className="text-lg font-bold tracking-tight uppercase">TEAM PERFORMANCE REPORT</h2>
        </div>
        <DownloadPdfButton />
      </div>

      <div className="bg-navy text-white px-6 py-2 flex justify-between items-center text-[12px] font-bold border-b border-white/20 -mt-6 rounded-b-xl mb-6">
        <div className="opacity-80 italic font-normal">{currentDate}</div>
      </div>

      <div className="p-6 space-y-8">
        {teams.map((team, idx) => {
          const themeClass = getThemeClass(team.theme);
          const borderClass = getBorderClass(team.theme);
          
          return (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${themeClass.split(' ')[0]}`}></span>
                <h3 className="text-headline-md font-headline-md text-primary uppercase">{team.title}</h3>
              </div>

              {/* Team Summary Cards (Bento) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`bg-surface-container-lowest border border-outline-variant p-4 card-shadow relative overflow-hidden border-l-4 ${borderClass}`}>
                  <p className="text-on-surface-variant text-[10px] font-bold uppercase mb-1">Total Throughput</p>
                  <h3 className="text-2xl font-black text-primary">{team.total.totalTasks}</h3>
                  <p className="text-outline text-xs mt-1">Tasks processed</p>
                </div>
                <div className={`bg-surface-container-lowest border border-outline-variant p-4 card-shadow relative overflow-hidden border-l-4 ${borderClass}`}>
                  <p className="text-on-surface-variant text-[10px] font-bold uppercase mb-1">Completed</p>
                  <h3 className="text-2xl font-black text-primary">{team.total.completed}</h3>
                  <p className="text-outline text-xs mt-1">Successfully delivered</p>
                </div>
                <div className={`bg-surface-container-lowest border border-outline-variant p-4 card-shadow relative overflow-hidden border-l-4 ${borderClass}`}>
                  <p className="text-on-surface-variant text-[10px] font-bold uppercase mb-1">Efficiency Rate</p>
                  <h3 className="text-2xl font-black text-secondary">{team.total.onTimeRate}</h3>
                  <p className="text-outline text-xs mt-1">On-Time delivery</p>
                </div>
                <div className={`bg-surface-container-lowest border border-outline-variant p-4 card-shadow relative overflow-hidden border-l-4 ${borderClass}`}>
                  <p className="text-on-surface-variant text-[10px] font-bold uppercase mb-1">Critical Overdue</p>
                  <h3 className="text-2xl font-black text-error">{team.total.overdue}</h3>
                  <p className="text-outline text-xs mt-1">Requires attention</p>
                </div>
              </div>

              {/* Member Performance Table */}
              <div className="card-container bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col">
                <div className={`${themeClass} px-4 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">person_search</span>
                    Member Productivity Breakdown
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse report-table text-left text-sm">
                    <thead>
                      <tr>
                        <th className="py-2 px-3 text-left">Member</th>
                        <th className="py-2 px-3">Tasks</th>
                        <th className="py-2 px-3">Comp</th>
                        <th className="py-2 px-3">In Prog</th>
                        <th className="py-2 px-3">Overdue</th>
                        <th className="py-2 px-3">On-Time %</th>
                        <th className="py-2 px-3">Output Qty</th>
                        <th className="py-2 px-3">Comp Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.members.map((member, i) => (
                        <tr key={i} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-2 px-3 font-semibold text-primary">{member.name}</td>
                          <td className="py-2 px-3 text-center">{member.totalTasks}</td>
                          <td className="py-2 px-3 text-center">{member.completed}</td>
                          <td className="py-2 px-3 text-center">{member.inProgress}</td>
                          <td className="py-2 px-3 text-center">{member.overdue}</td>
                          <td className="py-2 px-3 text-center font-bold text-secondary">{member.onTimeRate}</td>
                          <td className="py-2 px-3 text-center">{member.outputQty}</td>
                          <td className="py-2 px-3 text-center font-bold text-primary">{member.completionRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
