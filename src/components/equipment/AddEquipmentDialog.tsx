import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Camera, Package, Plus, ChevronRight, QrCode, Barcode } from 'lucide-react';
import { 
  EQUIPMENT_CATEGORIES, 
  EQUIPMENT_PRESETS,
  getSubcategories,
  getCategoryLabel,
  EquipmentPreset 
} from '@/lib/equipmentPresets';

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: {
    name: string;
    description: string;
    category: string;
    subcategory: string;
    sku: string;
    barcode: string;
    unit_cost: string;
    our_cost: string;
    retail_price: string;
    assigned_value: string;
    total_quantity: string;
    reorder_threshold: string;
    code_type: string;
    is_returnable: boolean;
    non_returnable_reason: string;
    received_date: string;
    recertification_interval_months: string;
  }) => void;
  onScanBarcode: () => void;
  isPending?: boolean;
}

const CODE_TYPES = [
  { value: 'qr', label: 'QR Code', icon: QrCode },
  { value: 'code128', label: 'Barcode (Code 128)', icon: Barcode },
  { value: 'code39', label: 'Barcode (Code 39)', icon: Barcode },
];

// Generate auto-SKU based on category
const generateSKU = (category: string, subcategory: string) => {
  const catPrefix = category.substring(0, 3).toUpperCase();
  const subPrefix = subcategory ? subcategory.substring(0, 2).toUpperCase() : 'XX';
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${catPrefix}-${subPrefix}-${timestamp}${random}`;
};

export function AddEquipmentDialog({ 
  open, 
  onOpenChange, 
  onAdd,
  onScanBarcode,
  isPending 
}: AddEquipmentDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<EquipmentPreset | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('uniforms');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [autoGenerateSKU, setAutoGenerateSKU] = useState(true);
  
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'uniforms',
    subcategory: '',
    sku: '',
    barcode: '',
    unit_cost: '',
    our_cost: '',
    retail_price: '',
    assigned_value: '',
    total_quantity: '1',
    reorder_threshold: '',
    code_type: 'qr',
    is_returnable: true,
    non_returnable_reason: '',
    received_date: new Date().toISOString().split('T')[0],
    recertification_interval_months: '',
  });

  // Auto-generate SKU when category/subcategory changes
  useEffect(() => {
    if (autoGenerateSKU && showCustomForm) {
      setNewItem(prev => ({
        ...prev,
        sku: generateSKU(prev.category, prev.subcategory)
      }));
    }
  }, [newItem.category, newItem.subcategory, autoGenerateSKU, showCustomForm]);

  const handleSelectPreset = (preset: EquipmentPreset) => {
    setSelectedPreset(preset);
    const autoSKU = generateSKU(preset.category, preset.subcategory);
    setNewItem({
      ...newItem,
      name: preset.name,
      description: preset.description || '',
      category: preset.category,
      subcategory: preset.subcategory,
      sku: autoGenerateSKU ? autoSKU : '',
    });
    setShowCustomForm(true);
  };

  const handleAddCustom = () => {
    setSelectedPreset(null);
    const autoSKU = generateSKU(selectedCategory, '');
    setNewItem({
      name: '',
      description: '',
      category: selectedCategory,
      subcategory: '',
      sku: autoGenerateSKU ? autoSKU : '',
      barcode: '',
      unit_cost: '',
      our_cost: '',
      retail_price: '',
      assigned_value: '',
      total_quantity: '1',
      reorder_threshold: '',
      code_type: 'qr',
      is_returnable: true,
      non_returnable_reason: '',
      received_date: new Date().toISOString().split('T')[0],
      recertification_interval_months: '',
    });
    setShowCustomForm(true);
  };

  const handleSubmit = () => {
    onAdd(newItem);
  };

  const handleBack = () => {
    setShowCustomForm(false);
    setSelectedPreset(null);
  };

  const handleClose = () => {
    setShowCustomForm(false);
    setSelectedPreset(null);
    setNewItem({
      name: '',
      description: '',
      category: 'uniforms',
      subcategory: '',
      sku: '',
      barcode: '',
      unit_cost: '',
      our_cost: '',
      retail_price: '',
      assigned_value: '',
      total_quantity: '1',
      reorder_threshold: '',
      code_type: 'qr',
      is_returnable: true,
      non_returnable_reason: '',
      received_date: new Date().toISOString().split('T')[0],
      recertification_interval_months: '',
    });
    onOpenChange(false);
  };

  const presetsForCategory = EQUIPMENT_PRESETS.filter(p => p.category === selectedCategory);
  const subcategories = getSubcategories(newItem.category);

  if (showCustomForm) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPreset && (
                <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2 -ml-2">
                  ← Back
                </Button>
              )}
              {selectedPreset ? 'Add ' + selectedPreset.name : 'Add Custom Equipment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g., Football Jersey"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newItem.category}
                  onValueChange={(value) => setNewItem({ ...newItem, category: value, subcategory: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select
                  value={newItem.subcategory}
                  onValueChange={(value) => setNewItem({ ...newItem, subcategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SKU and Barcode */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>SKU / Internal ID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Auto</span>
                    <Switch 
                      checked={autoGenerateSKU} 
                      onCheckedChange={(checked) => {
                        setAutoGenerateSKU(checked);
                        if (checked) {
                          setNewItem(prev => ({
                            ...prev,
                            sku: generateSKU(prev.category, prev.subcategory)
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                <Input
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  placeholder="Auto-generated"
                  disabled={autoGenerateSKU}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Barcode Value</Label>
                <div className="flex gap-2">
                  <Input
                    value={newItem.barcode}
                    onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                    placeholder="Scan or enter"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onScanBarcode}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Code Type Selection */}
            <div className="space-y-2">
              <Label>Label/Code Type</Label>
              <div className="flex gap-2">
                {CODE_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={newItem.code_type === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewItem({ ...newItem, code_type: type.value })}
                    className="flex-1"
                  >
                    <type.icon className="h-4 w-4 mr-1" />
                    {type.label.split(' ')[0]}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select the code type for labels/scanning. QR codes work best for mobile scanning.
              </p>
            </div>

            {/* Quantity and Costs */}
            <div className="grid grid-cols-4 gap-3">
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
                <Label>Our Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.our_cost}
                  onChange={(e) => setNewItem({ ...newItem, our_cost: e.target.value })}
                  placeholder="$0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Retail Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.retail_price}
                  onChange={(e) => setNewItem({ ...newItem, retail_price: e.target.value })}
                  placeholder="$0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Low Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.reorder_threshold}
                  onChange={(e) => setNewItem({ ...newItem, reorder_threshold: e.target.value })}
                  placeholder="Alert"
                />
              </div>
            </div>

            {/* Received Date and Recertification */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Received Date</Label>
                <Input
                  type="date"
                  value={newItem.received_date}
                  onChange={(e) => setNewItem({ ...newItem, received_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Recertification Interval</Label>
                <Select
                  value={newItem.recertification_interval_months}
                  onValueChange={(value) => setNewItem({ ...newItem, recertification_interval_months: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Not required" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not required</SelectItem>
                    <SelectItem value="6">Every 6 months</SelectItem>
                    <SelectItem value="12">Annually</SelectItem>
                    <SelectItem value="24">Every 2 years</SelectItem>
                    <SelectItem value="36">Every 3 years</SelectItem>
                    <SelectItem value="60">Every 5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Returnable Toggle */}
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Returnable Item</Label>
                  <p className="text-xs text-muted-foreground">
                    Turn off for items given to players (e.g., game socks)
                  </p>
                </div>
                <Switch 
                  checked={newItem.is_returnable} 
                  onCheckedChange={(checked) => setNewItem({ ...newItem, is_returnable: checked })}
                />
              </div>
              {!newItem.is_returnable && (
                <div className="space-y-2">
                  <Label>Reason (for financial reports)</Label>
                  <Select
                    value={newItem.non_returnable_reason}
                    onValueChange={(value) => setNewItem({ ...newItem, non_returnable_reason: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="given_to_player">Given to player after season</SelectItem>
                      <SelectItem value="consumable">Consumable item</SelectItem>
                      <SelectItem value="hygiene">Hygiene/sanitary reasons</SelectItem>
                      <SelectItem value="personalized">Personalized/custom item</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This item will be tracked as an expense and not expected back.
                  </p>
                </div>
              )}
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
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button 
              onClick={handleSubmit}
              disabled={!newItem.name || isPending}
            >
              {isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Equipment
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value}
                className="text-xs px-2 py-1.5"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {EQUIPMENT_CATEGORIES.map((cat) => (
            <TabsContent key={cat.value} value={cat.value} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {/* Preset Items */}
                  {presetsForCategory.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground font-medium px-1">
                        Quick Add - {getCategoryLabel(cat.value)}
                      </p>
                      <div className="grid gap-2">
                        {presetsForCategory.map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectPreset(preset)}
                            className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <Package className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{preset.name}</p>
                                {preset.description && (
                                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Custom Divider */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  {/* Add New Custom Item */}
                  <button
                    onClick={handleAddCustom}
                    className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Add Custom Item</p>
                        <p className="text-sm text-muted-foreground">
                          Create a new {getCategoryLabel(cat.value).toLowerCase()} item
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
