import {
  BriefcaseBusinessIcon,
  FolderSearchIcon,
  SearchCheckIcon,
  UsersIcon,
} from "lucide-react";
import { AdminDashboardTable } from "@/components/admin-dashboard-table";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { getAdminDashboardData } from "@/lib/dal/admin-dashboard";

export default async function AdminPage() {
  const dashboard = await getAdminDashboardData();
  const metricIcons = {
    users: UsersIcon,
    detections: SearchCheckIcon,
    cases: FolderSearchIcon,
    organizations: BriefcaseBusinessIcon,
  } as const;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards
          items={dashboard.metrics.map((item) => ({
            ...item,
            icon: metricIcons[item.id as keyof typeof metricIcons],
          }))}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive data={dashboard.chart} />
        </div>
        <AdminDashboardTable
          cases={dashboard.cases}
          detections={dashboard.detections}
          users={dashboard.users}
        />
      </div>
    </div>
  );
}
