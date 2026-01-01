import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { 
  Layers, 
  Plus,
  Edit2,
  Trash2,
  Loader2,
  GripVertical
} from 'lucide-react';

interface LineGroupManagerProps {
  teamId: string;
}

export function LineGroupManager({ teamId }: LineGroupManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);

  // Form state
  const [lineKey, setLineKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Fetch line groups
  const { data: lineGroups = [], isLoading } = useQuery({
    queryKey: ['line-groups', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_groups')
        .select('*')
        .eq('team_id', teamId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Add line group mutation
  const addGroupMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = lineGroups.length > 0 
        ? Math.max(...lineGroups.map((g: any) => g.sort_order || 0)) + 1 
        : 0;

      const { error } = await supabase
        .from('line_groups')
        .insert({
          team_id: teamId,
          line_key: lineKey.toLowerCase().replace(/\s+/g, '_'),
          display_name: displayName,
          description,
          is_default: isDefault,
          is_custom: true,
          sort_order: maxOrder,
          created_by_user_id: user?.id,
          sport_key: 'general', // Default sport key
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['line-groups'] });
      toast.success('Line group created');
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create line group');
    },
  });

  // Update line group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async () => {
      if (!editingGroup) return;
      const { error } = await supabase
        .from('line_groups')
        .update({
          display_name: displayName,
          description,
          is_default: isDefault,
        })
        .eq('id', editingGroup.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['line-groups'] });
      toast.success('Line group updated');
      resetForm();
      setEditingGroup(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update line group');
    },
  });

  // Delete line group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('line_groups')
        .delete()
        .eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['line-groups'] });
      toast.success('Line group deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete line group');
    },
  });

  const resetForm = () => {
    setLineKey('');
    setDisplayName('');
    setDescription('');
    setIsDefault(false);
  };

  const handleEdit = (group: any) => {
    setEditingGroup(group);
    setLineKey(group.line_key);
    setDisplayName(group.display_name);
    setDescription(group.description || '');
    setIsDefault(group.is_default || false);
  };

  const handleSave = () => {
    if (editingGroup) {
      updateGroupMutation.mutate();
    } else {
      addGroupMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            Line Groups
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage offense, defense, and special teams groupings
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Line Group
        </Button>
      </div>

      {/* Line Groups List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Line Groups</CardTitle>
          <CardDescription>Organize players into units like offense, defense, or special teams</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : lineGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No line groups created</p>
              <p className="text-sm">Add groups like "Offense", "Defense", or "Special Teams"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lineGroups.map((group: any) => (
                <div 
                  key={group.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.display_name}</span>
                        {group.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                        {group.is_custom && (
                          <Badge variant="outline" className="text-xs">Custom</Badge>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">{group.line_key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(group)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {group.is_custom && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteGroupMutation.mutate(group.id)}
                        disabled={deleteGroupMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common line groups suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Add</CardTitle>
          <CardDescription>Common line group templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['Offense', 'Defense', 'Special Teams', 'First Line', 'Second Line', 'Power Play', 'Penalty Kill', 'Starters', 'Bench'].map((name) => {
              const exists = lineGroups.some((g: any) => 
                g.display_name.toLowerCase() === name.toLowerCase()
              );
              return (
                <Button
                  key={name}
                  size="sm"
                  variant={exists ? 'secondary' : 'outline'}
                  disabled={exists}
                  onClick={() => {
                    setDisplayName(name);
                    setLineKey(name.toLowerCase().replace(/\s+/g, '_'));
                    setShowAddDialog(true);
                  }}
                >
                  {exists ? '✓' : '+'} {name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingGroup} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingGroup(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Line Group' : 'Add Line Group'}</DialogTitle>
            <DialogDescription>
              {editingGroup ? 'Update the line group details' : 'Create a new line group for your team'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (!editingGroup) {
                    setLineKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }
                }}
                placeholder="e.g., First Line Offense"
              />
            </div>

            {!editingGroup && (
              <div className="space-y-2">
                <Label>Key (auto-generated)</Label>
                <Input
                  value={lineKey}
                  onChange={(e) => setLineKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="e.g., first_line_offense"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Used for internal identification. Lowercase with underscores.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this line group for?"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default line group
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingGroup(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!displayName || (!editingGroup && !lineKey) || addGroupMutation.isPending || updateGroupMutation.isPending}
            >
              {(addGroupMutation.isPending || updateGroupMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingGroup ? 'Save Changes' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}