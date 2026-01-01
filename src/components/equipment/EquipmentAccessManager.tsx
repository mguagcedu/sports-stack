import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { formatDistanceToNow } from 'date-fns';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Check, 
  X, 
  Clock,
  Package,
  Trash2
} from 'lucide-react';

interface EquipmentAccessManagerProps {
  open: boolean;
  onClose: () => void;
  teamId?: string;
  schoolId?: string;
}

const DELEGATION_TYPES = [
  { value: 'equipment_manager', label: 'Equipment Manager', description: 'Full equipment management access' },
  { value: 'equipment_handler', label: 'Equipment Handler', description: 'Can check out and return equipment' },
  { value: 'student_manager', label: 'Student Manager', description: 'Student with limited equipment duties' },
];

export function EquipmentAccessManager({ open, onClose, teamId, schoolId }: EquipmentAccessManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasAnyRole } = useUserRoles();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showDelegateForm, setShowDelegateForm] = useState(false);
  const [justification, setJustification] = useState('');
  const [selectedRole, setSelectedRole] = useState('equipment_handler');
  const [selectedUserId, setSelectedUserId] = useState('');

  const isCoachOrAdmin = hasAnyRole(['coach', 'athletic_director', 'org_admin', 'system_admin', 'superadmin']);

  // Fetch pending requests
  const { data: requests } = useQuery({
    queryKey: ['equipment-access-requests', teamId, schoolId],
    queryFn: async () => {
      let query = supabase
        .from('equipment_access_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (teamId) query = query.eq('team_id', teamId);
      if (schoolId) query = query.eq('school_id', schoolId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch active delegations
  const { data: delegations } = useQuery({
    queryKey: ['equipment-delegations', teamId, schoolId],
    queryFn: async () => {
      let query = supabase
        .from('equipment_delegations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (teamId) query = query.eq('team_id', teamId);
      if (schoolId) query = query.eq('school_id', schoolId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch team members for delegation
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members-for-delegation', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          role
        `)
        .eq('team_id', teamId);
      if (error) throw error;
      
      // Get profile info
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);
      
      return data.map(m => ({
        ...m,
        profile: profiles?.find(p => p.id === m.user_id)
      }));
    },
    enabled: open && !!teamId && isCoachOrAdmin,
  });

  // Submit access request
  const requestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('equipment_access_requests')
        .insert({
          user_id: user?.id,
          team_id: teamId || null,
          school_id: schoolId || null,
          requested_role: selectedRole,
          justification,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-access-requests'] });
      setShowRequestForm(false);
      setJustification('');
      toast({ title: 'Access request submitted', description: 'Waiting for coach approval' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Approve request
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const request = requests?.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update request status
      const { error: updateError } = await supabase
        .from('equipment_access_requests')
        .update({
          status: 'approved',
          approved_by_user_id: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      if (updateError) throw updateError;

      // Create delegation
      const { error: delegationError } = await supabase
        .from('equipment_delegations')
        .insert({
          user_id: request.user_id,
          delegated_by_user_id: user?.id,
          team_id: request.team_id,
          school_id: request.school_id,
          delegation_type: request.requested_role,
        });
      if (delegationError) throw delegationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-delegations'] });
      toast({ title: 'Request approved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Reject request
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('equipment_access_requests')
        .update({
          status: 'rejected',
          approved_by_user_id: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-access-requests'] });
      toast({ title: 'Request rejected' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Create delegation directly
  const delegateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('equipment_delegations')
        .insert({
          user_id: selectedUserId,
          delegated_by_user_id: user?.id,
          team_id: teamId || null,
          school_id: schoolId || null,
          delegation_type: selectedRole,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-delegations'] });
      setShowDelegateForm(false);
      setSelectedUserId('');
      toast({ title: 'Access delegated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Revoke delegation
  const revokeMutation = useMutation({
    mutationFn: async (delegationId: string) => {
      const { error } = await supabase
        .from('equipment_delegations')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by_user_id: user?.id,
        })
        .eq('id', delegationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-delegations'] });
      toast({ title: 'Access revoked' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const processedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Equipment Access Management
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={isCoachOrAdmin ? 'requests' : 'my-access'}>
          <TabsList className="w-full">
            {isCoachOrAdmin && (
              <>
                <TabsTrigger value="requests" className="flex-1">
                  Requests
                  {pendingRequests.length > 0 && (
                    <Badge className="ml-2" variant="destructive">{pendingRequests.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="delegations" className="flex-1">
                  Active Access
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="my-access" className="flex-1">
              My Access
            </TabsTrigger>
          </TabsList>

          {isCoachOrAdmin && (
            <>
              <TabsContent value="requests" className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No pending access requests</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role Requested</TableHead>
                        <TableHead>Justification</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.user_id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {DELEGATION_TYPES.find(t => t.value === request.requested_role)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {request.justification || '-'}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600"
                                onClick={() => approveMutation.mutate(request.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => rejectMutation.mutate(request.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="delegations" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setShowDelegateForm(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Delegate Access
                  </Button>
                </div>

                {delegations?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No active equipment access delegations</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Access Level</TableHead>
                        <TableHead>Granted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {delegations?.map((delegation) => (
                        <TableRow key={delegation.id}>
                          <TableCell>{delegation.user_id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <Badge>
                              {DELEGATION_TYPES.find(t => t.value === delegation.delegation_type)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(delegation.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => revokeMutation.mutate(delegation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Delegate Form */}
                {showDelegateForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Delegate Equipment Access</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Team Member</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers?.map((member) => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                {member.profile?.first_name} {member.profile?.last_name} ({member.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Access Level</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DELEGATION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex flex-col">
                                  <span>{type.label}</span>
                                  <span className="text-xs text-muted-foreground">{type.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => delegateMutation.mutate()} disabled={!selectedUserId}>
                          Grant Access
                        </Button>
                        <Button variant="outline" onClick={() => setShowDelegateForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </>
          )}

          <TabsContent value="my-access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Equipment Access</CardTitle>
                <CardDescription>
                  Request permission to manage equipment for this team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELEGATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Justification</Label>
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Explain why you need equipment access..."
                    rows={3}
                  />
                </div>
                <Button onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending}>
                  {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </CardContent>
            </Card>

            {/* My previous requests */}
            {requests && requests.filter(r => r.user_id === user?.id).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">My Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.filter(r => r.user_id === user?.id).map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            {DELEGATION_TYPES.find(t => t.value === request.requested_role)?.label}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              request.status === 'approved' ? 'default' :
                              request.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
