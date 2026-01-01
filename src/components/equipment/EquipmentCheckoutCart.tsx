import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  User, 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  Camera,
  Check,
  CheckCircle2,
  AlertCircle,
  Scan
} from 'lucide-react';

interface CartItem {
  id: string;
  equipment_item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  size_id?: string;
  size_label?: string;
  tracking_code?: string;
  condition: string;
  available_quantity: number;
}

interface EquipmentCheckoutCartProps {
  open: boolean;
  onClose: () => void;
  onScanBarcode: () => void;
  preselectedRecipient?: { id: string; name: string };
}

export function EquipmentCheckoutCart({ 
  open, 
  onClose, 
  onScanBarcode,
  preselectedRecipient 
}: EquipmentCheckoutCartProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'select-recipient' | 'add-items' | 'review'>('select-recipient');
  const [recipientId, setRecipientId] = useState<string>(preselectedRecipient?.id || '');
  const [recipientName, setRecipientName] = useState<string>(preselectedRecipient?.name || '');
  const [teamId, setTeamId] = useState<string>('');
  const [teamMemberId, setTeamMemberId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users/athletes
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
        .select('id, name, level, sport_key')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch team members for selected team
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          jersey_number,
          position
        `)
        .eq('team_id', teamId)
        .eq('role', 'athlete');
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  // Fetch equipment items
  const { data: items } = useQuery({
    queryKey: ['equipment-items-for-cart', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('equipment_items')
        .select('*')
        .eq('is_active', true)
        .gt('available_quantity', 0)
        .order('name');
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch equipment packages
  const { data: packages } = useQuery({
    queryKey: ['equipment-packages', teamId],
    queryFn: async () => {
      const team = teams?.find(t => t.id === teamId);
      let query = supabase
        .from('equipment_packages')
        .select('*')
        .eq('is_active', true);
      
      if (team?.sport_key) {
        query = query.eq('sport_code', team.sport_key);
      }
      if (team?.level) {
        query = query.eq('team_level', team.level);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  // Fetch package items
  const { data: packageItems } = useQuery({
    queryKey: ['package-items', selectedPackageId],
    queryFn: async () => {
      if (!selectedPackageId) return [];
      const { data, error } = await supabase
        .from('equipment_package_items')
        .select('*')
        .eq('package_id', selectedPackageId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPackageId,
  });

  // Load package items into cart
  useEffect(() => {
    if (packageItems && packageItems.length > 0 && items) {
      const newCartItems: CartItem[] = packageItems.map((pi, idx) => {
        // Try to find matching equipment item
        const matchingItem = items.find(item => 
          item.name.toLowerCase().includes(pi.item_name.toLowerCase()) ||
          item.category === pi.category
        );
        
        return {
          id: `pkg-${idx}-${pi.id}`,
          equipment_item_id: matchingItem?.id || '',
          item_name: pi.item_name,
          category: pi.category,
          quantity: pi.quantity,
          condition: 'good',
          available_quantity: matchingItem?.available_quantity || 0,
        };
      });
      setCart(newCartItems);
    }
  }, [packageItems, items]);

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const sessionId = crypto.randomUUID();

      // Create checkouts for each cart item
      for (const item of cart) {
        if (!item.equipment_item_id) continue;

        const { error } = await supabase
          .from('equipment_checkouts')
          .insert({
            equipment_item_id: item.equipment_item_id,
            user_id: recipientId,
            team_id: teamId || null,
            team_member_id: teamMemberId || null,
            checked_out_by_user_id: user.id,
            quantity: item.quantity,
            tracking_method: item.tracking_code ? 'barcode' : 'manual',
            tracking_code: item.tracking_code || null,
            condition_on_checkout: item.condition,
            size_id: item.size_id || null,
          });
        if (error) throw error;

        // Update available quantity
        await supabase
          .from('equipment_items')
          .update({ 
            available_quantity: item.available_quantity - item.quantity 
          })
          .eq('id', item.equipment_item_id);
      }

      // Create issuance record
      const { error: issuanceError } = await supabase
        .from('equipment_issuance')
        .insert({
          user_id: recipientId,
          team_member_id: teamMemberId || null,
          team_id: teamId || null,
          package_id: selectedPackageId || null,
          status: 'complete',
          issued_by_user_id: user.id,
          issued_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
      if (issuanceError) throw issuanceError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-items'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-checkouts'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-issuances'] });
      toast({ title: 'Equipment issued successfully', description: `${cart.length} items checked out to ${recipientName}` });
      handleClose();
    },
    onError: (error) => {
      toast({ title: 'Error issuing equipment', description: error.message, variant: 'destructive' });
    },
  });

  const handleClose = () => {
    setStep('select-recipient');
    setRecipientId('');
    setRecipientName('');
    setTeamId('');
    setTeamMemberId('');
    setCart([]);
    setSelectedPackageId('');
    setSearchQuery('');
    onClose();
  };

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.equipment_item_id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.equipment_item_id === item.id 
          ? { ...c, quantity: Math.min(c.quantity + 1, item.available_quantity) }
          : c
      ));
    } else {
      setCart([...cart, {
        id: `item-${item.id}`,
        equipment_item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: 1,
        condition: 'good',
        available_quantity: item.available_quantity,
      }]);
    }
  };

  const updateCartQuantity = (cartId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === cartId) {
        const newQty = Math.max(1, Math.min(c.quantity + delta, c.available_quantity));
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(c => c.id !== cartId));
  };

  const selectRecipient = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    setRecipientId(userId);
    setRecipientName(user ? `${user.first_name} ${user.last_name}` : '');
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cart.reduce((sum, item) => {
    const equipmentItem = items?.find(i => i.id === item.equipment_item_id);
    return sum + (item.quantity * (equipmentItem?.assigned_value || equipmentItem?.retail_price || 0));
  }, 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Equipment Checkout
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalItems} items
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className={`flex items-center gap-2 ${step === 'select-recipient' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'select-recipient' ? 'bg-primary text-primary-foreground' : 
              recipientId ? 'bg-green-500 text-white' : 'bg-muted'
            }`}>
              {recipientId && step !== 'select-recipient' ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className="text-sm font-medium">Select Athlete</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-2 ${step === 'add-items' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'add-items' ? 'bg-primary text-primary-foreground' : 
              cart.length > 0 ? 'bg-green-500 text-white' : 'bg-muted'
            }`}>
              {cart.length > 0 && step === 'review' ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <span className="text-sm font-medium">Add Items</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-2 ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              3
            </div>
            <span className="text-sm font-medium">Review & Confirm</span>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
          {/* Step 1: Select Recipient */}
          {step === 'select-recipient' && (
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label>Team (Optional - for package templates)</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} {team.level && `(${team.level})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Athlete / Recipient *</Label>
                <Select value={recipientId} onValueChange={selectRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person..." />
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

              {teamId && teamMembers && teamMembers.length > 0 && (
                <div className="space-y-2">
                  <Label>Team Member (for roster tracking)</Label>
                  <Select value={teamMemberId} onValueChange={setTeamMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Link to team roster..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((tm) => {
                        const user = users?.find(u => u.id === tm.user_id);
                        return (
                          <SelectItem key={tm.id} value={tm.id}>
                            #{tm.jersey_number || '?'} - {user?.first_name} {user?.last_name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {packages && packages.length > 0 && (
                <div className="space-y-2">
                  <Label>Use Equipment Package (Optional)</Label>
                  <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a package template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} {pkg.team_level && `(${pkg.team_level})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Packages pre-fill the cart with standard equipment for the selected level
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Add Items */}
          {step === 'add-items' && (
            <div className="grid grid-cols-2 gap-4 p-4">
              {/* Available Items */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={onScanBarcode}>
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {items?.map((item) => (
                      <Card 
                        key={item.id} 
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => addToCart(item)}
                      >
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.category} • {item.available_quantity} available
                            </p>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Cart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Cart for {recipientName}
                  </h3>
                  {cart.length > 0 && (
                    <Badge>{totalItems} items</Badge>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
                      <p>No items in cart</p>
                      <p className="text-sm">Click items to add them</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.item_name}</p>
                                <p className="text-xs text-muted-foreground">{item.category}</p>
                                {!item.equipment_item_id && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Select from inventory
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className="h-7 w-7"
                                  onClick={() => updateCartQuantity(item.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm">{item.quantity}</span>
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className="h-7 w-7"
                                  onClick={() => updateCartQuantity(item.id, 1)}
                                  disabled={item.quantity >= item.available_quantity}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 'review' && (
            <div className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Issuing to: {recipientName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamId && (
                    <p className="text-sm text-muted-foreground">
                      Team: {teams?.find(t => t.id === teamId)?.name}
                    </p>
                  )}
                  {selectedPackageId && (
                    <p className="text-sm text-muted-foreground">
                      Package: {packages?.find(p => p.id === selectedPackageId)?.name}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Equipment Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className={`h-5 w-5 ${item.equipment_item_id ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium text-sm">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} • Condition: {item.condition}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {item.tracking_code ? (
                            <Badge variant="outline" className="text-xs">
                              <Scan className="h-3 w-3 mr-1" />
                              {item.tracking_code}
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={onScanBarcode}
                            >
                              <Camera className="h-4 w-4 mr-1" />
                              Scan
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between">
                    <span className="font-medium">Total Items:</span>
                    <span className="font-bold">{totalItems}</span>
                  </div>
                  {totalValue > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Estimated Value:</span>
                      <span>${totalValue.toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <div>
            {step !== 'select-recipient' && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step === 'review' ? 'add-items' : 'select-recipient')}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            {step === 'select-recipient' && (
              <Button 
                onClick={() => setStep('add-items')}
                disabled={!recipientId}
              >
                Continue
              </Button>
            )}
            {step === 'add-items' && (
              <Button 
                onClick={() => setStep('review')}
                disabled={cart.length === 0}
              >
                Review ({totalItems} items)
              </Button>
            )}
            {step === 'review' && (
              <Button 
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending || cart.filter(c => c.equipment_item_id).length === 0}
              >
                {checkoutMutation.isPending ? 'Processing...' : 'Confirm Checkout'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
