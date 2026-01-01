import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';
import { Lock, Loader2, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AccessRequestCardProps {
  title: string;
  description: string;
  requiredRole: string;
  pageKey?: string;
  icon?: React.ReactNode;
}

export function AccessRequestCard({ 
  title, 
  description, 
  requiredRole, 
  pageKey,
  icon 
}: AccessRequestCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [justification, setJustification] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Check if user already has a pending request
  const { data: existingRequest } = useQuery({
    queryKey: ['access-request', user?.id, requiredRole],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('user_id', user!.id)
        .eq('requested_role', requiredRole)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const requestAccessMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('access_requests')
        .insert({
          user_id: user.id,
          requested_role: requiredRole,
          requested_page: pageKey,
          justification: justification || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Access request submitted');
      setShowForm(false);
      setJustification('');
      queryClient.invalidateQueries({ queryKey: ['access-request', user?.id, requiredRole] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit request');
    },
  });

  const getStatusBadge = () => {
    if (!existingRequest) return null;
    switch (existingRequest.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {icon || <Lock className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {existingRequest?.status === 'pending' ? (
          <p className="text-sm text-muted-foreground">
            Your access request is being reviewed. You'll be notified when it's approved.
          </p>
        ) : existingRequest?.status === 'approved' ? (
          <p className="text-sm text-green-600">
            Access granted! Refresh the page to see your updated dashboard.
          </p>
        ) : existingRequest?.status === 'denied' ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              Your request was denied. {existingRequest.review_notes && `Reason: ${existingRequest.review_notes}`}
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              Request Again
            </Button>
          </div>
        ) : showForm ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Why do you need access? (optional)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => requestAccessMutation.mutate()}
                disabled={requestAccessMutation.isPending}
                size="sm"
              >
                {requestAccessMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowForm(true)}>
            <Lock className="h-4 w-4 mr-2" />
            Request Access
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
