import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { 
  Users, 
  Building2, 
  FileText, 
  CreditCard, 
  Ticket, 
  TrendingUp,
  ArrowRight,
  Plus,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeRole, isAdmin } = useUserRoles();
  const navigate = useNavigate();

  const stats = [
    { label: 'Organizations', value: '0', icon: Building2, href: '/organizations' },
    { label: 'Teams', value: '0', icon: Users, href: '/teams' },
    { label: 'Registrations', value: '0', icon: FileText, href: '/registrations' },
    { label: 'Revenue', value: '$0', icon: CreditCard, href: '/payments' },
  ];

  const quickActions = [
    { label: 'Create Organization', icon: Building2, href: '/organizations/new' },
    { label: 'Add Team', icon: Users, href: '/teams/new' },
    { label: 'Create Event', icon: Ticket, href: '/events/new' },
    { label: 'Send Message', icon: FileText, href: '/messages/new' },
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

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card 
              key={stat.label} 
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
              onClick={() => navigate(stat.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="mr-1 h-3 w-3 text-success" />
                  <span>Get started</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
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
                    <span>{action.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Complete these steps to set up your platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground text-sm font-medium">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-foreground">Create your account</p>
                  <p className="text-sm text-muted-foreground">You're all set up and ready to go!</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg border border-dashed">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Set up your organization</p>
                  <p className="text-sm text-muted-foreground">Create a school, district, or league organization</p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/organizations/new')}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Create Organization
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg border border-dashed">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Add teams and rosters</p>
                  <p className="text-sm text-muted-foreground">Create teams and invite coaches, players, and parents</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg border border-dashed">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Open registrations</p>
                  <p className="text-sm text-muted-foreground">Set up registration forms and collect payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Section */}
        {isAdmin() && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
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
