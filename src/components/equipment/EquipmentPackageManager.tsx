import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Trash2, Edit, Copy } from 'lucide-react';

interface EquipmentPackageManagerProps {
  open: boolean;
  onClose: () => void;
}

const TEAM_LEVELS = [
  { value: 'varsity', label: 'Varsity' },
  { value: 'jv', label: 'Junior Varsity' },
  { value: 'freshman', label: 'Freshman' },
  { value: 'middle_school', label: 'Middle School' },
];

const SPORTS = [
  { value: 'football', label: 'Football' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'softball', label: 'Softball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'track', label: 'Track & Field' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'lacrosse', label: 'Lacrosse' },
  { value: 'hockey', label: 'Hockey' },
];

export function EquipmentPackageManager({ open, onClose }: EquipmentPackageManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    sport_code: '',
    team_level: '',
  });
  const [newItem, setNewItem] = useState({
    item_name: '',
    category: '',
    subcategory: '',
    quantity: 1,
    is_required: true,
  });

  // Fetch packages
  const { data: packages, isLoading } = useQuery({
    queryKey: ['equipment-packages-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_packages')
        .select(`
          *,
          equipment_package_items(*)
        `)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Add package mutation
  const addPackageMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('equipment_packages')
        .insert({
          name: newPackage.name,
          description: newPackage.description || null,
          sport_code: newPackage.sport_code || null,
          team_level: newPackage.team_level || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-packages-all'] });
      setNewPackage({ name: '', description: '', sport_code: '', team_level: '' });
      setIsAddingPackage(false);
      toast({ title: 'Package created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating package', description: error.message, variant: 'destructive' });
    },
  });

  // Add item to package mutation
  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackageId) throw new Error('No package selected');
      const { error } = await supabase
        .from('equipment_package_items')
        .insert({
          package_id: selectedPackageId,
          item_name: newItem.item_name,
          category: newItem.category,
          subcategory: newItem.subcategory || null,
          quantity: newItem.quantity,
          is_required: newItem.is_required,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-packages-all'] });
      setNewItem({ item_name: '', category: '', subcategory: '', quantity: 1, is_required: true });
      toast({ title: 'Item added to package' });
    },
    onError: (error) => {
      toast({ title: 'Error adding item', description: error.message, variant: 'destructive' });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('equipment_package_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-packages-all'] });
      toast({ title: 'Item removed from package' });
    },
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { error } = await supabase
        .from('equipment_packages')
        .delete()
        .eq('id', packageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-packages-all'] });
      setSelectedPackageId(null);
      toast({ title: 'Package deleted' });
    },
  });

  const selectedPackage = packages?.find(p => p.id === selectedPackageId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipment Package Templates
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 h-[60vh]">
          {/* Package List */}
          <div className="space-y-4 border-r pr-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Packages</h3>
              <Button size="sm" onClick={() => setIsAddingPackage(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="space-y-2">
                {packages?.map((pkg) => (
                  <Card 
                    key={pkg.id}
                    className={`cursor-pointer transition-colors ${
                      selectedPackageId === pkg.id ? 'border-primary bg-accent/50' : 'hover:bg-accent/30'
                    }`}
                    onClick={() => setSelectedPackageId(pkg.id)}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{pkg.name}</p>
                      <div className="flex gap-1 mt-1">
                        {pkg.sport_code && (
                          <Badge variant="outline" className="text-xs">{pkg.sport_code}</Badge>
                        )}
                        {pkg.team_level && (
                          <Badge variant="secondary" className="text-xs">{pkg.team_level}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pkg.equipment_package_items?.length || 0} items
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Package Details */}
          <div className="col-span-2 space-y-4">
            {selectedPackage ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPackage.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPackage.description}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deletePackageMutation.mutate(selectedPackage.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Items in Package</h4>
                  <ScrollArea className="h-[30vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPackage.equipment_package_items?.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.item_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              {item.is_required ? (
                                <Badge variant="default">Required</Badge>
                              ) : (
                                <Badge variant="secondary">Optional</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => deleteItemMutation.mutate(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                {/* Add Item Form */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Add Item to Package</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Item name"
                        value={newItem.item_name}
                        onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                      />
                      <Input
                        placeholder="Category"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      />
                      <Input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                      />
                      <Button 
                        onClick={() => addItemMutation.mutate()}
                        disabled={!newItem.item_name || !newItem.category}
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Select a package to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Package Dialog */}
        {isAddingPackage && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New Package</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Package Name *</Label>
                  <Input
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    placeholder="e.g., Football Varsity Full Kit"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sport</Label>
                    <Select
                      value={newPackage.sport_code}
                      onValueChange={(value) => setNewPackage({ ...newPackage, sport_code: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SPORTS.map((sport) => (
                          <SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Team Level</Label>
                    <Select
                      value={newPackage.team_level}
                      onValueChange={(value) => setNewPackage({ ...newPackage, team_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                    placeholder="Optional description..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingPackage(false)}>Cancel</Button>
                  <Button 
                    onClick={() => addPackageMutation.mutate()}
                    disabled={!newPackage.name}
                  >
                    Create Package
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
