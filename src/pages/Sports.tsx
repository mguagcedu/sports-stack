import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Trophy, Plus, Search, Loader2, Pencil, Trash2, 
  CircleDot, Target, Dumbbell, Medal, Waves, 
  Footprints, Bike, Star, Sparkles
} from 'lucide-react';

interface Sport {
  id: string;
  name: string;
  code: string | null;
  icon: string | null;
  gender: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

const ICON_OPTIONS = [
  { value: 'trophy', label: 'Trophy', icon: Trophy },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'dumbbell', label: 'Dumbbell', icon: Dumbbell },
  { value: 'medal', label: 'Medal', icon: Medal },
  { value: 'waves', label: 'Waves', icon: Waves },
  { value: 'footprints', label: 'Footprints', icon: Footprints },
  { value: 'bike', label: 'Bike', icon: Bike },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'circle-dot', label: 'Ball', icon: CircleDot },
];

const PRESET_SPORTS = [
  { name: 'Football', code: 'FB', gender: 'boys' },
  { name: 'Basketball', code: 'BB', gender: 'coed' },
  { name: 'Soccer', code: 'SOC', gender: 'coed' },
  { name: 'Volleyball', code: 'VB', gender: 'coed' },
  { name: 'Baseball', code: 'BASE', gender: 'boys' },
  { name: 'Softball', code: 'SB', gender: 'girls' },
  { name: 'Track & Field', code: 'TF', gender: 'coed' },
  { name: 'Cross Country', code: 'XC', gender: 'coed' },
  { name: 'Swimming', code: 'SWIM', gender: 'coed' },
  { name: 'Tennis', code: 'TEN', gender: 'coed' },
  { name: 'Golf', code: 'GOLF', gender: 'coed' },
  { name: 'Wrestling', code: 'WR', gender: 'boys' },
  { name: 'Lacrosse', code: 'LAX', gender: 'coed' },
  { name: 'Field Hockey', code: 'FH', gender: 'girls' },
  { name: 'Cheerleading', code: 'CHEER', gender: 'coed' },
  { name: 'Gymnastics', code: 'GYM', gender: 'coed' },
];

const getIconComponent = (iconName: string | null) => {
  const found = ICON_OPTIONS.find(i => i.value === iconName);
  return found?.icon || Trophy;
};

export default function Sports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    icon: 'trophy',
    gender: 'coed',
    is_active: true
  });

  const { data: sports, isLoading } = useQuery({
    queryKey: ['sports', searchQuery, genderFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from('sports').select('*').order('name');
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Sport[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('sports').insert({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase() || null,
        icon: data.icon,
        gender: data.gender,
        is_active: data.is_active
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      toast({ title: 'Sport Created', description: 'The sport has been added successfully.' });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('sports').update({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase() || null,
        icon: data.icon,
        gender: data.gender,
        is_active: data.is_active
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      toast({ title: 'Sport Updated', description: 'The sport has been updated successfully.' });
      setIsEditDialogOpen(false);
      setSelectedSport(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      toast({ title: 'Sport Deleted', description: 'The sport has been removed.' });
      setIsDeleteDialogOpen(false);
      setSelectedSport(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('sports').insert(
        PRESET_SPORTS.map(s => ({ ...s, is_active: true, icon: 'trophy' }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      toast({ title: 'Sports Added', description: `${PRESET_SPORTS.length} common sports have been added.` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', icon: 'trophy', gender: 'coed', is_active: true });
  };

  const openEditDialog = (sport: Sport) => {
    setSelectedSport(sport);
    setFormData({
      name: sport.name,
      code: sport.code || '',
      icon: sport.icon || 'trophy',
      gender: sport.gender || 'coed',
      is_active: sport.is_active ?? true
    });
    setIsEditDialogOpen(true);
  };

  const SportFormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Sport Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Basketball"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="BB"
            maxLength={10}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Icon</Label>
          <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coed">Coed</SelectItem>
              <SelectItem value="boys">Boys</SelectItem>
              <SelectItem value="girls">Girls</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Active</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Sports">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sports</h1>
            <p className="text-muted-foreground">Manage available sports for your organizations</p>
          </div>
          <div className="flex gap-2">
            {sports && sports.length === 0 && (
              <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                {seedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Sparkles className="mr-2 h-4 w-4" />
                Add Common Sports
              </Button>
            )}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Add Sport</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Sport</DialogTitle>
                  <DialogDescription>Create a new sport for teams to participate in</DialogDescription>
                </DialogHeader>
                <SportFormFields />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.name.trim()}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Sport
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="coed">Coed</SelectItem>
              <SelectItem value="boys">Boys</SelectItem>
              <SelectItem value="girls">Girls</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sports Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sports && sports.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sports.map((sport) => {
              const IconComponent = getIconComponent(sport.icon);
              return (
                <Card key={sport.id} className={`transition-all hover:shadow-md ${!sport.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{sport.name}</CardTitle>
                          {sport.code && <CardDescription className="text-xs">{sport.code}</CardDescription>}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={sport.is_active ? 'default' : 'secondary'}>
                        {sport.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{sport.gender || 'coed'}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(sport)}>
                        <Pencil className="h-3 w-3 mr-1" />Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedSport(sport); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No sports configured</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                Add sports that your organization offers. You can start with common sports or add custom ones.
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                  <Sparkles className="mr-2 h-4 w-4" />Add Common Sports
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Add Custom Sport
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Sport</DialogTitle>
              <DialogDescription>Update sport details</DialogDescription>
            </DialogHeader>
            <SportFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => selectedSport && updateMutation.mutate({ id: selectedSport.id, data: formData })} 
                disabled={updateMutation.isPending || !formData.name.trim()}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sport?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{selectedSport?.name}". Teams using this sport may be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedSport && deleteMutation.mutate(selectedSport.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
