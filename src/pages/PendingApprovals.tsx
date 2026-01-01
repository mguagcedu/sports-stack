import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Clock, User, Loader2 } from 'lucide-react';

interface PendingApproval {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  created_at: string;
  rejection_reason: string | null;
  organization_id: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  organizations?: {
    name: string;
  } | null;
}

export default function PendingApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasAnyRole } = useUserRoles();
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const canManageApprovals = hasAnyRole(['system_admin', 'org_admin', 'superadmin']);

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_approvals')
        .select(`
          id,
          user_id,
          requested_role,
          status,
          created_at,
          rejection_reason,
          organization_id,
          organizations (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately to avoid join issues
      const userIds = data?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return data?.map(approval => ({
        ...approval,
        profiles: profileMap.get(approval.user_id)
      })) as PendingApproval[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ approvalId, userId, role }: { approvalId: string; userId: string; role: string }) => {
      // First, update the approval status
      const { error: approvalError } = await supabase
        .from('pending_approvals')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      // Then, add the role to the user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role as any, // Cast needed for app_role enum
        });

      if (roleError) throw roleError;

      // Remove temporary viewer role if exists
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'viewer');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast({ title: 'Request approved', description: 'The user has been granted the requested role.' });
      setSelectedApproval(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ approvalId, reason }: { approvalId: string; reason: string }) => {
      const { error } = await supabase
        .from('pending_approvals')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', approvalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast({ title: 'Request rejected', description: 'The user has been notified of the rejection.' });
      setSelectedApproval(null);
      setActionType(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleApprove = () => {
    if (!selectedApproval) return;
    approveMutation.mutate({
      approvalId: selectedApproval.id,
      userId: selectedApproval.user_id,
      role: selectedApproval.requested_role,
    });
  };

  const handleReject = () => {
    if (!selectedApproval) return;
    rejectMutation.mutate({
      approvalId: selectedApproval.id,
      reason: rejectionReason,
    });
  };

  const pendingApprovals = approvals?.filter(a => a.status === 'pending') || [];
  const processedApprovals = approvals?.filter(a => a.status !== 'pending') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Check className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><X className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserName = (approval: PendingApproval) => {
    if (approval.profiles?.first_name || approval.profiles?.last_name) {
      return `${approval.profiles.first_name || ''} ${approval.profiles.last_name || ''}`.trim();
    }
    return approval.profiles?.email || 'Unknown User';
  };

  if (!canManageApprovals) {
    return (
      <DashboardLayout title="Pending Approvals">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You don't have permission to manage role approvals.
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Role Approvals">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Role Approvals</h1>
          <p className="text-muted-foreground">Review and manage role requests from users</p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingApprovals.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed">Processed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Users waiting for role approval</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending approval requests
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Requested Role</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApprovals.map((approval) => (
                        <TableRow key={approval.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium">{getUserName(approval)}</div>
                                <div className="text-xs text-muted-foreground">{approval.profiles?.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{approval.requested_role}</Badge>
                          </TableCell>
                          <TableCell>{approval.organizations?.name || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedApproval(approval);
                                  setActionType('approve');
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedApproval(approval);
                                  setActionType('reject');
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Processed Requests</CardTitle>
                <CardDescription>Previously reviewed role requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : processedApprovals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No processed requests
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedApprovals.map((approval) => (
                        <TableRow key={approval.id}>
                          <TableCell>
                            <div className="font-medium">{getUserName(approval)}</div>
                            <div className="text-xs text-muted-foreground">{approval.profiles?.email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{approval.requested_role}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(approval.status)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {approval.rejection_reason || '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => { setActionType(null); setSelectedApproval(null); setRejectionReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Role Request' : 'Reject Role Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `Grant ${selectedApproval?.requested_role} role to ${selectedApproval ? getUserName(selectedApproval) : ''}?`
                : `Reject the ${selectedApproval?.requested_role} role request from ${selectedApproval ? getUserName(selectedApproval) : ''}?`}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for rejection (optional)</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setSelectedApproval(null); }}>
              Cancel
            </Button>
            {actionType === 'approve' ? (
              <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Approve
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
                {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reject
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
