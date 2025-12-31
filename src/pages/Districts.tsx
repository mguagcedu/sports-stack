import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Building2, MapPin, Phone, Globe, Loader2, ChevronRight, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "District of Columbia" }
];

export default function Districts() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const { data, isLoading, error } = useQuery({
    queryKey: ['districts', searchQuery, stateFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('districts')
        .select('*, schools(count)', { count: 'exact' });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,nces_id.ilike.%${searchQuery}%`);
      }

      if (stateFilter && stateFilter !== "all") {
        query = query.eq('state', stateFilter);
      }

      query = query
        .order('name')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      
      // Transform to include school count
      const districtsWithCount = data?.map((d: any) => ({
        ...d,
        school_count: d.schools?.[0]?.count || 0
      })) || [];
      
      return { districts: districtsWithCount, total: count || 0 };
    }
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Districts</h1>
          <p className="text-muted-foreground">
            Browse and search {data?.total?.toLocaleString() || '—'} school districts nationwide
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, city, or NCES ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setPage(0); }}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {US_STATES.map(state => (
                    <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>School Districts</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `Showing ${data?.districts?.length || 0} of ${data?.total?.toLocaleString() || 0} districts`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Error loading districts. Please try again.
              </div>
            ) : data?.districts?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No districts found. {!data?.total && "Import district data from the Import Data page."}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>District Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Grades</TableHead>
                        <TableHead className="text-right">Schools</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.districts?.map((district: any) => (
                        <TableRow 
                          key={district.id} 
                          className="cursor-pointer hover:bg-primary/5 transition-colors group"
                          onClick={() => navigate(`/schools?district=${district.id}`)}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                                {district.name}
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                NCES: {district.nces_id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {district.city}, {district.state}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {district.charter_lea === 'CHRTRDIST' ? 'Charter' : 'Public'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {district.lowest_grade} - {district.highest_grade}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant={district.school_count > 0 ? "default" : "outline"} 
                                    className="font-mono cursor-help"
                                  >
                                    <GraduationCap className="h-3 w-3 mr-1" />
                                    {district.school_count}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold">{district.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {district.city}, {district.state}
                                    </p>
                                    {district.phone && (
                                      <p className="text-xs flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {district.phone}
                                      </p>
                                    )}
                                    {district.website && (
                                      <p className="text-xs flex items-center gap-1">
                                        <Globe className="h-3 w-3" /> {district.website}
                                      </p>
                                    )}
                                    <p className="text-xs text-primary pt-1">
                                      Click to view {district.school_count} school{district.school_count !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
