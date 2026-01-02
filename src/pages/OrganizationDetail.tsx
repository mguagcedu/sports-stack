import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, Users, Trophy, MapPin, Phone, Globe, CreditCard } from "lucide-react";

type SubscriptionTier = 'free' | 'starter' | 'school' | 'district' | 'enterprise';

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  starter: 'Starter',
  school: 'School',
  district: 'District',
  enterprise: 'Enterprise'
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-info/10 text-info',
  school: 'bg-success/10 text-success',
  district: 'bg-primary/10 text-primary',
  enterprise: 'bg-warning/10 text-warning'
};

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          teams(id, name, sports(name)),
          schools(id, name)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Organization">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!organization) {
    return (
      <DashboardLayout title="Organization Not Found">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-2xl font-bold">Organization not found</h2>
          <p className="text-muted-foreground mt-2">The organization you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate('/organizations')}>
            Back to Organizations
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const teams = organization.teams || [];
  const tier = (organization.subscription_tier as SubscriptionTier) || 'free';

  return (
    <DashboardLayout title={organization.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/organizations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
              <Badge className={TIER_COLORS[tier]}>
                {TIER_LABELS[tier]}
              </Badge>
            </div>
            <p className="text-muted-foreground capitalize">{organization.type?.replace('_', ' ') || 'Organization'}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teams.length}</div>
              <p className="text-xs text-muted-foreground">Active teams</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{tier}</div>
              <p className="text-xs text-muted-foreground">Current plan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Location</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organization.state || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">{organization.city || 'City not set'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sports</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(teams.map((t: any) => t.sports?.name).filter(Boolean)).size}
              </div>
              <p className="text-xs text-muted-foreground">Active sports</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {organization.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{organization.address}, {organization.city}, {organization.state} {organization.zip}</span>
                </div>
              )}
              {organization.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{organization.phone}</span>
                </div>
              )}
              {organization.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {organization.website}
                  </a>
                </div>
              )}
              {!organization.address && !organization.phone && !organization.website && (
                <p className="text-muted-foreground">No contact information provided</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teams List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Teams</CardTitle>
              <CardDescription>All teams in this organization</CardDescription>
            </div>
            <Button onClick={() => navigate('/teams')}>
              View All Teams
            </Button>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <p>No teams created yet</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team: any) => (
                  <Card key={team.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/teams/${team.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{team.name}</p>
                          <p className="text-sm text-muted-foreground">{team.sports?.name || 'Sport not set'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
