import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Wrench, Calendar, DollarSign } from 'lucide-react';

interface EquipmentRefurbishmentManagerProps {
  open: boolean;
  onClose: () => void;
  itemId: string | null;
  itemName: string | undefined;
}

const REFURB_TYPES = [
  { value: 'refurbishment', label: 'Refurbishment' },
  { value: 'recertification', label: 'Recertification' },
  { value: 'repair', label: 'Repair' },
  { value: 'cleaning', label: 'Cleaning' },
];

export function EquipmentRefurbishmentManager({ open, onClose, itemId, itemName }: EquipmentRefurbishmentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    refurb_type: 'refurbishment',
    refurb_date: new Date().toISOString().split('T')[0],
    cost: '',
    provider: '',
    notes: '',
    next_due_date: '',
  });

  const { data: refurbishments, isLoading } = useQuery({
    queryKey: ['equipment-refurbishments', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const { data, error } = await supabase
        .from('equipment_refurbishment')
        .select('*')
        .eq('equipment_item_id', itemId)
        .order('refurb_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!itemId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('equipment_refurbishment')
        .insert({
          equipment_item_id: itemId,
          refurb_type: formData.refurb_type,
          refurb_date: formData.refurb_date,
          cost: formData.cost ? parseFloat(formData.cost) : 0,
          provider: formData.provider || null,
          notes: formData.notes || null,
          next_due_date: formData.next_due_date || null,
          performed_by_user_id: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-refurbishments', itemId] });
      queryClient.invalidateQueries({ queryKey: ['equipment-refurbishment-stats'] });
      setIsAddOpen(false);
      setFormData({
        refurb_type: 'refurbishment',
        refurb_date: new Date().toISOString().split('T')[0],
        cost: '',
        provider: '',
        notes: '',
        next_due_date: '',
      });
      toast({ title: 'Record added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding record', description: error.message, variant: 'destructive' });
    },
  });

  const totalCost = refurbishments?.reduce((sum, r) => sum + (Number(r.cost) || 0), 0) || 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Refurbishment History: {itemName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total: ${totalCost.toFixed(2)}
                </Badge>
                <Badge variant="outline">
                  {refurbishments?.length || 0} records
                </Badge>
              </div>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : refurbishments?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No refurbishment records yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refurbishments?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.refurb_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.refurb_type === 'recertification' ? 'default' : 'secondary'}>
                          {REFURB_TYPES.find(t => t.value === record.refurb_type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.provider || '-'}</TableCell>
                      <TableCell>${Number(record.cost || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {record.next_due_date ? (
                          <span className={new Date(record.next_due_date) < new Date() ? 'text-destructive font-medium' : ''}>
                            {new Date(record.next_due_date).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Refurbishment Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.refurb_type}
                  onValueChange={(value) => setFormData({ ...formData, refurb_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REFURB_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.refurb_date}
                  onChange={(e) => setFormData({ ...formData, refurb_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Provider/Vendor</Label>
                <Input
                  placeholder="Company or person name"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Next Due Date</Label>
              <Input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Adding...' : 'Add Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
