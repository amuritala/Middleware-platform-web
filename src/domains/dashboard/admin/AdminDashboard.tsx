import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import TotalCompaniesCard from "../components/TotalCompaniesCard";
import PendingApprovalsCard from "../components/PendingApprovalsCard";
import RecentRegistrationsCard from "../components/RecentRegistrationsCard";
import OverviewChart from "../components/OverviewChart";
import ActiveCompaniesCard from "../components/ActiveCompaniesCard";
import { useClients } from "../../../lib/useClients";
import { getDisplayName } from "../../../lib/user";

export default function AdminDashboard() {
  const { clients, status } = useClients();
  const displayName = getDisplayName();

  const total = status === "success" ? clients.length : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-20 p-6">
        <TopNav portal="admin" />

        <div className="mb-6 mt-20">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back, {displayName}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage companies, approvals, and platform operations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TotalCompaniesCard count={total} />
          <OverviewChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PendingApprovalsCard />
          <ActiveCompaniesCard />
        </div>

        <RecentRegistrationsCard />
      </div>
    </div>
  );
}
