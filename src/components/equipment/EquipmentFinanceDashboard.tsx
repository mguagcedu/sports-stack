import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Package, ArrowRightLeft, Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import { getCategoryLabel } from '@/lib/equipmentPresets';

export function EquipmentFinanceDashboard() {
  // Fetch equipment items with costs
  const { data: items } = useQuery({
    queryKey: ['equipment-items-finance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_items')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch refurbishment costs
  const { data: refurbishments } = useQuery({
    queryKey: ['equipment-refurbishment-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_refurbishment')
        .select('cost, refurb_type');
      if (error) throw error;
      return data;
    },
  });

  // Fetch current checkouts
  const { data: checkouts } = useQuery({
    queryKey: ['equipment-checkouts-finance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_checkouts')
        .select('*, equipment_items(retail_price, our_cost, assigned_value)')
        .eq('status', 'checked_out');
      if (error) throw error;
      return data;
    },
  });

  // Calculate totals
  const totalRetailValue = items?.reduce((sum, item) => 
    sum + (Number(item.retail_price || 0) * item.total_quantity), 0) || 0;
  
  const totalCostToUs = items?.reduce((sum, item) => 
    sum + (Number(item.our_cost || 0) * item.total_quantity), 0) || 0;
  
  const totalAssignedValue = items?.reduce((sum, item) => 
    sum + (Number(item.assigned_value || item.our_cost || 0) * item.total_quantity), 0) || 0;

  const itemsCheckedOutCount = checkouts?.reduce((sum, c) => sum + c.quantity, 0) || 0;
  
  const checkedOutValue = checkouts?.reduce((sum, checkout) => {
    const itemValue = Number(checkout.equipment_items?.assigned_value || 
                            checkout.equipment_items?.our_cost || 0);
    return sum + (itemValue * checkout.quantity);
  }, 0) || 0;

  const refurbCosts = refurbishments?.reduce((sum, r) => sum + Number(r.cost || 0), 0) || 0;

  // Group by category for breakdown
  const categoryBreakdown = items?.reduce((acc, item) => {
    const cat = item.category || 'unknown';
    if (!acc[cat]) {
      acc[cat] = { count: 0, retail: 0, cost: 0, available: 0 };
    }
    acc[cat].count += item.total_quantity;
    acc[cat].retail += Number(item.retail_price || 0) * item.total_quantity;
    acc[cat].cost += Number(item.our_cost || 0) * item.total_quantity;
    acc[cat].available += item.available_quantity;
    return acc;
  }, {} as Record<string, { count: number; retail: number; cost: number; available: number }>);

  return (
    <div className="space-y-6">
      {/* Financial Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalRetailValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Retail Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <TrendingDown className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalCostToUs.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Cost to Us</p>
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
                <p className="text-2xl font-bold">${checkedOutValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Value Checked Out ({itemsCheckedOutCount} items)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Wrench className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${refurbCosts.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Refurbishment Costs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Value Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle>Value Comparison</CardTitle>
          <CardDescription>Retail vs Cost breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Savings from Retail</p>
                <p className="text-sm text-muted-foreground">Difference between retail and our cost</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  ${(totalRetailValue - totalCostToUs).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalRetailValue > 0 ? Math.round(((totalRetailValue - totalCostToUs) / totalRetailValue) * 100) : 0}% saved
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Available Inventory Value</p>
                <p className="text-sm text-muted-foreground">Value of items not checked out</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ${(totalAssignedValue - checkedOutValue).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Inventory value by equipment category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Retail Value</TableHead>
                <TableHead className="text-right">Our Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryBreakdown && Object.entries(categoryBreakdown).map(([category, data]) => (
                <TableRow key={category}>
                  <TableCell>
                    <Badge variant="secondary">{getCategoryLabel(category)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{data.count}</TableCell>
                  <TableCell className="text-right">{data.available}</TableCell>
                  <TableCell className="text-right">${data.retail.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${data.cost.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
