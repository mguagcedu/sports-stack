import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Ruler, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EquipmentSize {
  id: string;
  size_label: string;
  quantity: number;
  available_quantity: number;
  equipment_item_id: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  total_quantity: number;
  available_quantity: number;
}

interface EquipmentSizeManagerProps {
  open: boolean;
  onClose: () => void;
  item: EquipmentItem | null;
  sizes: EquipmentSize[];
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const YOUTH_SIZES = ['YXS', 'YS', 'YM', 'YL', 'YXL'];
const NUMERIC_SIZES = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14'];

export function EquipmentSizeManager({ open, onClose, item, sizes }: EquipmentSizeManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newSize, setNewSize] = useState({ label: '', quantity: '1' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  const addSizeMutation = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error('No item selected');
      
      const { error } = await supabase
        .from('equipment_sizes')
        .insert({
          equipment_item_id: item.id,
          size_label: newSize.label.toUpperCase(),
          quantity: parseInt(newSize.quantity) || 1,
          available_quantity: parseInt(newSize.quantity) || 1,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-sizes'] });
      setNewSize({ label: '', quantity: '1' });
      toast({ title: 'Size added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding size', description: error.message, variant: 'destructive' });
    },
  });

  const updateSizeMutation = useMutation({
    mutationFn: async ({ sizeId, quantity }: { sizeId: string; quantity: number }) => {
      const size = sizes.find(s => s.id === sizeId);
      if (!size) throw new Error('Size not found');
      
      const diff = quantity - size.quantity;
      
      const { error } = await supabase
        .from('equipment_sizes')
        .update({
          quantity,
          available_quantity: size.available_quantity + diff,
        })
        .eq('id', sizeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-sizes'] });
      setEditingId(null);
      toast({ title: 'Size updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating size', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSizeMutation = useMutation({
    mutationFn: async (sizeId: string) => {
      const { error } = await supabase
        .from('equipment_sizes')
        .delete()
        .eq('id', sizeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-sizes'] });
      toast({ title: 'Size removed successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error removing size', description: error.message, variant: 'destructive' });
    },
  });

  const handleQuickAdd = (sizeLabel: string) => {
    setNewSize({ ...newSize, label: sizeLabel });
  };

  const handleStartEdit = (size: EquipmentSize) => {
    setEditingId(size.id);
    setEditQuantity(size.quantity.toString());
  };

  const handleSaveEdit = (sizeId: string) => {
    const qty = parseInt(editQuantity);
    if (qty > 0) {
      updateSizeMutation.mutate({ sizeId, quantity: qty });
    }
  };

  const totalBySize = sizes.reduce((sum, s) => sum + s.quantity, 0);
  const availableBySize = sizes.reduce((sum, s) => sum + s.available_quantity, 0);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Manage Sizes: {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{sizes.length}</div>
              <div className="text-xs text-muted-foreground">Size Variants</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{totalBySize}</div>
              <div className="text-xs text-muted-foreground">Total by Size</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{availableBySize}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="space-y-2">
            <Label>Quick Add Common Sizes</Label>
            <div className="flex flex-wrap gap-1">
              {COMMON_SIZES.map((size) => (
                <Button
                  key={size}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(size)}
                  disabled={sizes.some(s => s.size_label === size)}
                  className="text-xs"
                >
                  {size}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {YOUTH_SIZES.map((size) => (
                <Button
                  key={size}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(size)}
                  disabled={sizes.some(s => s.size_label === size)}
                  className="text-xs"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Add New Size */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>Size Label</Label>
              <Input
                value={newSize.label}
                onChange={(e) => setNewSize({ ...newSize, label: e.target.value })}
                placeholder="e.g., XL, 10.5, Adult L"
              />
            </div>
            <div className="w-24 space-y-2">
              <Label>Qty</Label>
              <Input
                type="number"
                min="1"
                value={newSize.quantity}
                onChange={(e) => setNewSize({ ...newSize, quantity: e.target.value })}
              />
            </div>
            <Button
              onClick={() => addSizeMutation.mutate()}
              disabled={!newSize.label || addSizeMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          {/* Size Table */}
          {sizes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Total Qty</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Checked Out</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sizes.map((size) => (
                  <TableRow key={size.id}>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {size.size_label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === size.id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-20"
                          />
                          <Button size="sm" onClick={() => handleSaveEdit(size.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <span 
                          className="cursor-pointer hover:underline" 
                          onClick={() => handleStartEdit(size)}
                        >
                          {size.quantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={size.available_quantity === 0 ? 'text-destructive font-medium' : ''}>
                        {size.available_quantity}
                      </span>
                    </TableCell>
                    <TableCell>{size.quantity - size.available_quantity}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSizeMutation.mutate(size.id)}
                        disabled={size.quantity !== size.available_quantity}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No sizes defined yet</p>
              <p className="text-sm">Add sizes above to track inventory by size</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
