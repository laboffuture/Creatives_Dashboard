import { fetchAllMembersData } from "@/lib/google-sheets";
import { WeeklyAccordion } from "@/components/dashboard/WeeklyAccordion";
import { aggregateMemberTasksToWeeks } from "@/lib/aggregators";
import { StatusNotice } from "@/components/StatusNotice";

export const revalidate = 60;

export default async function WeeklyPage() {
  const { members, ok } = await fetchAllMembersData();

  if (!ok) {
    return (
      <StatusNotice
        variant="error"
        title="Couldn't load weekly data"
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
        message="No tasks were found in the source sheets. Make sure the Date column (Column B) is filled."
      />
    );
  }

  // Parse raw member sheets and dynamically build the weekly reports
  const weeksData = aggregateMemberTasksToWeeks(members);

  if (weeksData.length === 0) {
    return (
      <StatusNotice
        variant="empty"
        title="No tasks for this month"
        message="No tasks fell within the reporting month. Make sure the Date column (Column B) is filled."
      />
    );
  }

  // Reverse so the newest week is first
  weeksData.reverse();

  return (
    <WeeklyAccordion weeksData={weeksData} />
  );
}
