import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  ArrowRightLeft, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar,
  Droplets,
  Wrench,
  Package
} from 'lucide-react';

interface EquipmentHistoryProps {
  open: boolean;
  onClose: () => void;
  itemId: string | null;
  itemName?: string;
}

type CheckoutWithRelations = {
  id: string;
  equipment_item_id: string;
  user_id: string;
  team_id: string | null;
  checkout_date: string;
  actual_return_date: string | null;
  status: string;
  quantity: number;
  condition_on_checkout: string | null;
  condition_on_return: string | null;
  tracking_method: string | null;
  tracking_code: string | null;
  notes: string | null;
  return_notes: string | null;
  reusable: boolean | null;
  needs_refurbishment: boolean | null;
  wash_required: boolean | null;
  washed_at: string | null;
  expected_return_date: string | null;
  checked_out_by_user_id: string;
  return_received_by_user_id: string | null;
};

export function EquipmentHistory({ open, onClose, itemId, itemName }: EquipmentHistoryProps) {
  // Fetch all checkouts for this item
  const { data: history, isLoading } = useQuery({
    queryKey: ['equipment-history', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      
      const { data, error } = await supabase
        .from('equipment_checkouts')
        .select('*')
        .eq('equipment_item_id', itemId)
        .order('checkout_date', { ascending: false });
      
      if (error) throw error;
      return data as CheckoutWithRelations[];
    },
    enabled: !!itemId,
  });

  // Fetch audit log for this item
  const { data: auditLog } = useQuery({
    queryKey: ['equipment-audit', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      
      const { data, error } = await supabase
        .from('equipment_audit_log')
        .select('*')
        .eq('equipment_item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_out': return 'bg-orange-500';
      case 'returned': return 'bg-green-500';
      case 'lost': return 'bg-red-500';
      case 'damaged': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  const getConditionBadge = (condition: string | null) => {
    if (!condition) return null;
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'default',
      good: 'secondary',
      fair: 'outline',
      worn: 'outline',
      damaged: 'destructive',
    };
    return (
      <Badge variant={variants[condition] || 'outline'}>
        {condition}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate statistics
  const stats = {
    totalCheckouts: history?.length || 0,
    currentlyOut: history?.filter(h => h.status === 'checked_out').length || 0,
    returned: history?.filter(h => h.status === 'returned').length || 0,
    damaged: history?.filter(h => h.condition_on_return === 'damaged').length || 0,
    needsRefurbishment: history?.filter(h => h.needs_refurbishment).length || 0,
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            History: {itemName || 'Equipment'}
          </DialogTitle>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="p-2 bg-muted rounded text-center">
            <div className="text-lg font-bold">{stats.totalCheckouts}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-2 bg-orange-500/10 rounded text-center">
            <div className="text-lg font-bold text-orange-600">{stats.currentlyOut}</div>
            <div className="text-xs text-muted-foreground">Out</div>
          </div>
          <div className="p-2 bg-green-500/10 rounded text-center">
            <div className="text-lg font-bold text-green-600">{stats.returned}</div>
            <div className="text-xs text-muted-foreground">Returned</div>
          </div>
          <div className="p-2 bg-red-500/10 rounded text-center">
            <div className="text-lg font-bold text-red-600">{stats.damaged}</div>
            <div className="text-xs text-muted-foreground">Damaged</div>
          </div>
          <div className="p-2 bg-yellow-500/10 rounded text-center">
            <div className="text-lg font-bold text-yellow-600">{stats.needsRefurbishment}</div>
            <div className="text-xs text-muted-foreground">Refurb</div>
          </div>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="text-center py-8">Loading history...</div>
          ) : history?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No checkout history for this item</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history?.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(record.status)}`} />
                      <span className="font-medium capitalize">{record.status.replace('_', ' ')}</span>
                      <Badge variant="outline">Qty: {record.quantity}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.tracking_code && (
                        <span className="font-mono">{record.tracking_code}</span>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <span>Checked out: {formatDate(record.checkout_date)}</span>
                    </div>
                    {record.actual_return_date && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Returned: {formatDate(record.actual_return_date)}</span>
                      </div>
                    )}
                    {record.expected_return_date && !record.actual_return_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {new Date(record.expected_return_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Condition */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Out:</span>
                      {getConditionBadge(record.condition_on_checkout)}
                    </div>
                    {record.condition_on_return && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Return:</span>
                        {getConditionBadge(record.condition_on_return)}
                      </div>
                    )}
                  </div>

                  {/* Status Flags */}
                  <div className="flex flex-wrap gap-2">
                    {record.wash_required && (
                      <Badge variant="outline" className="text-xs">
                        <Droplets className="h-3 w-3 mr-1" />
                        Wash Required
                      </Badge>
                    )}
                    {record.washed_at && (
                      <Badge variant="secondary" className="text-xs">
                        <Droplets className="h-3 w-3 mr-1" />
                        Washed: {new Date(record.washed_at).toLocaleDateString()}
                      </Badge>
                    )}
                    {record.needs_refurbishment && (
                      <Badge variant="destructive" className="text-xs">
                        <Wrench className="h-3 w-3 mr-1" />
                        Needs Refurbishment
                      </Badge>
                    )}
                    {record.reusable === false && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Reusable
                      </Badge>
                    )}
                  </div>

                  {/* Notes */}
                  {(record.notes || record.return_notes) && (
                    <div className="text-sm space-y-1">
                      {record.notes && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Checkout notes:</span> {record.notes}
                        </p>
                      )}
                      {record.return_notes && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Return notes:</span> {record.return_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Audit Log Section */}
          {auditLog && auditLog.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Audit Log
                </h4>
                {auditLog.map((log) => (
                  <div key={log.id} className="text-sm p-2 bg-muted/50 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{log.action_type}</Badge>
                      <span>{log.action_description}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
