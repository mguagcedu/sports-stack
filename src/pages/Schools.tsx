import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Search, Upload, Plus, MapPin, Phone, Globe, Loader2, GraduationCap, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const PAGE_SIZE = 50;

interface School {
  id: string;
  nces_id: string | null;
  name: string;
  level: string | null;
  school_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  operational_status: string | null;
}

export default function Schools() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);

  // Form state for adding a school
  const [newSchool, setNewSchool] = useState({
    name: '',
    level: '',
    school_type: 'public',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    website: '',
    nces_id: ''
  });

  // Get total count
  const { data: totalCount } = useQuery({
    queryKey: ['schools-count', searchQuery, stateFilter, levelFilter],
    queryFn: async () => {
      let query = supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      if (stateFilter) {
        query = query.eq('state', stateFilter);
      }
      if (levelFilter) {
        query = query.eq('level', levelFilter);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: schools, isLoading, refetch } = useQuery({
    queryKey: ['schools', searchQuery, stateFilter, levelFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('schools')
        .select('*')
        .order('name')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      if (stateFilter) {
        query = query.eq('state', stateFilter);
      }
      if (levelFilter) {
        query = query.eq('level', levelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as School[];
    }
  });

  const handleAddSchool = async () => {
    if (!newSchool.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'School name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('schools')
      .insert({
        name: newSchool.name.trim(),
        level: newSchool.level || null,
        school_type: newSchool.school_type || 'public',
        address: newSchool.address || null,
        city: newSchool.city || null,
        state: newSchool.state || null,
        zip: newSchool.zip || null,
        phone: newSchool.phone || null,
        website: newSchool.website || null,
        nces_id: newSchool.nces_id || null
      });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'School Added',
        description: `${newSchool.name} has been added to the database.`
      });
      setIsAddDialogOpen(false);
      setNewSchool({
        name: '',
        level: '',
        school_type: 'public',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        website: '',
        nces_id: ''
      });
      refetch();
    }
  };

  const openMaps = (school: School) => {
    if (school.latitude && school.longitude) {
      window.open(`https://www.google.com/maps?q=${school.latitude},${school.longitude}`, '_blank');
    } else if (school.address && school.city && school.state) {
      const address = encodeURIComponent(`${school.address}, ${school.city}, ${school.state} ${school.zip || ''}`);
      window.open(`https://www.google.com/maps/search/${address}`, '_blank');
    }
  };

  return (
    <DashboardLayout title="School Database">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">School Database</h1>
            <p className="text-muted-foreground">
              Search and manage the national K-12 school directory
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/import')}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add School
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New School</DialogTitle>
                  <DialogDescription>
                    Manually add a school to the database
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="name">School Name *</Label>
                      <Input
                        id="name"
                        value={newSchool.name}
                        onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                        placeholder="Lincoln High School"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">Level</Label>
                      <Select
                        value={newSchool.level}
                        onValueChange={(value) => setNewSchool({ ...newSchool, level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="elementary">Elementary</SelectItem>
                          <SelectItem value="middle">Middle School</SelectItem>
                          <SelectItem value="high">High School</SelectItem>
                          <SelectItem value="k12">K-12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={newSchool.school_type}
                        onValueChange={(value) => setNewSchool({ ...newSchool, school_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="charter">Charter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={newSchool.address}
                        onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newSchool.city}
                        onChange={(e) => setNewSchool({ ...newSchool, city: e.target.value })}
                        placeholder="Springfield"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Select
                          value={newSchool.state}
                          onValueChange={(value) => setNewSchool({ ...newSchool, state: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="State" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP</Label>
                        <Input
                          id="zip"
                          value={newSchool.zip}
                          onChange={(e) => setNewSchool({ ...newSchool, zip: e.target.value })}
                          placeholder="12345"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newSchool.phone}
                        onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={newSchool.website}
                        onChange={(e) => setNewSchool({ ...newSchool, website: e.target.value })}
                        placeholder="https://school.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nces_id">NCES ID</Label>
                      <Input
                        id="nces_id"
                        value={newSchool.nces_id}
                        onChange={(e) => setNewSchool({ ...newSchool, nces_id: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSchool} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add School
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={stateFilter || "all"} onValueChange={(value) => setStateFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter || "all"} onValueChange={(value) => setLevelFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="middle">Middle School</SelectItem>
                  <SelectItem value="high">High School</SelectItem>
                  <SelectItem value="k12">K-12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Schools Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Schools
            </CardTitle>
            <CardDescription>
              {totalCount !== undefined ? (
                <>
                  {totalCount.toLocaleString()} total schools
                  {totalCount > PAGE_SIZE && (
                    <span className="ml-1">
                      (showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)})
                    </span>
                  )}
                </>
              ) : (
                `${schools?.length || 0} schools found`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : schools && schools.length > 0 ? (
              <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell>
                          <div className="font-medium">{school.name}</div>
                          {school.nces_id && (
                            <div className="text-xs text-muted-foreground">
                              NCES: {school.nces_id}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {school.level && (
                            <Badge variant="outline" className="capitalize">
                              {school.level}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {school.school_type || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-1 text-muted-foreground shrink-0" />
                            <div className="text-sm">
                              {school.city && school.state 
                                ? `${school.city}, ${school.state}` 
                                : school.state || '-'}
                              {school.zip && <span className="text-muted-foreground"> {school.zip}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {school.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {school.phone}
                              </div>
                            )}
                            {school.website && (
                              <a 
                                href={school.website.startsWith('http') ? school.website : `https://${school.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <Globe className="h-3 w-3" />
                                Website
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMaps(school)}
                            disabled={!school.address && !school.latitude}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalCount !== undefined && totalCount > PAGE_SIZE && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {Math.ceil(totalCount / PAGE_SIZE)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * PAGE_SIZE >= totalCount}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No schools found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || stateFilter || levelFilter 
                    ? 'Try adjusting your search filters'
                    : 'Get started by adding schools or importing a CSV file'}
                </p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First School
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
