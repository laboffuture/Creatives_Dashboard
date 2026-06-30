import { fetchSheetData, SHEETS } from "@/lib/google-sheets";
import { TeamPerformanceContent } from "@/components/dashboard/TeamPerformanceContent";
import { StatusNotice } from "@/components/StatusNotice";

export const revalidate = 60;

function parseMemberRow(row: string[]) {
  return {
    name: row[0] || "-",
    totalTasks: row[1] || "0",
    completed: row[2] || "0",
    inProgress: row[3] || "0",
    overdue: row[6] || "0",
    onTimeRate: row[8] || "0%",
    outputQty: row[9] || "0",
    completionRate: row[10] || "0%",
  };
}

function getTeamData(data: string[][], teamHeader: string) {
  const headerIdx = data.findIndex(row => row.some(cell => typeof cell === 'string' && cell.includes(teamHeader)));
  if (headerIdx === -1) return { members: [], total: parseMemberRow([]) };

  // Skip the header row and column headers row
  let currentIdx = headerIdx + 2;
  const members = [];
  
  while (currentIdx < data.length) {
    const row = data[currentIdx] || [];
    if (row.some(cell => typeof cell === 'string' && cell.includes("TEAM TOTAL"))) {
      break;
    }
    if (row[0] && row[0].trim() !== "") {
      members.push(parseMemberRow(row));
    }
    currentIdx++;
  }

  const total = parseMemberRow(data[currentIdx] || []);
  return { members, total };
}

export default async function TeamPerformancePage() {
  const data = await fetchSheetData(SHEETS.TEAM_PERFORMANCE);

  if (!data || data.length < 15) {
    return (
      <StatusNotice
        variant="error"
        title="Couldn't load team performance"
        message="The team performance sheet could not be loaded or is incomplete. Please check the connection and refresh."
      />
    );
  }

  const graphicsData = getTeamData(data, "GRAPHICS TEAM");
  const videoData = getTeamData(data, "VIDEO TEAM");
  const tdData = getTeamData(data, "3D PRODUCTION TEAM");

  const teams = [
    {
      title: "Graphics Team",
      members: graphicsData.members,
      total: graphicsData.total,
      theme: "purple" as const,
    },
    {
      title: "Video Team",
      members: videoData.members,
      total: videoData.total,
      theme: "green" as const,
    },
    {
      title: "3D Production Team",
      members: tdData.members,
      total: tdData.total,
      theme: "orange" as const,
    }
  ];

  return (
    <TeamPerformanceContent teams={teams} />
  );
}
