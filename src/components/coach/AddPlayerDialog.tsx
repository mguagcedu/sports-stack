import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
}

export function AddPlayerDialog({ open, onOpenChange, teamId, teamName }: AddPlayerDialogProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('');

  // Fetch available users (profiles not already on this team)
  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['available-users-for-team', teamId],
    enabled: open && !!teamId,
    queryFn: async () => {
      // Get existing team member user IDs
      const { data: existingMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);
      
      const existingUserIds = existingMembers?.map(m => m.user_id) || [];
      
      // Get all profiles
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('last_name');
      
      if (existingUserIds.length > 0) {
        // Filter out users already on the team
        const { data } = await query;
        return (data || []).filter(p => !existingUserIds.includes(p.id));
      }
      
      const { data } = await query;
      return data || [];
    },
  });

  const addPlayerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error('Please select a user');
      
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: selectedUserId,
          role: 'athlete',
          jersey_number: jerseyNumber || null,
          position: position || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Player added to roster');
      queryClient.invalidateQueries({ queryKey: ['team-roster', teamId] });
      queryClient.invalidateQueries({ queryKey: ['available-users-for-team', teamId] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add player');
    },
  });

  const resetForm = () => {
    setSelectedUserId('');
    setJerseyNumber('');
    setPosition('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPlayerMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Player to Roster
          </DialogTitle>
          <DialogDescription>
            Add a player to {teamName}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Select Player</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder={usersLoading ? "Loading..." : "Select a player"} />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name || ''} {user.last_name || ''} 
                    {user.email && ` (${user.email})`}
                  </SelectItem>
                ))}
                {availableUsers.length === 0 && !usersLoading && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No available users found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jersey">Jersey Number</Label>
              <Input
                id="jersey"
                type="text"
                placeholder="e.g., 23"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="text"
                placeholder="e.g., Guard"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedUserId || addPlayerMutation.isPending}>
              {addPlayerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Player
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
