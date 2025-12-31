import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Plus, Search, MapPin, Loader2, Users } from 'lucide-react';
import { DistrictSearchCombobox, District } from '@/components/organizations/DistrictSearchCombobox';

type OrganizationType = 'school' | 'district' | 'league' | 'club' | 'youth_organization';
type SubscriptionTier = 'free' | 'starter' | 'school' | 'district' | 'enterprise';

interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  subscription_tier: SubscriptionTier;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
}

const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  school: 'School',
  district: 'District',
  league: 'League',
  club: 'Club',
  youth_organization: 'Youth Organization'
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-info/10 text-info',
  school: 'bg-success/10 text-success',
  district: 'bg-primary/10 text-primary',
  enterprise: 'bg-warning/10 text-warning'
};

export default function Organizations() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  const [newOrg, setNewOrg] = useState({
    name: '',
    type: 'school' as OrganizationType,
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    website: ''
  });

  const handleDistrictSelect = (district: District | null) => {
    setSelectedDistrict(district);
    if (district) {
      setNewOrg({
        ...newOrg,
        name: district.name,
        address: district.address || '',
        city: district.city || '',
        state: district.state || '',
        zip: district.zip || '',
        phone: district.phone || '',
        website: district.website || '',
        type: 'district'
      });
    }
  };

  const { data: organizations, isLoading, refetch } = useQuery({
    queryKey: ['organizations', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Organization[];
    }
  });

  const handleCreateOrganization = async () => {
    if (!newOrg.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an organization',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    // Create the organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: newOrg.name.trim(),
        type: newOrg.type,
        address: newOrg.address || null,
        city: newOrg.city || null,
        state: newOrg.state || null,
        zip: newOrg.zip || null,
        phone: newOrg.phone || null,
        website: newOrg.website || null,
        district_id: selectedDistrict?.id || null
      })
      .select()
      .single();

    if (orgError) {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: orgError.message,
        variant: 'destructive'
      });
      return;
    }

    // Assign the user as org_admin
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'org_admin',
        organization_id: orgData.id
      });

    setIsSubmitting(false);

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    toast({
      title: 'Organization Created',
      description: `${newOrg.name} has been created successfully.`
    });

    setIsAddDialogOpen(false);
    setSelectedDistrict(null);
    setNewOrg({
      name: '',
      type: 'school',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      website: ''
    });
    refetch();
  };

  return (
    <DashboardLayout title="Organizations">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
            <p className="text-muted-foreground">
              Manage schools, districts, leagues, and clubs
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>
                  Set up a new school, district, league, or club
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Link to District (optional)</Label>
                  <DistrictSearchCombobox
                    value={selectedDistrict}
                    onSelect={handleDistrictSelect}
                    placeholder="Search and select a district..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Selecting a district will auto-fill organization details
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    placeholder="Lincoln High School Athletics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-type">Organization Type</Label>
                  <Select
                    value={newOrg.type}
                    onValueChange={(value: OrganizationType) => setNewOrg({ ...newOrg, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="district">District</SelectItem>
                      <SelectItem value="league">League</SelectItem>
                      <SelectItem value="club">Club</SelectItem>
                      <SelectItem value="youth_organization">Youth Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-city">City</Label>
                    <Input
                      id="org-city"
                      value={newOrg.city}
                      onChange={(e) => setNewOrg({ ...newOrg, city: e.target.value })}
                      placeholder="Springfield"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-state">State</Label>
                    <Input
                      id="org-state"
                      value={newOrg.state}
                      onChange={(e) => setNewOrg({ ...newOrg, state: e.target.value })}
                      placeholder="IL"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-phone">Phone</Label>
                  <Input
                    id="org-phone"
                    value={newOrg.phone}
                    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-website">Website</Label>
                  <Input
                    id="org-website"
                    value={newOrg.website}
                    onChange={(e) => setNewOrg({ ...newOrg, website: e.target.value })}
                    placeholder="https://athletics.school.edu"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrganization} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Organization
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Organizations Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : organizations && organizations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Card key={org.id} className="transition-all hover:shadow-md hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{org.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {ORG_TYPE_LABELS[org.type]}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={TIER_COLORS[org.subscription_tier]}>
                      {org.subscription_tier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {(org.city || org.state) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[org.city, org.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      0 teams
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No organizations yet</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                Create your first organization to start managing teams, registrations, and events.
              </p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Organization
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
