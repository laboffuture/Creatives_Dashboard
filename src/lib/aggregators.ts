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

interface MemberAcc {
  name: string; team: string;
  tasks: number; completed: number; inProgress: number; overdue: number; onTime: number; outputQty: number;
}
interface TeamAcc {
  name: string;
  tasks: number; completed: number; inProgress: number; overdue: number; onTime: number; outputQty: number;
}
interface VertexAcc {
  name: string;
  total: number; completed: number; inProgress: number; overdue: number; onTime: number;
}

const SHEET_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const DEFAULT_VERTEXES = ["TRI", "CMIS", "LOF", "LOF Curriculum", "TRG", "F&B"];

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

/** Anchor reporting to the most recent task date (not the system clock), so
 * the dashboard does not go blank after a month rollover. */
function anchorMonth(tasks: RawTask[]): Date {
  if (tasks.length === 0) return new Date();
  return tasks.reduce((latest, t) => (t.dateObj > latest ? t.dateObj : latest), tasks[0].dateObj);
}

/**
 * Extract every valid task from all member sheets, plus the roster of members
 * (derived from the sheet headers themselves — the single source of truth, so a
 * name mismatch can't create duplicate/ghost rows).
 */
function extractTasks(
  allMembersData: { gid: string; data: string[][] }[]
): { tasks: RawTask[]; roster: { name: string; team: string }[] } {
  const tasks: RawTask[] = [];
  const roster: { name: string; team: string }[] = [];
  const seen = new Set<string>();

  for (const sheet of allMembersData) {
    const data = sheet.data;
    if (!data || data.length < 3) continue;

    const headerStr = data[0][0] || "";
    const parts = headerStr.split("·").map((p) => p.trim());
    const rawName = parts[0] || "Unknown";
    const memberName = rawName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    const memberTeam = parts[1] || "Unknown";

    if (!seen.has(memberName)) {
      seen.add(memberName);
      roster.push({ name: memberName, team: memberTeam });
    }

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

      tasks.push({
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
        onTime,
      });
    }
  }

  return { tasks, roster };
}

/** Generate the calendar weeks for the anchor month and bucket tasks into them. */
function buildMonthWeeks(anchor: Date, tasks: RawTask[]): { label: string; tasks: RawTask[] }[] {
  const currentMonth = anchor.getMonth();
  const currentYear = anchor.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const currentWeekStart = new Date(firstDayOfMonth);
  const firstDayOfWeek = currentWeekStart.getDay();
  // We want the week to start on Monday
  const diffToMonday = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
  currentWeekStart.setDate(currentWeekStart.getDate() + diffToMonday);

  const monthWeeks: { start: Date; end: Date; label: string; tasks: RawTask[] }[] = [];
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0); // 0 = last day of current month

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
        label: `${startLabel.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endLabel.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        tasks: [],
      });
    }

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    if (currentWeekStart.getMonth() !== currentMonth && currentWeekStart > firstDayOfMonth) {
      break;
    }
  }

  for (const t of tasks) {
    for (const week of monthWeeks) {
      if (t.dateObj >= week.start && t.dateObj <= week.end) {
        week.tasks.push(t);
        break;
      }
    }
  }

  return monthWeeks.map((w) => ({ label: w.label, tasks: w.tasks }));
}

/**
 * Build a ParsedReportData (KPIs + member/sub-team/vertex breakdowns) from a
 * flat list of raw tasks. Used for BOTH a single week and the whole month, so
 * the month figures are computed directly from raw counts (no lossy
 * reconstruction from rounded weekly percentages).
 */
function buildAggregates(
  tasks: RawTask[],
  roster: { name: string; team: string }[],
  weekInfo: { weekNo: string; dateRange: string }
): ParsedReportData {
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const onTimeTasks = completedTasks.filter((t) => t.onTime);
  const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeTasks.length / completedTasks.length) * 100) : 0;
  const outputQtySum = tasks.reduce((sum, t) => sum + t.outputQty, 0);
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const overdueCount = tasks.filter((t) => t.status === "Overdue").length;
  const onHoldCount = tasks.filter((t) => t.status === "On Hold").length;
  // Not Started = anything not already in an explicit bucket. "On Hold" is
  // counted separately so it is no longer silently mislabeled as Not Started.
  const notStartedCount = Math.max(
    0,
    tasks.length - (completedTasks.length + inProgressCount + overdueCount + onHoldCount)
  );

  const kpis = {
    tasks: String(tasks.length),
    completed: String(completedTasks.length),
    inProgress: String(inProgressCount),
    notStarted: String(notStartedCount),
    overdue: String(overdueCount),
    onTimeRate: `${onTimeRate}%`,
    outputQty: String(outputQtySum),
  };

  // Members seeded from the actual sheet roster (single source of truth).
  const memberMap: Record<string, MemberAcc> = {};
  for (const r of roster) {
    memberMap[r.name] = { name: r.name, team: r.team, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTime: 0, outputQty: 0 };
  }
  for (const t of tasks) {
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
  const members = Object.values(memberMap).map((m) => ({
    name: m.name,
    team: m.team,
    tasks: String(m.tasks),
    completed: String(m.completed),
    inProgress: String(m.inProgress),
    overdue: String(m.overdue),
    onTimeRate: `${m.completed > 0 ? Math.round((m.onTime / m.completed) * 100) : 0}%`,
    outputQty: String(m.outputQty),
  }));

  // Teams seeded from the roster's distinct teams (first-appearance order).
  const teamMap: Record<string, TeamAcc> = {};
  for (const r of roster) {
    if (!teamMap[r.team]) {
      teamMap[r.team] = { name: r.team, tasks: 0, completed: 0, inProgress: 0, overdue: 0, onTime: 0, outputQty: 0 };
    }
  }
  for (const t of tasks) {
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
  const subTeams = Object.values(teamMap).map((tm) => ({
    name: tm.name,
    tasks: String(tm.tasks),
    completed: String(tm.completed),
    inProgress: String(tm.inProgress),
    overdue: String(tm.overdue),
    onTimeRate: `${tm.completed > 0 ? Math.round((tm.onTime / tm.completed) * 100) : 0}%`,
    outputQty: String(tm.outputQty),
  }));

  const vertexMap: Record<string, VertexAcc> = {};
  for (const name of DEFAULT_VERTEXES) {
    vertexMap[name] = { name, total: 0, completed: 0, inProgress: 0, overdue: 0, onTime: 0 };
  }
  for (const t of tasks) {
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
  const vertexes = Object.values(vertexMap).map((v) => ({
    name: v.name,
    total: String(v.total),
    completed: String(v.completed),
    inProgress: String(v.inProgress),
    overdue: String(v.overdue),
    onTimeRate: `${v.completed > 0 ? Math.round((v.onTime / v.completed) * 100) : 0}%`,
    workload: `${tasks.length > 0 ? Math.round((v.total / tasks.length) * 100) : 0}%`,
  }));
  vertexes.sort((a, b) => a.name.localeCompare(b.name));

  return { weekInfo, kpis, members, subTeams, vertexes };
}

export function aggregateMemberTasksToWeeks(
  allMembersData: { gid: string; data: string[][] }[]
): ParsedReportData[] {
  const { tasks, roster } = extractTasks(allMembersData);
  const anchor = anchorMonth(tasks);
  const weeks = buildMonthWeeks(anchor, tasks);
  return weeks.map((w, idx) =>
    buildAggregates(w.tasks, roster, { weekNo: `W${idx + 1}`, dateRange: w.label })
  );
}

export function aggregateMemberTasksToMonth(
  allMembersData: { gid: string; data: string[][] }[]
): ParsedReportData {
  const { tasks, roster } = extractTasks(allMembersData);
  const anchor = anchorMonth(tasks);
  const weeks = buildMonthWeeks(anchor, tasks);
  // Month is computed directly from the same bucketed raw tasks the weeks use,
  // so the monthly figures always equal the sum of the weeks and the On-Time
  // rate is exact (not reconstructed from rounded weekly percentages).
  const monthTasks = weeks.flatMap((w) => w.tasks);
  const monthName = anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return buildAggregates(monthTasks, roster, { weekNo: "MONTH", dateRange: monthName });
}
