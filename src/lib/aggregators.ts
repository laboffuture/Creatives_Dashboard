import { ParsedReportData } from "./parsers";

interface RawTask {
  member: string;
  team: string;
  taskNo: string;
  dateStr: string;
  dateObj: Date;
  vertex: string;
  category: string;
  taskName: string;
  outputQty: number;
  status: string;
  deliveryDate: string;
  completionDate: string;
  onTime: boolean;
}

const SHEET_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse the date formats used in the source sheets (primarily DD-MMM-YY, e.g.
 * "25-Jun-26") in a locale-INDEPENDENT way, falling back to the native Date
 * parser for anything else. Returns null when the value can't be parsed.
 */
function parseSheetDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  const m = str.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,})[-/ ](\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = SHEET_MONTHS[m[2].slice(0, 3).toLowerCase()];
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    if (mon !== undefined && !isNaN(day) && !isNaN(year)) {
      const d = new Date(year, mon, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Returns the latest task date present across all member sheets, used to
 * anchor the reporting month. Falls back to "now" when there is no data.
 */
function getAnchorDate(allMembersData: { gid: string; data: string[][] }[]): Date {
  let latest: Date | null = null;
  for (const sheet of allMembersData) {
    const data = sheet.data;
    if (!data || data.length < 3) continue;
    for (let i = 2; i < data.length; i++) {
      const d = parseSheetDate(data[i]?.[1]?.trim());
      if (d && (!latest || d > latest)) latest = d;
    }
  }
  return latest || new Date();
}

export function aggregateMemberTasksToWeeks(allMembersData: { gid: string; data: string[][] }[]): ParsedReportData[] {
  const allTasks: RawTask[] = [];

  // 1. Extract all valid tasks from all members
  for (const sheet of allMembersData) {
    const data = sheet.data;
    if (!data || data.length < 3) continue;

    const headerStr = data[0][0] || "";
    const parts = headerStr.split("·").map(p => p.trim());
    const rawName = parts[0] || "Unknown";
    const memberName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const memberTeam = parts[1] || "Unknown";

    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      const dateVal = row[1]?.trim();
      
      // If the date column is empty, ignore the task
      if (!dateVal) continue;
      
      const dateObj = parseSheetDate(dateVal);
      // Skip invalid dates
      if (!dateObj) continue;

      const outputQtyStr = row[5]?.trim() || "0";
      const outputQty = parseInt(outputQtyStr, 10) || 0;
      
      const status = row[6]?.trim() || "";
      const deliveryDate = row[7]?.trim() || "";
      
      let isOverdue = false;
      if (status !== "Completed" && deliveryDate) {
        const delDateObj = parseSheetDate(deliveryDate);
        if (delDateObj && delDateObj < new Date()) {
          isOverdue = true;
        }
      }

      const completionDateStr = row[8]?.trim() || "";
      const onTimeStr = row[9]?.trim() || "";
      let onTime: boolean;
      if (onTimeStr !== "") {
        // Use the explicit On-Time column when the sheet provides it.
        onTime = onTimeStr === "1" || onTimeStr.toLowerCase() === "true" || onTimeStr.toLowerCase() === "yes";
      } else if (status === "Completed" && completionDateStr && deliveryDate) {
        // Otherwise derive it: completed on or before the delivery date = on time.
        const comp = parseSheetDate(completionDateStr);
        const del = parseSheetDate(deliveryDate);
        onTime = !!comp && !!del && comp.getTime() <= del.getTime();
      } else {
        onTime = false;
      }

      allTasks.push({
        member: memberName,
        team: memberTeam,
        taskNo: row[0]?.trim() || "",
        dateStr: dateVal,
        dateObj,
        vertex: row[2]?.trim() || "",
        category: row[3]?.trim() || "",
        taskName: row[4]?.trim() || "",
        outputQty,
        status: isOverdue ? "Overdue" : status,
        deliveryDate,
        completionDate: completionDateStr,
        onTime
      });
    }
  }

  // 2. Generate calendar weeks for the month being reported.
  // Anchor to the most recent month that actually has data (not the system
  // clock) so the dashboard does not go blank after a month rollover.
  const anchor = getAnchorDate(allMembersData);
  const currentMonth = anchor.getMonth();
  const currentYear = anchor.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  let currentWeekStart = new Date(firstDayOfMonth);
  const firstDayOfWeek = currentWeekStart.getDay();
  // We want week to start on Monday
  const diffToMonday = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
  currentWeekStart.setDate(currentWeekStart.getDate() + diffToMonday);

  const monthWeeks = [];
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0); // 0 gets the last day of the current month

  while (true) {
    const workingDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      if (d.getMonth() === currentMonth) {
        const day = d.getDay();
        const date = d.getDate();
        let isWorking = true;
        if (day === 0) isWorking = false; // Sunday off
        if (day === 6 && date >= 8 && date <= 14) isWorking = false; // 2nd Saturday off
        if (isWorking) workingDays.push(d);
      }
    }

    if (workingDays.length > 0) {
      let startBound = new Date(currentWeekStart);
      if (startBound < firstDayOfMonth) startBound = new Date(firstDayOfMonth);
      startBound.setHours(0, 0, 0, 0);
      
      let endBound = new Date(currentWeekStart);
      endBound.setDate(endBound.getDate() + 6);
      if (endBound > lastDayOfMonth) endBound = new Date(lastDayOfMonth);
      endBound.setHours(23, 59, 59, 999);

      const startLabel = workingDays[0];
      const endLabel = workingDays[workingDays.length - 1];

      monthWeeks.push({
        start: startBound,
        end: endBound,
        label: `${startLabel.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endLabel.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        tasks: [] as RawTask[]
      });
    }

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    if (currentWeekStart.getMonth() !== currentMonth && currentWeekStart > firstDayOfMonth) {
      break;
    }
  }

  // 3. Assign tasks to their respective week
  for (const t of allTasks) {
    for (const week of monthWeeks) {
      if (t.dateObj >= week.start && t.dateObj <= week.end) {
        week.tasks.push(t);
        break;
      }
    }
  }

  // 4. Generate ParsedReportData for each week
  const parsedWeeks: ParsedReportData[] = [];

  monthWeeks.forEach((week, idx) => {
    const tWeek = week.tasks;
    const completedTasks = tWeek.filter(t => t.status === "Completed");
    const onTimeTasks = completedTasks.filter(t => t.onTime);
    const onTimeRate = completedTasks.length > 0 
      ? Math.round((onTimeTasks.length / completedTasks.length) * 100) 
      : 0;
    const outputQtySum = tWeek.reduce((sum, t) => sum + t.outputQty, 0);
    const inProgressCount = tWeek.filter(t => t.status === "In Progress").length;
    const overdueCount = tWeek.filter(t => t.status === "Overdue").length;
    const notStartedCount = tWeek.length - (completedTasks.length + inProgressCount + overdueCount);

    const kpis = {
      tasks: String(tWeek.length),
      completed: String(completedTasks.length),
      inProgress: String(inProgressCount),
      notStarted: String(notStartedCount > 0 ? notStartedCount : 0),
      overdue: String(overdueCount),
      onTimeRate: `${onTimeRate}%`,
      outputQty: String(outputQtySum)
    };

    const memberMap: Record<string, any> = {};
    const DEFAULT_MEMBERS = [
      { name: "Manoj", team: "Graphics" },
      { name: "Jayaprakash", team: "Graphics" },
      { name: "Muniraj", team: "Graphics" },
      { name: "Sanjay", team: "Graphics" },
      { name: "Sathya", team: "Graphics" },
      { name: "Abish", team: "Graphics" },
      { name: "Manikandan", team: "Video" },
      { name: "Ponkarthik", team: "Video" },
      { name: "Ashwin", team: "Video" },
      { name: "Suraj", team: "Video" },
      { name: "Hengal", team: "Video" },
      { name: "Sanjeev", team: "3D Production" },
      { name: "Arun", team: "3D Production" },
      { name: "Amal", team: "3D Production" },
    ];
    for (const m of DEFAULT_MEMBERS) {
      memberMap[m.name] = { name: m.name, team: m.team, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTime: 0, outputQty: 0 };
    }

    for (const t of tWeek) {
      if (!memberMap[t.member]) {
        memberMap[t.member] = { name: t.member, team: t.team, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTime: 0, outputQty: 0 };
      }
      const m = memberMap[t.member];
      m.tasks++;
      if (t.status === "Completed") m.completed++;
      if (t.status === "In Progress") m.inProgress++;
      if (t.status === "Overdue") m.overdue++;
      if (t.onTime) m.onTime++;
      m.outputQty += t.outputQty;
    }
    const members = Object.values(memberMap).map(m => {
      const rate = m.completed > 0 ? Math.round((m.onTime / m.completed) * 100) : 0;
      return {
        name: m.name,
        team: m.team,
        tasks: String(m.tasks),
        completed: String(m.completed),
        inProgress: String(m.inProgress),
        overdue: String(m.overdue),
        onTimeRate: `${rate}%`,
        outputQty: String(m.outputQty)
      };
    });

    const teamMap: Record<string, any> = {};
    const DEFAULT_TEAMS = ["Graphics", "Video", "3D Production"];
    for (const name of DEFAULT_TEAMS) {
      teamMap[name] = { name, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTime: 0, outputQty: 0 };
    }
    
    for (const t of tWeek) {
      if (!teamMap[t.team]) {
        teamMap[t.team] = { name: t.team, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTime: 0, outputQty: 0 };
      }
      const tm = teamMap[t.team];
      tm.tasks++;
      tm.outputQty += t.outputQty;
      if (t.status === "Completed") tm.completed++;
      if (t.status === "In Progress") tm.inProgress++;
      if (t.status === "Overdue") tm.overdue++;
      if (t.onTime) tm.onTime++;
    }
    const subTeams = Object.values(teamMap).map(tm => {
      const rate = tm.completed > 0 ? Math.round((tm.onTime / tm.completed) * 100) : 0;
      return {
        name: tm.name,
        tasks: String(tm.tasks),
        completed: String(tm.completed),
        inProgress: String(tm.inProgress),
        overdue: String(tm.overdue),
        onTimeRate: `${rate}%`,
        outputQty: String(tm.outputQty)
      };
    });

    const vertexMap: Record<string, any> = {};
    const DEFAULT_VERTEXES = ["TRI", "CMIS", "LOF", "LOF Curriculum", "TRG", "F&B"];
    for (const name of DEFAULT_VERTEXES) {
      vertexMap[name] = { name, total: 0, completed: 0, inProgress: 0, overdue: 0, onTime: 0 };
    }
    
    for (const t of tWeek) {
      if (!t.vertex) continue;
      if (!vertexMap[t.vertex]) {
        vertexMap[t.vertex] = { name: t.vertex, total: 0, completed: 0, inProgress: 0, overdue: 0, onTime: 0 };
      }
      const v = vertexMap[t.vertex];
      v.total++;
      if (t.status === "Completed") v.completed++;
      if (t.status === "In Progress") v.inProgress++;
      if (t.status === "Overdue") v.overdue++;
      if (t.onTime) v.onTime++;
    }
    const vertexes = Object.values(vertexMap).map(v => {
      const rate = v.completed > 0 ? Math.round((v.onTime / v.completed) * 100) : 0;
      const workload = tWeek.length > 0 ? Math.round((v.total / tWeek.length) * 100) : 0;
      return {
        name: v.name,
        total: String(v.total),
        completed: String(v.completed),
        inProgress: String(v.inProgress),
        overdue: String(v.overdue),
        onTimeRate: `${rate}%`,
        workload: `${workload}%`
      };
    });
    vertexes.sort((a, b) => a.name.localeCompare(b.name));

    parsedWeeks.push({
      weekInfo: {
        weekNo: `W${idx + 1}`,
        dateRange: week.label
      },
      kpis,
      members,
      subTeams,
      vertexes
    });
  });

  return parsedWeeks;
}

export function aggregateMemberTasksToMonth(allMembersData: { gid: string; data: string[][] }[]): ParsedReportData {
  const parsedWeeks = aggregateMemberTasksToWeeks(allMembersData);
  
  // Combine all weeks into a single month report
  const monthKpis = {
    tasks: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    overdue: 0,
    outputQty: 0
  };

  const memberMap: Record<string, any> = {};
  const teamMap: Record<string, any> = {};
  const vertexMap: Record<string, any> = {};

  const DEFAULT_MEMBERS = [
    { name: "Manoj", team: "Graphics" },
    { name: "Jayaprakash", team: "Graphics" },
    { name: "Muniraj", team: "Graphics" },
    { name: "Sanjay", team: "Graphics" },
    { name: "Sathya", team: "Graphics" },
    { name: "Abish", team: "Graphics" },
    { name: "Manikandan", team: "Video" },
    { name: "Ponkarthik", team: "Video" },
    { name: "Ashwin", team: "Video" },
    { name: "Suraj", team: "Video" },
    { name: "Hengal", team: "Video" },
    { name: "Sanjeev", team: "3D Production" },
    { name: "Arun", team: "3D Production" },
    { name: "Amal", team: "3D Production" },
  ];
  for (const m of DEFAULT_MEMBERS) {
    memberMap[m.name] = { name: m.name, team: m.team, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTimeTasks: 0, outputQty: 0 };
  }

  const DEFAULT_TEAMS = ["Graphics", "Video", "3D Production"];
  for (const name of DEFAULT_TEAMS) {
    teamMap[name] = { name, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTimeTasks: 0, outputQty: 0 };
  }

  const DEFAULT_VERTEXES = ["TRI", "CMIS", "LOF", "LOF Curriculum", "TRG", "F&B"];
  for (const name of DEFAULT_VERTEXES) {
    vertexMap[name] = { name, total: 0, completed: 0, inProgress: 0, overdue: 0, onTimeTasks: 0 };
  }

  let totalOnTime = 0;
  let totalCompleted = 0;

  for (const week of parsedWeeks) {
    monthKpis.tasks += parseInt(week.kpis.tasks, 10);
    monthKpis.completed += parseInt(week.kpis.completed, 10);
    monthKpis.inProgress += parseInt(week.kpis.inProgress, 10);
    monthKpis.notStarted += parseInt(week.kpis.notStarted || "0", 10);
    monthKpis.overdue += parseInt(week.kpis.overdue, 10);
    monthKpis.outputQty += parseInt(week.kpis.outputQty, 10);

    for (const m of week.members) {
      if (!memberMap[m.name]) memberMap[m.name] = { name: m.name, team: m.team, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTimeTasks: 0, outputQty: 0 };
      const cur = memberMap[m.name];
      cur.tasks += parseInt(m.tasks, 10);
      cur.completed += parseInt(m.completed, 10);
      cur.inProgress += parseInt(m.inProgress, 10);
      cur.overdue += parseInt(m.overdue, 10);
      cur.outputQty += parseInt(m.outputQty || '0', 10);
      const onTimeRate = parseInt(m.onTimeRate.replace('%', ''), 10);
      cur.onTimeTasks += Math.round((onTimeRate / 100) * parseInt(m.completed, 10));
    }

    for (const tm of week.subTeams) {
      if (!teamMap[tm.name]) teamMap[tm.name] = { name: tm.name, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTimeTasks: 0, outputQty: 0 };
      const cur = teamMap[tm.name];
      cur.tasks += parseInt(tm.tasks, 10);
      cur.completed += parseInt(tm.completed, 10);
      cur.inProgress += parseInt(tm.inProgress, 10);
      cur.overdue += parseInt(tm.overdue, 10);
      cur.outputQty += parseInt(tm.outputQty, 10);
      const onTimeRate = parseInt(tm.onTimeRate.replace('%', ''), 10);
      cur.onTimeTasks += Math.round((onTimeRate / 100) * parseInt(tm.completed, 10));
    }

    for (const v of week.vertexes) {
      if (!vertexMap[v.name]) vertexMap[v.name] = { name: v.name, total: 0, completed: 0, inProgress: 0, overdue: 0, onTimeTasks: 0 };
      const cur = vertexMap[v.name];
      cur.total += parseInt(v.total, 10);
      cur.completed += parseInt(v.completed, 10);
      cur.inProgress += parseInt(v.inProgress, 10);
      cur.overdue += parseInt(v.overdue, 10);
      const onTimeRate = parseInt(v.onTimeRate.replace('%', ''), 10);
      cur.onTimeTasks += Math.round((onTimeRate / 100) * parseInt(v.completed, 10));
    }
  }

  const members = Object.values(memberMap).map(m => {
    const rate = m.completed > 0 ? Math.round((m.onTimeTasks / m.completed) * 100) : 0;
    return {
      name: m.name, team: m.team,
      tasks: String(m.tasks), completed: String(m.completed), inProgress: String(m.inProgress),
      overdue: String(m.overdue), onTimeRate: `${rate}%`, outputQty: String(m.outputQty)
    };
  });

  const subTeams = Object.values(teamMap).map(tm => {
    const rate = tm.completed > 0 ? Math.round((tm.onTimeTasks / tm.completed) * 100) : 0;
    return {
      name: tm.name, tasks: String(tm.tasks), completed: String(tm.completed), inProgress: String(tm.inProgress),
      overdue: String(tm.overdue), onTimeRate: `${rate}%`, outputQty: String(tm.outputQty)
    };
  });

  const vertexes = Object.values(vertexMap).map(v => {
    const rate = v.completed > 0 ? Math.round((v.onTimeTasks / v.completed) * 100) : 0;
    const workload = monthKpis.tasks > 0 ? Math.round((v.total / monthKpis.tasks) * 100) : 0;
    return {
      name: v.name, total: String(v.total), completed: String(v.completed), inProgress: String(v.inProgress),
      overdue: String(v.overdue), onTimeRate: `${rate}%`, workload: `${workload}%`
    };
  });

  vertexes.sort((a, b) => a.name.localeCompare(b.name));

  let monthOnTimeTasks = 0;
  for(const m of Object.values(memberMap)) {
    monthOnTimeTasks += m.onTimeTasks;
  }
  const overallOnTimeRate = monthKpis.completed > 0 ? Math.round((monthOnTimeTasks / monthKpis.completed) * 100) : 0;

  const anchor = getAnchorDate(allMembersData);
  const monthName = anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    weekInfo: {
      weekNo: "MONTH",
      dateRange: monthName
    },
    kpis: {
      tasks: String(monthKpis.tasks),
      completed: String(monthKpis.completed),
      inProgress: String(monthKpis.inProgress),
      notStarted: String(monthKpis.notStarted),
      overdue: String(monthKpis.overdue),
      onTimeRate: `${overallOnTimeRate}%`,
      outputQty: String(monthKpis.outputQty)
    },
    members,
    subTeams,
    vertexes
  };
}
