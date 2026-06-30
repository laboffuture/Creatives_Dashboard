import { fetchAllMembersData } from "@/lib/google-sheets";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { aggregateMemberTasksToMonth } from "@/lib/aggregators";
import { StatusNotice } from "@/components/StatusNotice";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function DashboardPage() {
  const { members, ok } = await fetchAllMembersData();

  // A fetch failure must be visible, not rendered as a valid all-zero dashboard.
  if (!ok) {
    return (
      <StatusNotice
        variant="error"
        title="Couldn't load dashboard data"
        message="One or more team sheets could not be reached from Google Sheets. Please check the connection and refresh."
      />
    );
  }

  const hasData = members.some((m) => m.data && m.data.length > 2);
  if (!hasData) {
    return (
      <StatusNotice
        variant="empty"
        title="No data yet"
        message="No tasks were found in the source sheets for the latest month."
      />
    );
  }

  // Generate dynamic data for the entire month
  const reportData = aggregateMemberTasksToMonth(members);

  // Map the aggregated data to DashboardKPIs format
  const kpis = {
    totalTasks: reportData.kpis.tasks,
    completed: reportData.kpis.completed,
    inProgress: reportData.kpis.inProgress,
    notStarted: reportData.kpis.notStarted || "0",
    overdue: reportData.kpis.overdue,
    onTimeRate: reportData.kpis.onTimeRate,
    outputQty: reportData.kpis.outputQty,
  };

  // Map Sub-Teams to the Dashboard format
  const subTeams = reportData.subTeams.map(st => ({
    name: st.name,
    total: st.tasks,
    completed: st.completed,
    inProgress: st.inProgress,
    overdue: st.overdue,
    onTimeRate: st.onTimeRate
  }));

  // Map Vertexes to the Dashboard format
  const vertexes = reportData.vertexes.map(v => ({
    name: v.name,
    total: v.total,
    completed: v.completed,
    inProgress: v.inProgress,
    overdue: v.overdue,
    onTimeRate: v.onTimeRate
  }));

  return (
    <DashboardContent
      kpis={kpis}
      subTeams={subTeams}
      vertexes={vertexes}
    />
  );
}
