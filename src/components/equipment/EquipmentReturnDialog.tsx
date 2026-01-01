import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Droplets, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';

interface EquipmentReturnDialogProps {
  open: boolean;
  onClose: () => void;
  onReturn: (data: ReturnData) => void;
  itemName?: string;
  checkoutCondition?: string;
  isPending?: boolean;
}

interface ReturnData {
  condition: string;
  return_notes: string;
  reusable: boolean;
  needs_refurbishment: boolean;
  wash_required: boolean;
}

const CONDITIONS = [
  { value: 'new', label: 'New', description: 'Unused, like new' },
  { value: 'good', label: 'Good', description: 'Minor wear, fully functional' },
  { value: 'fair', label: 'Fair', description: 'Noticeable wear, still usable' },
  { value: 'worn', label: 'Worn', description: 'Heavy wear, may need attention' },
  { value: 'damaged', label: 'Damaged', description: 'Needs repair or replacement' },
];

export function EquipmentReturnDialog({ 
  open, 
  onClose, 
  onReturn, 
  itemName,
  checkoutCondition,
  isPending 
}: EquipmentReturnDialogProps) {
  const [returnData, setReturnData] = useState<ReturnData>({
    condition: checkoutCondition || 'good',
    return_notes: '',
    reusable: true,
    needs_refurbishment: false,
    wash_required: true,
  });

  const handleSubmit = () => {
    onReturn(returnData);
  };

  const conditionChanged = returnData.condition !== checkoutCondition;
  const conditionWorsened = CONDITIONS.findIndex(c => c.value === returnData.condition) > 
                            CONDITIONS.findIndex(c => c.value === checkoutCondition);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Return Equipment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {itemName && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{itemName}</p>
              {checkoutCondition && (
                <p className="text-sm text-muted-foreground">
                  Checked out condition: <Badge variant="outline">{checkoutCondition}</Badge>
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Return Condition *</Label>
            <Select
              value={returnData.condition}
              onValueChange={(value) => setReturnData({ ...returnData, condition: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((cond) => (
                  <SelectItem key={cond.value} value={cond.value}>
                    <div className="flex flex-col">
                      <span>{cond.label}</span>
                      <span className="text-xs text-muted-foreground">{cond.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {conditionWorsened && (
              <p className="text-sm text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Condition is worse than checkout
              </p>
            )}
          </div>

          <div className="space-y-4 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <Label htmlFor="wash">Requires Washing</Label>
              </div>
              <Switch
                id="wash"
                checked={returnData.wash_required}
                onCheckedChange={(checked) => setReturnData({ ...returnData, wash_required: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Label htmlFor="reusable">Reusable</Label>
              </div>
              <Switch
                id="reusable"
                checked={returnData.reusable}
                onCheckedChange={(checked) => setReturnData({ ...returnData, reusable: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-yellow-500" />
                <Label htmlFor="refurb">Needs Refurbishment</Label>
              </div>
              <Switch
                id="refurb"
                checked={returnData.needs_refurbishment}
                onCheckedChange={(checked) => setReturnData({ ...returnData, needs_refurbishment: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Return Notes</Label>
            <Textarea
              value={returnData.return_notes}
              onChange={(e) => setReturnData({ ...returnData, return_notes: e.target.value })}
              placeholder="Any issues, damage, or notes about the returned item..."
              rows={3}
            />
          </div>

          {!returnData.reusable && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                This item will be marked as non-reusable and removed from available inventory
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Processing...' : 'Confirm Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
