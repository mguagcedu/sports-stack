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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistrictName } from '@/lib/formatters';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Globe, 
  Building2, 
  GraduationCap,
  Info,
  ExternalLink,
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

export default function SchoolDetail() {
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
    level: '',
    school_type: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    website: ''
  });

  const { data: school, isLoading, error } = useQuery({
    queryKey: ['school-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select(`
          *,
          districts (
            id,
            name,
            city,
            state,
            address,
            phone,
            website
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const fullAddress = school 
    ? `${school.address || ''}, ${school.city || ''}, ${school.state || ''} ${school.zip || ''}`.trim().replace(/^,\s*/, '')
    : '';

  const mapEmbedUrl = fullAddress 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
    : null;

  const openEditDialog = () => {
    if (school) {
      setEditForm({
        name: school.name || '',
        level: school.level || '',
        school_type: school.school_type || '',
        address: school.address || '',
        city: school.city || '',
        state: school.state || '',
        zip: school.zip || '',
        phone: school.phone || '',
        website: school.website || ''
      });
      setFormErrors({});
      setIsEditDialogOpen(true);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!editForm.name.trim()) {
      errors.name = 'School name is required';
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
      .from('schools')
      .update({
        name: editForm.name.trim(),
        level: editForm.level || null,
        school_type: editForm.school_type || null,
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
        title: 'School Updated',
        description: 'School information has been updated successfully.'
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['school-detail', id] });
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Error loading school details</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/schools')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schools
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/schools')}>
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
                  <h1 className="text-2xl font-bold">{school?.name}</h1>
                  <Button variant="outline" size="sm" onClick={openEditDialog}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {school?.level && (
                    <Badge variant="outline" className="capitalize">{school.level}</Badge>
                  )}
                  {school?.school_type && (
                    <Badge variant="secondary" className="capitalize">{school.school_type}</Badge>
                  )}
                  {school?.operational_status && (
                    <Badge variant={school.operational_status === 'Open' ? 'default' : 'destructive'}>
                      {school.operational_status}
                    </Badge>
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
                      {school?.address && <span className="block">{school.address}</span>}
                      <span>
                        {school?.city}{school?.city && school?.state && ', '}
                        {school?.state} {school?.zip}
                      </span>
                    </p>
                    {school?.county && (
                      <p className="text-sm text-muted-foreground">County: {school.county}</p>
                    )}
                  </div>

                  {school?.phone && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <a href={`tel:${school.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Phone className="h-4 w-4" />
                        {school.phone}
                      </a>
                    </div>
                  )}

                  {school?.website && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Website</p>
                      <a 
                        href={school.website.startsWith('http') ? school.website : `https://${school.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        {school.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* District Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                District Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : school?.districts ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">District Name</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-base font-medium"
                      onClick={() => navigate(`/districts/${school.districts.id}`)}
                    >
                      {formatDistrictName(school.districts.name)}
                    </Button>
                  </div>
                  {school.districts.city && school.districts.state && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-sm">{school.districts.city}, {school.districts.state}</p>
                    </div>
                  )}
                  {school.districts.phone && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">District Phone</p>
                      <p className="text-sm">{school.districts.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No district information available</p>
              )}
            </CardContent>
          </Card>

          {/* School Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                School Details
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
                    <p className="text-sm font-mono">{school?.nces_id || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Level</p>
                    <p className="text-sm capitalize">{school?.level || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-sm capitalize">{school?.school_type || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Charter Status</p>
                    <p className="text-sm">{school?.charter_status || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Virtual Status</p>
                    <p className="text-sm">{school?.virtual_status || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Title I Status</p>
                    <p className="text-sm">{school?.title1_status || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Magnet Status</p>
                    <p className="text-sm">{school?.magnet_status || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">School Year</p>
                    <p className="text-sm">{school?.school_year || '-'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map Embed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Location Map
              </CardTitle>
              <CardDescription>Interactive map showing school location</CardDescription>
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
                  title={`Map of ${school?.name}`}
                />
              ) : (
                <div className="h-64 rounded-lg border bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No address available for map</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
            <DialogDescription>
              Update school information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-name">School Name *</Label>
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
              <div className="space-y-2">
                <Label htmlFor="edit-level">Level</Label>
                <Select
                  value={editForm.level}
                  onValueChange={(value) => setEditForm({ ...editForm, level: value })}
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
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editForm.school_type}
                  onValueChange={(value) => setEditForm({ ...editForm, school_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="charter">Charter</SelectItem>
                  </SelectContent>
                </Select>
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
