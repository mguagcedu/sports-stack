import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Globe, 
  Building2, 
  GraduationCap,
  Info,
  ExternalLink
} from 'lucide-react';

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const openInGoogleMaps = () => {
    if (school?.latitude && school?.longitude) {
      window.open(`https://www.google.com/maps?q=${school.latitude},${school.longitude}`, '_blank');
    } else if (fullAddress) {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`, '_blank');
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
                <h1 className="text-2xl font-bold">{school?.name}</h1>
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

                  <Button variant="outline" className="w-full mt-4" onClick={openInGoogleMaps}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Open in Google Maps
                  </Button>
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
                      onClick={() => navigate(`/schools?district=${school.districts.id}`)}
                    >
                      {school.districts.name}
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
    </DashboardLayout>
  );
}
