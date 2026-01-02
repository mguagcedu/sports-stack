import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignCard } from './CampaignCard';
import { SponsorCard, SponsorLogo } from './SponsorCard';
import { Plus, Target, Users, DollarSign, TrendingUp } from 'lucide-react';

interface FundraisingDashboardProps {
  organizationId?: string;
  schoolId?: string;
  teamId?: string;
  showCreateButton?: boolean;
}

export function FundraisingDashboard({ 
  organizationId, 
  schoolId, 
  teamId,
  showCreateButton = false 
}: FundraisingDashboardProps) {
  const [activeTab, setActiveTab] = useState('campaigns');

  // Fetch campaigns
  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['fundraising-campaigns', organizationId, schoolId, teamId],
    queryFn: async () => {
      let query = supabase
        .from('fundraising_campaigns')
        .select('*, team:teams(name)')
        .order('created_at', { ascending: false });

      if (teamId) {
        query = query.eq('team_id', teamId);
      } else if (schoolId) {
        query = query.eq('school_id', schoolId);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch sponsors
  const { data: sponsors, isLoading: loadingSponsors } = useQuery({
    queryKey: ['sponsors', organizationId, schoolId],
    queryFn: async () => {
      let query = supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const stats = {
    totalRaised: campaigns?.reduce((sum, c) => sum + (c.current_amount || 0), 0) || 0,
    totalGoal: campaigns?.reduce((sum, c) => sum + (c.goal_amount || 0), 0) || 0,
    activeCampaigns: campaigns?.filter(c => c.status === 'active').length || 0,
    totalSponsors: sponsors?.length || 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalRaised)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Goal Total</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalGoal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-xl font-bold">{stats.activeCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sponsors</p>
                <p className="text-xl font-bold">{stats.totalSponsors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
          </TabsList>
          
          {showCreateButton && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New {activeTab === 'campaigns' ? 'Campaign' : 'Sponsor'}
            </Button>
          )}
        </div>

        <TabsContent value="campaigns" className="mt-4">
          {loadingCampaigns ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-8 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map(campaign => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign}
                  onView={() => console.log('View', campaign.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first fundraising campaign to start raising funds.
                </p>
                {showCreateButton && (
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sponsors" className="mt-4">
          {loadingSponsors ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sponsors && sponsors.length > 0 ? (
            <div className="space-y-6">
              {/* Sponsor logos row for public display */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Our Sponsors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-6">
                    {sponsors.map(sponsor => (
                      <SponsorLogo key={sponsor.id} sponsor={sponsor} size="md" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed sponsor cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {sponsors.map(sponsor => (
                  <SponsorCard 
                    key={sponsor.id} 
                    sponsor={sponsor}
                    showDetails
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sponsors yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add sponsors to showcase their support for your program.
                </p>
                {showCreateButton && (
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sponsor
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
