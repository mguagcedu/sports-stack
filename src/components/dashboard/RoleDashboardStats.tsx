import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  Trophy, 
  DollarSign,
  Building2,
  FileText,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppRole } from '@/hooks/useUserRoles';

interface RoleDashboardStatsProps {
  role: AppRole;
  userId?: string;
  organizationId?: string;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: typeof Users;
  href: string;
  trend?: string;
  color: string;
}

export function RoleDashboardStats({ role, userId, organizationId }: RoleDashboardStatsProps) {
  const navigate = useNavigate();

  // Fetch stats based on role
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', role, userId, organizationId],
    queryFn: async () => {
      const results: Record<string, number> = {};
      
      // Common queries for admins
      if (['system_admin', 'org_admin', 'athletic_director'].includes(role)) {
        const [orgsResult, teamsResult, eventsResult, regsResult] = await Promise.all([
          supabase.from('organizations').select('id', { count: 'exact', head: true }),
          supabase.from('teams').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('events').select('id', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()),
          supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);
        
        results.organizations = orgsResult.count || 0;
        results.teams = teamsResult.count || 0;
        results.upcomingEvents = eventsResult.count || 0;
        results.pendingRegistrations = regsResult.count || 0;
      }

      // Coach-specific
      if (['coach', 'head_coach', 'assistant_coach'].includes(role) && userId) {
        const [teamsResult, rosterResult] = await Promise.all([
          supabase
            .from('team_members')
            .select('team_id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('role', ['coach', 'head_coach', 'assistant_coach']),
          supabase
            .from('team_members')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'athlete'),
        ]);
        
        results.myTeams = teamsResult.count || 0;
        results.totalAthletes = rosterResult.count || 0;
      }

      // Financial stats for finance roles
      if (['finance_admin', 'org_admin', 'system_admin'].includes(role)) {
        const { data: ledgerData } = await supabase
          .from('financial_ledger')
          .select('amount, is_income')
          .gte('transaction_date', new Date(new Date().getFullYear(), 0, 1).toISOString());
        
        const income = ledgerData?.filter(l => l.is_income).reduce((sum, l) => sum + l.amount, 0) || 0;
        const expenses = ledgerData?.filter(l => !l.is_income).reduce((sum, l) => sum + l.amount, 0) || 0;
        
        results.totalIncome = income;
        results.totalExpenses = expenses;
        results.netBalance = income - expenses;
      }

      return results;
    },
    enabled: !!role,
  });

  const getStatsForRole = (): StatCard[] => {
    if (!stats) return [];

    switch (role) {
      case 'system_admin':
      case 'org_admin':
        return [
          { label: 'Organizations', value: stats.organizations || 0, icon: Building2, href: '/organizations', color: 'text-blue-500' },
          { label: 'Active Teams', value: stats.teams || 0, icon: Users, href: '/teams', color: 'text-green-500' },
          { label: 'Upcoming Events', value: stats.upcomingEvents || 0, icon: Calendar, href: '/events', color: 'text-orange-500' },
          { label: 'Pending Registrations', value: stats.pendingRegistrations || 0, icon: FileText, href: '/registrations', color: 'text-purple-500' },
        ];
      
      case 'athletic_director':
        return [
          { label: 'Teams', value: stats.teams || 0, icon: Trophy, href: '/teams', color: 'text-primary' },
          { label: 'Upcoming Events', value: stats.upcomingEvents || 0, icon: Calendar, href: '/events', color: 'text-green-500' },
          { label: 'Pending Approvals', value: stats.pendingRegistrations || 0, icon: Clock, href: '/pending-approvals', color: 'text-orange-500' },
          { label: 'Net Balance', value: `$${(stats.netBalance || 0).toLocaleString()}`, icon: DollarSign, href: '/financial-ledger', color: 'text-emerald-500' },
        ];
      
      case 'coach':
      case 'head_coach':
        return [
          { label: 'My Teams', value: stats.myTeams || 0, icon: Trophy, href: '/coach', color: 'text-primary' },
          { label: 'Athletes', value: stats.totalAthletes || 0, icon: Users, href: '/coach', color: 'text-green-500' },
          { label: 'Upcoming Games', value: stats.upcomingEvents || 0, icon: Calendar, href: '/events', color: 'text-orange-500' },
          { label: 'Pending Forms', value: stats.pendingRegistrations || 0, icon: FileText, href: '/registrations', color: 'text-purple-500' },
        ];
      
      case 'finance_admin':
        return [
          { label: 'Total Income', value: `$${(stats.totalIncome || 0).toLocaleString()}`, icon: TrendingUp, href: '/financial-ledger', color: 'text-green-500' },
          { label: 'Total Expenses', value: `$${(stats.totalExpenses || 0).toLocaleString()}`, icon: DollarSign, href: '/financial-ledger', color: 'text-red-500' },
          { label: 'Net Balance', value: `$${(stats.netBalance || 0).toLocaleString()}`, icon: DollarSign, href: '/financial-ledger', color: 'text-primary' },
          { label: 'Pending', value: stats.pendingRegistrations || 0, icon: Clock, href: '/payments', color: 'text-orange-500' },
        ];
      
      default:
        return [
          { label: 'Organizations', value: stats.organizations || 0, icon: Building2, href: '/organizations', color: 'text-blue-500' },
          { label: 'Teams', value: stats.teams || 0, icon: Users, href: '/teams', color: 'text-green-500' },
          { label: 'Events', value: stats.upcomingEvents || 0, icon: Calendar, href: '/events', color: 'text-orange-500' },
          { label: 'Revenue', value: '$0', icon: DollarSign, href: '/payments', color: 'text-purple-500' },
        ];
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted h-12 w-12" />
                <div className="space-y-2">
                  <div className="h-6 w-16 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = getStatsForRole();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card 
          key={stat.label}
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
          onClick={() => navigate(stat.href)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-opacity-10 ${stat.color.replace('text-', 'bg-')}/10`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
