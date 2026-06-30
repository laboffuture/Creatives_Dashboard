import { fetchAllMembersData } from "@/lib/google-sheets";
import { WeeklyContent } from "@/components/dashboard/WeeklyContent";
import { aggregateMemberTasksToMonth } from "@/lib/aggregators";
import { StatusNotice } from "@/components/StatusNotice";

export const revalidate = 60;

export default async function MonthlyPage() {
  const { members, ok } = await fetchAllMembersData();

  if (!ok) {
    return (
      <StatusNotice
        variant="error"
        title="Couldn't load monthly data"
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

  const reportData = aggregateMemberTasksToMonth(members);

  return (
    <WeeklyContent
      reportTitle="CREATIVES MONTHLY REPORT"
      weekInfo={reportData.weekInfo}
      kpis={reportData.kpis}
      members={reportData.members}
      subTeams={reportData.subTeams}
      vertexes={reportData.vertexes}
    />
  );
}
