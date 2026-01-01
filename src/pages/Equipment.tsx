import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/equipment/QRScanner';
import { 
  Package, 
  Plus, 
  Search, 
  QrCode, 
  BarChart3, 
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Camera
} from 'lucide-react';

const CATEGORIES = [
  { value: 'uniform', label: 'Uniforms' },
  { value: 'protective', label: 'Protective Gear' },
  { value: 'training', label: 'Training Equipment' },
  { value: 'game_equipment', label: 'Game Equipment' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'accessories', label: 'Accessories' },
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'worn', label: 'Worn' },
  { value: 'damaged', label: 'Damaged' },
];

const TRACKING_METHODS = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'qr', label: 'QR Code' },
  { value: 'barcode', label: 'Barcode' },
  { value: 'sticker', label: 'Sticker/Tag' },
];

export default function Equipment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'search' | 'add' | 'checkout'>('search');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'uniform',
    sku: '',
    barcode: '',
    unit_cost: '',
    total_quantity: '1',
    reorder_threshold: '',
  });
  const [checkoutData, setCheckoutData] = useState({
    user_id: '',
    team_id: '',
    quantity: '1',
    tracking_method: 'manual',
    tracking_code: '',
    condition: 'good',
    expected_return_date: '',
    notes: '',
  });

  // Fetch equipment items
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['equipment-items', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('equipment_items')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch checkouts
  const { data: checkouts, isLoading: checkoutsLoading } = useQuery({
    queryKey: ['equipment-checkouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_checkouts')
        .select(`
          *,
          equipment_items(name, category)
        `)
        .eq('status', 'checked_out')
        .order('checkout_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch users for checkout
  const { data: users } = useQuery({
    queryKey: ['profiles-for-checkout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('last_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['teams-for-checkout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('equipment_items')
        .insert({
          name: newItem.name,
          description: newItem.description || null,
          category: newItem.category,
          sku: newItem.sku || null,
          barcode: newItem.barcode || null,
          unit_cost: newItem.unit_cost ? parseFloat(newItem.unit_cost) : null,
          total_quantity: parseInt(newItem.total_quantity) || 1,
          available_quantity: parseInt(newItem.total_quantity) || 1,
          reorder_threshold: newItem.reorder_threshold ? parseInt(newItem.reorder_threshold) : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-items'] });
      setIsAddItemOpen(false);
      setNewItem({
        name: '',
        description: '',
        category: 'uniform',
        sku: '',
        barcode: '',
        unit_cost: '',
        total_quantity: '1',
        reorder_threshold: '',
      });
      toast({ title: 'Equipment item added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding item', description: error.message, variant: 'destructive' });
    },
  });

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('equipment_checkouts')
        .insert({
          equipment_item_id: selectedItemId,
          user_id: checkoutData.user_id,
          team_id: checkoutData.team_id || null,
          checked_out_by_user_id: user.id,
          quantity: parseInt(checkoutData.quantity) || 1,
          tracking_method: checkoutData.tracking_method,
          tracking_code: checkoutData.tracking_code || null,
          condition_on_checkout: checkoutData.condition,
          expected_return_date: checkoutData.expected_return_date || null,
          notes: checkoutData.notes || null,
        });
      if (error) throw error;

      // Update available quantity
      const item = items?.find(i => i.id === selectedItemId);
      if (item) {
        await supabase
          .from('equipment_items')
          .update({ available_quantity: item.available_quantity - parseInt(checkoutData.quantity) })
          .eq('id', selectedItemId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-items'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-checkouts'] });
      setIsCheckoutOpen(false);
      setSelectedItemId(null);
      setCheckoutData({
        user_id: '',
        team_id: '',
        quantity: '1',
        tracking_method: 'manual',
        tracking_code: '',
        condition: 'good',
        expected_return_date: '',
        notes: '',
      });
      toast({ title: 'Equipment checked out successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error checking out item', description: error.message, variant: 'destructive' });
    },
  });

  // Return item mutation
  const returnMutation = useMutation({
    mutationFn: async ({ checkoutId, condition }: { checkoutId: string; condition: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const checkout = checkouts?.find(c => c.id === checkoutId);
      if (!checkout) throw new Error('Checkout not found');

      const { error } = await supabase
        .from('equipment_checkouts')
        .update({
          status: 'returned',
          actual_return_date: new Date().toISOString(),
          return_received_by_user_id: user.id,
          condition_on_return: condition,
        })
        .eq('id', checkoutId);
      if (error) throw error;

      // Update available quantity
      const item = items?.find(i => i.id === checkout.equipment_item_id);
      if (item) {
        await supabase
          .from('equipment_items')
          .update({ available_quantity: item.available_quantity + checkout.quantity })
          .eq('id', checkout.equipment_item_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-items'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-checkouts'] });
      toast({ title: 'Equipment returned successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error returning item', description: error.message, variant: 'destructive' });
    },
  });

  const handleCheckout = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsCheckoutOpen(true);
  };

  const handleScanResult = (code: string) => {
    if (scanMode === 'search') {
      setSearchQuery(code);
      // Try to find matching item
      const matchingItem = items?.find(
        (item) => item.barcode === code || item.sku === code
      );
      if (matchingItem) {
        toast({
          title: 'Item Found',
          description: `Found: ${matchingItem.name}`,
        });
      } else {
        toast({
          title: 'No Match',
          description: `No item found with code: ${code}`,
          variant: 'destructive',
        });
      }
    } else if (scanMode === 'add') {
      setNewItem((prev) => ({ ...prev, barcode: code }));
      toast({ title: 'Code Scanned', description: `Barcode set to: ${code}` });
    } else if (scanMode === 'checkout') {
      setCheckoutData((prev) => ({ ...prev, tracking_code: code }));
      toast({ title: 'Code Scanned', description: `Tracking code set to: ${code}` });
    }
    setIsScannerOpen(false);
  };

  const openScanner = (mode: 'search' | 'add' | 'checkout') => {
    setScanMode(mode);
    setIsScannerOpen(true);
  };

  const lowStockItems = items?.filter(item => 
    item.reorder_threshold && item.available_quantity <= item.reorder_threshold
  ) || [];

  return (
    <DashboardLayout title="Equipment Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Equipment Inventory</h1>
            <p className="text-muted-foreground">Track and manage equipment handouts</p>
          </div>
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Equipment Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., Football Jersey"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input
                      value={newItem.sku}
                      onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                      placeholder="Internal ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Barcode/QR</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newItem.barcode}
                        onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                        placeholder="Scan code"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openScanner('add')}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newItem.total_quantity}
                      onChange={(e) => setNewItem({ ...newItem, total_quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.unit_cost}
                      onChange={(e) => setNewItem({ ...newItem, unit_cost: e.target.value })}
                      placeholder="$0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => addItemMutation.mutate()}
                  disabled={!newItem.name || addItemMutation.isPending}
                >
                  {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{items?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <ArrowRightLeft className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{checkouts?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Checked Out</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {items?.reduce((sum, i) => sum + i.available_quantity, 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lowStockItems.length}</p>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="checkouts" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Checked Out
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Equipment Items</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, SKU, or barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" onClick={() => openScanner('search')}>
                      <Camera className="mr-2 h-4 w-4" />
                      Scan
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : items?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No equipment items yet</p>
                    <p className="text-sm">Add your first item to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                            {item.barcode && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <QrCode className="h-3 w-3" />
                                {item.barcode}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.sku || '-'}</TableCell>
                          <TableCell>
                            <span className={item.reorder_threshold && item.available_quantity <= item.reorder_threshold ? 'text-red-600 font-medium' : ''}>
                              {item.available_quantity}
                            </span>
                          </TableCell>
                          <TableCell>{item.total_quantity}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => handleCheckout(item.id)}
                              disabled={item.available_quantity <= 0}
                            >
                              Check Out
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkouts">
            <Card>
              <CardHeader>
                <CardTitle>Currently Checked Out</CardTitle>
                <CardDescription>Equipment currently with athletes or staff</CardDescription>
              </CardHeader>
              <CardContent>
                {checkoutsLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : checkouts?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No items currently checked out</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Checked Out</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkouts?.map((checkout) => (
                        <TableRow key={checkout.id}>
                          <TableCell>
                            <div className="font-medium">{checkout.equipment_items?.name}</div>
                            {checkout.tracking_code && (
                              <div className="text-xs text-muted-foreground">{checkout.tracking_code}</div>
                            )}
                          </TableCell>
                          <TableCell>{checkout.quantity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {new Date(checkout.checkout_date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {TRACKING_METHODS.find(t => t.value === checkout.tracking_method)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{checkout.condition_on_checkout}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => returnMutation.mutate({ 
                                checkoutId: checkout.id, 
                                condition: checkout.condition_on_checkout 
                              })}
                              disabled={returnMutation.isPending}
                            >
                              Return
                            </Button>
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

        {/* Checkout Dialog */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check Out Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient *</Label>
                <Select
                  value={checkoutData.user_id}
                  onValueChange={(value) => setCheckoutData({ ...checkoutData, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team (Optional)</Label>
                <Select
                  value={checkoutData.team_id}
                  onValueChange={(value) => setCheckoutData({ ...checkoutData, team_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={checkoutData.quantity}
                    onChange={(e) => setCheckoutData({ ...checkoutData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tracking Method</Label>
                  <Select
                    value={checkoutData.tracking_method}
                    onValueChange={(value) => setCheckoutData({ ...checkoutData, tracking_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACKING_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {checkoutData.tracking_method !== 'manual' && (
                <div className="space-y-2">
                  <Label>Tracking Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={checkoutData.tracking_code}
                      onChange={(e) => setCheckoutData({ ...checkoutData, tracking_code: e.target.value })}
                      placeholder="Scan or enter code..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => openScanner('checkout')}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={checkoutData.condition}
                    onValueChange={(value) => setCheckoutData({ ...checkoutData, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((cond) => (
                        <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected Return</Label>
                  <Input
                    type="date"
                    value={checkoutData.expected_return_date}
                    onChange={(e) => setCheckoutData({ ...checkoutData, expected_return_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={checkoutData.notes}
                  onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => checkoutMutation.mutate()}
                disabled={!checkoutData.user_id || checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? 'Processing...' : 'Check Out'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR/Barcode Scanner */}
        <QRScanner
          open={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={handleScanResult}
          title={
            scanMode === 'search'
              ? 'Scan to Search'
              : scanMode === 'add'
              ? 'Scan Barcode for Item'
              : 'Scan Tracking Code'
          }
        />
      </div>
    </DashboardLayout>
  );
}
