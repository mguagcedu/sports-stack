import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Camera, Package, Plus, Check, ChevronRight } from 'lucide-react';
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
    total_quantity: string;
    reorder_threshold: string;
  }) => void;
  onScanBarcode: () => void;
  isPending?: boolean;
}

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
  
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'uniforms',
    subcategory: '',
    sku: '',
    barcode: '',
    unit_cost: '',
    total_quantity: '1',
    reorder_threshold: '',
  });

  const handleSelectPreset = (preset: EquipmentPreset) => {
    setSelectedPreset(preset);
    setNewItem({
      ...newItem,
      name: preset.name,
      description: preset.description || '',
      category: preset.category,
      subcategory: preset.subcategory,
    });
    setShowCustomForm(true);
  };

  const handleAddCustom = () => {
    setSelectedPreset(null);
    setNewItem({
      name: '',
      description: '',
      category: selectedCategory,
      subcategory: '',
      sku: '',
      barcode: '',
      unit_cost: '',
      total_quantity: '1',
      reorder_threshold: '',
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
      total_quantity: '1',
      reorder_threshold: '',
    });
    onOpenChange(false);
  };

  const presetsForCategory = EQUIPMENT_PRESETS.filter(p => p.category === selectedCategory);
  const subcategories = getSubcategories(newItem.category);

  if (showCustomForm) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
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

            <div className="grid grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label>Low Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.reorder_threshold}
                  onChange={(e) => setNewItem({ ...newItem, reorder_threshold: e.target.value })}
                  placeholder="Alert at"
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

// Export a function to update barcode from external scanner
export function useExternalBarcodeInput(setNewItem: React.Dispatch<React.SetStateAction<any>>) {
  // This can be extended to listen for keyboard input from scan guns
  // Scan guns typically act as keyboard input, sending the barcode followed by Enter
}
