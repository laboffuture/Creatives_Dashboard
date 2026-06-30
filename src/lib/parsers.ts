export interface ReportKPIs {
  tasks: string;
  completed: string;
  inProgress: string;
  notStarted?: string;
  overdue: string;
  onTimeRate: string;
  outputQty: string;
}

export interface ParsedReportData {
  weekInfo: { weekNo: string; dateRange: string; };
  kpis: ReportKPIs;
  members: { name: string; team: string; tasks: string; completed: string; inProgress: string; overdue: string; onTimeRate: string; outputQty: string; }[];
  subTeams: { name: string; tasks: string; completed: string; inProgress: string; overdue: string; onTimeRate: string; outputQty: string; }[];
  vertexes: { name: string; total: string; completed: string; inProgress: string; overdue: string; onTimeRate: string; workload: string; }[];
}

export function parseReportData(data: string[][]): ParsedReportData {
  // Find Week Info dynamically
  const weekInfoIdx = data.findIndex(row => row.some(cell => cell && (
    cell.includes("Enter Week No") || 
    cell.includes("Enter Month") || 
    cell.includes("MONTH:") || 
    cell.includes("WEEK:")
  )));
  
  let weekNo = "-";
  let dateRange = "-";

  if (weekInfoIdx !== -1) {
    const weekRow = data[weekInfoIdx];
    if (weekRow[1]?.includes("MONTH:") || weekRow[1]?.includes("WEEK:")) {
      weekNo = weekRow[2] || "-"; // MAY
      dateRange = weekRow[4] || "-"; // 2026
    } else {
      weekNo = weekRow[1] || "-";
      dateRange = weekRow[2] || "-";
    }
  }

  const weekInfo = { weekNo, dateRange };

  // Find KPIs dynamically
  const kpiHeaderIdx = data.findIndex(row => row.some(cell => cell && (
    cell.includes("Tasks This") || 
    cell.includes("TOTAL TASKS")
  )));
  const kpiRow = (kpiHeaderIdx !== -1 ? data[kpiHeaderIdx + 1] : []) || [];
  const kOffset = (kpiRow[0] === "" || !kpiRow[0]) && kpiRow[1] ? 1 : 0;
  
  const kpis = {
    tasks: String(kpiRow[kOffset + 0] || "0"),
    completed: String(kpiRow[kOffset + 2] || "0"),
    inProgress: String(kpiRow[kOffset + 4] || "0"),
    overdue: String(kpiRow[kOffset + 6] || "0"),
    onTimeRate: String(kpiRow[kOffset + 8] || "0%"),
    outputQty: String(kpiRow[kOffset + 10] || "0"),
  };

  // Find Member Breakdown dynamically
  const memberHeaderIdx = data.findIndex(row => row.some(cell => cell === "Member"));
  const mOffset = memberHeaderIdx !== -1 && data[memberHeaderIdx + 1] && (data[memberHeaderIdx + 1][0] === "" || !data[memberHeaderIdx + 1][0]) ? 1 : 0;
  
  const members = memberHeaderIdx !== -1 ? Array.from({ length: 14 }, (_, i) => i + 1).map(offset => {
    const row = data[memberHeaderIdx + offset] || [];
    return {
      name: String(row[mOffset + 0] || "-"),
      team: String(row[mOffset + 2] || "-"),
      tasks: String(row[mOffset + 4] || "0"),
      completed: String(row[mOffset + 5] || "0"),
      inProgress: String(row[mOffset + 6] || "0"),
      overdue: String(row[mOffset + 7] || "0"),
      onTimeRate: String(row[mOffset + 9] || "0%"),
      outputQty: String(row[mOffset + 10] || "0"),
    };
  }) : [];

  // Find Sub-Team Breakdown dynamically
  const subTeamHeaderIdx = data.findIndex(row => row.some(cell => cell === "Sub-Team"));
  const sOffset = subTeamHeaderIdx !== -1 && data[subTeamHeaderIdx + 1] && (data[subTeamHeaderIdx + 1][0] === "" || !data[subTeamHeaderIdx + 1][0]) ? 1 : 0;
  
  const subTeams = subTeamHeaderIdx !== -1 ? Array.from({ length: 3 }, (_, i) => i + 1).map(offset => {
    const row = data[subTeamHeaderIdx + offset] || [];
    return {
      name: String(row[sOffset + 0] || "-"),
      tasks: String(row[sOffset + 2] || "0"),
      completed: String(row[sOffset + 4] || "0"),
      inProgress: String(row[sOffset + 6] || "0"),
      overdue: String(row[sOffset + 8] || "0"),
      onTimeRate: String(row[sOffset + 10] || "0%"),
      outputQty: String(row[sOffset + 12] || "0"),
    };
  }) : [];

  // Find Vertex Status dynamically
  const vertexHeaderIdx = data.findIndex(row => row.some(cell => cell === "Vertex"));
  const vOffset = vertexHeaderIdx !== -1 && data[vertexHeaderIdx + 1] && (data[vertexHeaderIdx + 1][0] === "" || !data[vertexHeaderIdx + 1][0]) ? 1 : 0;
  
  const vertexes = vertexHeaderIdx !== -1 ? Array.from({ length: 7 }, (_, i) => i + 1).map(offset => {
    const row = data[vertexHeaderIdx + offset] || [];
    return {
      name: String(row[vOffset + 0] || "-"),
      total: String(row[vOffset + 2] || "0"),
      completed: String(row[vOffset + 4] || "0"),
      inProgress: String(row[vOffset + 6] || "0"),
      overdue: String(row[vOffset + 10] || "0"),
      onTimeRate: String(row[vOffset + 12] || "0%"),
      workload: String(row[vOffset + 14] || "0%"),
    };
  }) : [];

  return { weekInfo, kpis, members, subTeams, vertexes };
}
