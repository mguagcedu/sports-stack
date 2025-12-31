import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users as UsersIcon, Search, Loader2, Pencil, Shield, UserPlus, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  organization_id: string | null;
  team_id: string | null;
  school_id: string | null;
  district_id: string | null;
}

interface UserWithRoles extends Profile {
  roles: UserRole[];
}

const ROLE_LABELS: Record<AppRole, string> = {
  system_admin: 'System Admin',
  superadmin: 'Super Admin',
  org_admin: 'Org Admin',
  district_owner: 'District Owner',
  district_admin: 'District Admin',
  district_viewer: 'District Viewer',
  school_owner: 'School Owner',
  school_admin: 'School Admin',
  school_viewer: 'School Viewer',
  athletic_director: 'Athletic Director',
  coach: 'Coach',
  assistant_coach: 'Assistant Coach',
  team_manager: 'Team Manager',
  trainer: 'Trainer',
  scorekeeper: 'Scorekeeper',
  parent: 'Parent',
  guardian: 'Guardian',
  athlete: 'Athlete',
  registrar: 'Registrar',
  finance_admin: 'Finance Admin',
  finance_clerk: 'Finance Clerk',
  gate_staff: 'Gate Staff',
  viewer: 'Viewer'
};

const ROLE_COLORS: Partial<Record<AppRole, string>> = {
  system_admin: 'bg-destructive/10 text-destructive',
  superadmin: 'bg-destructive/10 text-destructive',
  org_admin: 'bg-primary/10 text-primary',
  coach: 'bg-success/10 text-success',
  athlete: 'bg-info/10 text-info',
  parent: 'bg-warning/10 text-warning',
};

const ALL_ROLES: AppRole[] = [
  'system_admin', 'superadmin', 'org_admin', 'district_owner', 'district_admin', 
  'district_viewer', 'school_owner', 'school_admin', 'school_viewer', 'athletic_director',
  'coach', 'assistant_coach', 'team_manager', 'trainer', 'scorekeeper', 'parent',
  'guardian', 'athlete', 'registrar', 'finance_admin', 'finance_clerk', 'gate_staff', 'viewer'
];

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState<AppRole>('viewer');
  const [editingProfile, setEditingProfile] = useState<Partial<Profile>>({});

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchQuery, roleFilter],
    queryFn: async () => {
      // Fetch profiles
      let profileQuery = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      
      if (searchQuery) {
        profileQuery = profileQuery.or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);
      }
      
      const { data: profiles, error: profileError } = await profileQuery;
      if (profileError) throw profileError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*');
      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        ...profile,
        roles: (roles || []).filter(r => r.user_id === profile.id)
      }));

      // Filter by role if needed
      if (roleFilter !== 'all') {
        return usersWithRoles.filter(u => u.roles.some(r => r.role === roleFilter));
      }

      return usersWithRoles;
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Profile> }) => {
      const { error } = await supabase.from('profiles').update({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Profile Updated', description: 'User profile has been updated.' });
      setIsDetailOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: role
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Role Added', description: 'The role has been assigned to the user.' });
      setIsAddRoleOpen(false);
      // Refresh selected user
      if (selectedUser) {
        const updated = users?.find(u => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Role Removed', description: 'The role has been removed from the user.' });
      // Refresh selected user
      if (selectedUser) {
        const updated = users?.find(u => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const openUserDetail = (user: UserWithRoles) => {
    setSelectedUser(user);
    setEditingProfile({
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone
    });
    setIsDetailOpen(true);
  };

  const getInitials = (user: Profile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = (user: Profile) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email || 'Unknown User';
  };

  return (
    <DashboardLayout title="Users">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage users and their role assignments</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ALL_ROLES.map(role => (
                <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : users && users.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openUserDetail(user)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{getDisplayName(user)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.slice(0, 3).map((role) => (
                            <Badge key={role.id} className={ROLE_COLORS[role.role] || 'bg-muted text-muted-foreground'}>
                              {ROLE_LABELS[role.role]}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No roles</Badge>
                        )}
                        {user.roles.length > 3 && (
                          <Badge variant="outline">+{user.roles.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openUserDetail(user); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No users found</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                {searchQuery || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Users will appear here once they sign up.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* User Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser?.avatar_url || undefined} />
                  <AvatarFallback>{selectedUser && getInitials(selectedUser)}</AvatarFallback>
                </Avatar>
                {selectedUser && getDisplayName(selectedUser)}
              </DialogTitle>
              <DialogDescription>{selectedUser?.email}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Profile Form */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Profile Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={editingProfile.first_name || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={editingProfile.last_name || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editingProfile.phone || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Roles Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Assigned Roles
                  </h4>
                  <Button variant="outline" size="sm" onClick={() => setIsAddRoleOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-1" />Add Role
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedUser?.roles.map((role) => (
                    <Badge key={role.id} className={`${ROLE_COLORS[role.role] || 'bg-muted text-muted-foreground'} pr-1`}>
                      {ROLE_LABELS[role.role]}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-transparent"
                        onClick={() => removeRoleMutation.mutate(role.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  {selectedUser?.roles.length === 0 && (
                    <p className="text-sm text-muted-foreground">No roles assigned</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => selectedUser && updateProfileMutation.mutate({ id: selectedUser.id, data: editingProfile })}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Role Dialog */}
        <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Role</DialogTitle>
              <DialogDescription>Assign a new role to {selectedUser && getDisplayName(selectedUser)}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Select Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(role => (
                    <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => selectedUser && addRoleMutation.mutate({ userId: selectedUser.id, role: newRole })}
                disabled={addRoleMutation.isPending}
              >
                {addRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
