import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { RoleDashboardStats, RecentActivity, UpcomingEventsWidget } from '@/components/dashboard';
import { 
  Users, 
  Building2, 
  FileText, 
  Ticket,
  ArrowRight,
  Plus,
  GraduationCap,
  Settings,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeRole, isAdmin } = useUserRoles();
  const navigate = useNavigate();

  const quickActions = [
    { label: 'Create Organization', icon: Building2, href: '/organizations' },
    { label: 'Add Team', icon: Users, href: '/teams' },
    { label: 'Create Event', icon: Ticket, href: '/events' },
    { label: 'Manage Registrations', icon: FileText, href: '/registrations' },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your teams today.
          </p>
        </div>

        {/* Role-specific Stats */}
        <RoleDashboardStats 
          role={activeRole || 'athlete'} 
          userId={user?.id}
        />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Events */}
          <UpcomingEventsWidget showTickets={true} />

          {/* Recent Activity */}
          <RecentActivity />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="justify-between h-auto py-3"
                onClick={() => navigate(action.href)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Admin Section */}
        {isAdmin() && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Admin Tools</CardTitle>
              </div>
              <CardDescription>
                Manage the platform and access administrative features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate('/schools')}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  School Database
                </Button>
                <Button variant="outline" onClick={() => navigate('/users')}>
                  <Users className="mr-2 h-4 w-4" />
                  User Management
                </Button>
                <Button variant="outline" onClick={() => navigate('/integrations')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Integrations
                </Button>
                <Button variant="outline" onClick={() => navigate('/audit-logs')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Audit Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
