import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="print:hidden">
        <Topbar />
        <Sidebar />
      </div>
      <main className="ml-[260px] pt-16 min-h-screen bg-surface-container-low print:ml-0 print:pt-0 print:bg-transparent">
        {children}
      </main>
    </>
  );
}
