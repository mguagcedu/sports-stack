import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Globe, 
  Building2, 
  GraduationCap,
  Info,
  ExternalLink,
  Eye
} from 'lucide-react';

export default function DistrictDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
                <h1 className="text-2xl font-bold">{district?.name}</h1>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
