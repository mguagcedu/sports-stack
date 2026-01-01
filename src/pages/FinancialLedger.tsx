import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package,
  Users,
  Ticket,
  ShoppingBag,
  Gift,
  PiggyBank,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

export default function FinancialLedger() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch teams for filter
  const { data: teams } = useQuery({
    queryKey: ['teams-for-finance'],
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

  // Fetch financial ledger entries
  const { data: ledgerEntries } = useQuery({
    queryKey: ['financial-ledger', selectedTeamId, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('financial_ledger')
        .select('*, teams(name)')
        .order('transaction_date', { ascending: false })
        .limit(100);
      
      if (selectedTeamId !== 'all') {
        query = query.eq('team_id', selectedTeamId);
      }
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch equipment financial data
  const { data: equipmentData } = useQuery({
    queryKey: ['equipment-finance-summary'],
    queryFn: async () => {
      const { data: items, error: itemsError } = await supabase
        .from('equipment_items')
        .select('retail_price, our_cost, total_quantity, available_quantity');
      if (itemsError) throw itemsError;

      const { data: refurbs, error: refurbError } = await supabase
        .from('equipment_refurbishment')
        .select('cost');
      if (refurbError) throw refurbError;

      const totalRetailValue = items?.reduce((sum, i) => sum + (Number(i.retail_price || 0) * i.total_quantity), 0) || 0;
      const totalCost = items?.reduce((sum, i) => sum + (Number(i.our_cost || 0) * i.total_quantity), 0) || 0;
      const itemsOutValue = items?.reduce((sum, i) => sum + (Number(i.retail_price || 0) * (i.total_quantity - i.available_quantity)), 0) || 0;
      const refurbCosts = refurbs?.reduce((sum, r) => sum + Number(r.cost || 0), 0) || 0;

      return { totalRetailValue, totalCost, itemsOutValue, refurbCosts };
    },
  });

  // Fetch volunteer deposits
  const { data: depositData } = useQuery({
    queryKey: ['volunteer-deposits-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volunteer_fee_deposits')
        .select('amount, status');
      if (error) throw error;

      const held = data?.filter(d => d.status === 'held').reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const refunded = data?.filter(d => d.status === 'refunded').reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const forfeited = data?.filter(d => d.status === 'forfeited').reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      return { held, refunded, forfeited, total: data?.length || 0 };
    },
  });

  // Fetch payment/revenue data
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, payment_type, status')
        .eq('status', 'completed');
      if (error) throw error;

      const byType = data?.reduce((acc, p) => {
        acc[p.payment_type] = (acc[p.payment_type] || 0) + Number(p.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total: data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        registration: byType['registration'] || 0,
        fundraising: byType['fundraising'] || 0,
        donation: byType['donation'] || 0,
        ticketing: byType['ticketing'] || 0,
      };
    },
  });

  // Fetch concession summary
  const { data: concessionData } = useQuery({
    queryKey: ['concession-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concession_transactions')
        .select('transaction_type, total_amount');
      if (error) throw error;

      const sales = data?.filter(t => t.transaction_type === 'sale').reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
      const purchases = data?.filter(t => t.transaction_type === 'purchase').reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;

      return { sales, purchases, profit: sales - purchases };
    },
  });

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      equipment_purchase: 'bg-red-500/10 text-red-600',
      equipment_refurbishment: 'bg-orange-500/10 text-orange-600',
      concession_sale: 'bg-green-500/10 text-green-600',
      concession_purchase: 'bg-red-500/10 text-red-600',
      registration_fee: 'bg-blue-500/10 text-blue-600',
      volunteer_deposit: 'bg-purple-500/10 text-purple-600',
      fundraising: 'bg-emerald-500/10 text-emerald-600',
      donation: 'bg-pink-500/10 text-pink-600',
      ticket_sale: 'bg-cyan-500/10 text-cyan-600',
    };
    return (
      <Badge className={colors[category] || 'bg-muted'}>
        {category.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const totalIncome = (revenueData?.total || 0) + (concessionData?.sales || 0) + (depositData?.forfeited || 0);
  const totalExpenses = (equipmentData?.totalCost || 0) + (equipmentData?.refurbCosts || 0) + (concessionData?.purchases || 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <DashboardLayout title="Financial Ledger">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financial Ledger</h1>
            <p className="text-muted-foreground">Comprehensive financial tracking and reporting</p>
          </div>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalIncome.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${netBalance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <DollarSign className={`h-6 w-6 ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">${netBalance.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Net Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <PiggyBank className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${(depositData?.held || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Deposits Held</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="concessions">Concessions</TabsTrigger>
            <TabsTrigger value="ledger">Full Ledger</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Equipment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inventory Value</span>
                    <span className="font-medium">${(equipmentData?.totalRetailValue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost Basis</span>
                    <span className="font-medium">${(equipmentData?.totalCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items Out</span>
                    <span className="font-medium">${(equipmentData?.itemsOutValue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refurb Costs</span>
                    <span className="font-medium text-red-500">-${(equipmentData?.refurbCosts || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registrations</span>
                    <span className="font-medium text-green-500">${(revenueData?.registration || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fundraising</span>
                    <span className="font-medium text-green-500">${(revenueData?.fundraising || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Donations</span>
                    <span className="font-medium text-green-500">${(revenueData?.donation || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticketing</span>
                    <span className="font-medium text-green-500">${(revenueData?.ticketing || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Volunteer Deposits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Volunteer Deposits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currently Held</span>
                    <span className="font-medium">${(depositData?.held || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refunded</span>
                    <span className="font-medium text-green-500">${(depositData?.refunded || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forfeited (Income)</span>
                    <span className="font-medium text-blue-500">${(depositData?.forfeited || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Deposits</span>
                    <span className="font-medium">{depositData?.total || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Concessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Concessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sales</span>
                    <span className="font-medium text-green-500">${(concessionData?.sales || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchases</span>
                    <span className="font-medium text-red-500">-${(concessionData?.purchases || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground font-medium">Net Profit</span>
                    <span className={`font-bold ${(concessionData?.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${(concessionData?.profit || 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="equipment">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Financial Details</CardTitle>
                <CardDescription>Inventory values, costs, and depreciation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-3xl font-bold">${(equipmentData?.totalRetailValue || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Retail Value</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-3xl font-bold">${(equipmentData?.totalCost || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Our Cost</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-3xl font-bold">${(equipmentData?.itemsOutValue || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Value Checked Out</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-3xl font-bold text-red-500">-${(equipmentData?.refurbCosts || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Refurbishment Costs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>All income sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                    <p className="text-3xl font-bold text-blue-600">${(revenueData?.registration || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Registration Fees</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 text-center">
                    <p className="text-3xl font-bold text-green-600">${(revenueData?.fundraising || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Fundraising</p>
                  </div>
                  <div className="p-4 rounded-lg bg-pink-500/10 text-center">
                    <p className="text-3xl font-bold text-pink-600">${(revenueData?.donation || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Donations</p>
                  </div>
                  <div className="p-4 rounded-lg bg-cyan-500/10 text-center">
                    <p className="text-3xl font-bold text-cyan-600">${(revenueData?.ticketing || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Ticket Sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="concessions">
            <Card>
              <CardHeader>
                <CardTitle>Concession Financials</CardTitle>
                <CardDescription>Purchases, sales, and profit tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-green-500/10 text-center">
                    <p className="text-3xl font-bold text-green-600">${(concessionData?.sales || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 text-center">
                    <p className="text-3xl font-bold text-red-600">${(concessionData?.purchases || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Inventory Purchases</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                    <p className={`text-3xl font-bold ${(concessionData?.profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ${(concessionData?.profit || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transaction Ledger</CardTitle>
                    <CardDescription>All financial transactions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Teams" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {teams?.map((team) => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                        <SelectItem value="equipment_refurbishment">Equipment Refurb</SelectItem>
                        <SelectItem value="concession_sale">Concession Sale</SelectItem>
                        <SelectItem value="concession_purchase">Concession Purchase</SelectItem>
                        <SelectItem value="registration_fee">Registration Fee</SelectItem>
                        <SelectItem value="volunteer_deposit">Volunteer Deposit</SelectItem>
                        <SelectItem value="fundraising">Fundraising</SelectItem>
                        <SelectItem value="donation">Donation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No transactions recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerEntries?.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.transaction_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{getCategoryBadge(entry.category)}</TableCell>
                          <TableCell>{entry.description || '-'}</TableCell>
                          <TableCell>{entry.teams?.name || 'General'}</TableCell>
                          <TableCell className={`text-right font-medium ${entry.is_income ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.is_income ? '+' : '-'}${Number(entry.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}