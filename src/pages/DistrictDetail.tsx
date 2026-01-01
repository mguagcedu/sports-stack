import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistrictName } from '@/lib/formatters';
import { StateAssociationLookup } from '@/components/governance/StateAssociationLookup';
import { DistrictSportOverrides } from '@/components/governance/DistrictSportOverrides';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Globe, 
  Building2, 
  GraduationCap,
  Info,
  ExternalLink,
  Eye,
  Pencil,
  Loader2
} from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

interface FormErrors {
  name?: string;
  phone?: string;
  website?: string;
  zip?: string;
}

export default function DistrictDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    website: ''
  });

  const { data: district, isLoading, error } = useQuery({
    queryKey: ['district-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['district-schools', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, level, school_type, city, state, phone')
        .eq('district_id', id)
        .order('name')
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: schoolCount } = useQuery({
    queryKey: ['district-school-count', id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .eq('district_id', id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id
  });

  const fullAddress = district 
    ? `${district.address || ''}, ${district.city || ''}, ${district.state || ''} ${district.zip || ''}`.trim().replace(/^,\s*/, '')
    : '';

  const mapEmbedUrl = fullAddress 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
    : null;

  const openEditDialog = () => {
    if (district) {
      setEditForm({
        name: district.name || '',
        address: district.address || '',
        city: district.city || '',
        state: district.state || '',
        zip: district.zip || '',
        phone: district.phone || '',
        website: district.website || ''
      });
      setFormErrors({});
      setIsEditDialogOpen(true);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!editForm.name.trim()) {
      errors.name = 'District name is required';
    }
    
    if (editForm.phone && !/^[\d\s\-\(\)\+\.]+$/.test(editForm.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (editForm.website && !editForm.website.match(/^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+/)) {
      errors.website = 'Please enter a valid website URL';
    }
    
    if (editForm.zip && !/^\d{5}(-\d{4})?$/.test(editForm.zip)) {
      errors.zip = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveClick = () => {
    if (validateForm()) {
      setIsConfirmDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    setIsConfirmDialogOpen(false);
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('districts')
      .update({
        name: editForm.name.trim(),
        address: editForm.address || null,
        city: editForm.city || null,
        state: editForm.state || null,
        zip: editForm.zip || null,
        phone: editForm.phone || null,
        website: editForm.website || null
      })
      .eq('id', id);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'District Updated',
        description: 'District information has been updated successfully.'
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['district-detail', id] });
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Error loading district details</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/districts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Districts
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/districts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{formatDistrictName(district?.name)}</h1>
                  <Button variant="outline" size="sm" onClick={openEditDialog}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {district?.charter_lea === 'CHRTRDIST' ? 'Charter District' : 'Public District'}
                  </Badge>
                  {district?.operational_status_text && (
                    <Badge variant="outline">{district.operational_status_text}</Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Location & Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-sm">
                      {district?.address && <span className="block">{district.address}</span>}
                      <span>
                        {district?.city}{district?.city && district?.state && ', '}
                        {district?.state} {district?.zip}
                      </span>
                    </p>
                  </div>

                  {district?.phone && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <a href={`tel:${district.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Phone className="h-4 w-4" />
                        {district.phone}
                      </a>
                    </div>
                  )}

                  {district?.website && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Website</p>
                      <a 
                        href={district.website.startsWith('http') ? district.website : `https://${district.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        {district.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* District Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                District Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">NCES ID</p>
                    <p className="text-sm font-mono">{district?.nces_id || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">State LEA ID</p>
                    <p className="text-sm font-mono">{district?.state_lea_id || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-sm">{district?.lea_type_text || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Grade Range</p>
                    <p className="text-sm">
                      {district?.lowest_grade && district?.highest_grade 
                        ? `${district.lowest_grade} - ${district.highest_grade}`
                        : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Operational Schools</p>
                    <p className="text-sm">{district?.operational_schools ?? '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Management Mode</p>
                    <p className="text-sm capitalize">{district?.management_mode?.replace('_', ' ') || '-'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* State Athletic Association */}
          {district?.state && (
            <StateAssociationLookup stateCode={district.state} />
          )}

          {/* Map Embed */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Location Map
              </CardTitle>
              <CardDescription>Interactive map showing district location</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full rounded-lg" />
              ) : mapEmbedUrl ? (
                <iframe
                  src={mapEmbedUrl}
                  className="w-full h-64 rounded-lg border"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map of ${district?.name}`}
                />
              ) : (
                <div className="h-64 rounded-lg border bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No address available for map</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schools in District */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Schools in District
              </CardTitle>
              <CardDescription>
                {schoolCount !== undefined 
                  ? `${schoolCount} school${schoolCount !== 1 ? 's' : ''} in this district`
                  : 'Loading schools...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schoolsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : schools && schools.length > 0 ? (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>School Name</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schools.map((school) => (
                          <TableRow key={school.id}>
                            <TableCell>
                              <button
                                className="font-medium text-left hover:text-primary hover:underline transition-colors"
                                onClick={() => navigate(`/schools/${school.id}`)}
                              >
                                {school.name}
                              </button>
                            </TableCell>
                            <TableCell>
                              {school.level && (
                                <Badge variant="outline" className="capitalize">{school.level}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="capitalize">{school.school_type || '-'}</TableCell>
                            <TableCell>
                              {school.city}, {school.state}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/schools/${school.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {schoolCount && schoolCount > 50 && (
                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline"
                        onClick={() => navigate(`/schools?district=${id}`)}
                      >
                        View all {schoolCount} schools
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No schools found in this district
                </div>
              )}
            </CardContent>
          </Card>

          {/* District Sport Overrides */}
          {district && district.state && (
            <DistrictSportOverrides
              districtId={district.id}
              stateCode={district.state}
              className="md:col-span-2"
            />
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit District</DialogTitle>
            <DialogDescription>
              Update district information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-name">District Name *</Label>
                <Input
                  id="edit-name"
                  className={formErrors.name ? 'border-destructive' : ''}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Select
                  value={editForm.state}
                  onValueChange={(value) => setEditForm({ ...editForm, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zip">ZIP Code</Label>
                <Input
                  id="edit-zip"
                  className={formErrors.zip ? 'border-destructive' : ''}
                  value={editForm.zip}
                  onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                />
                {formErrors.zip && (
                  <p className="text-sm text-destructive">{formErrors.zip}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  className={formErrors.phone ? 'border-destructive' : ''}
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                {formErrors.phone && (
                  <p className="text-sm text-destructive">{formErrors.phone}</p>
                )}
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  className={formErrors.website ? 'border-destructive' : ''}
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                />
                {formErrors.website && (
                  <p className="text-sm text-destructive">{formErrors.website}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClick} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes to {editForm.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
