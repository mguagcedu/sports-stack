import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FundraisingDashboard } from '@/components/fundraising/FundraisingDashboard';
import { useUserRoles } from '@/hooks/useUserRoles';

export default function Fundraising() {
  const { isAdmin } = useUserRoles();

  return (
    <DashboardLayout title="Fundraising & Sponsorships">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Fundraising & Sponsorships</h1>
          <p className="text-muted-foreground">
            Manage campaigns, track donations, and showcase sponsors
          </p>
        </div>

        <FundraisingDashboard showCreateButton={isAdmin()} />
      </div>
    </DashboardLayout>
  );
}
