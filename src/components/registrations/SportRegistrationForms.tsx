import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { DigitalSignature } from './DigitalSignature';
import {
  FileText,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  ClipboardList,
  Heart,
  Shield,
  Shirt,
  Plane,
  Camera,
  Phone,
  Info,
} from 'lucide-react';

interface SportRegistrationFormsProps {
  sportCode?: string;
  athleteUserId: string;
  teamId?: string;
  registrationId?: string;
  schoolId?: string;
  districtId?: string;
}

const FORM_TYPE_ICONS: Record<string, React.ReactNode> = {
  general: <ClipboardList className="h-5 w-5" />,
  health: <Heart className="h-5 w-5" />,
  consent: <Shield className="h-5 w-5" />,
  equipment: <Shirt className="h-5 w-5" />,
  travel: <Plane className="h-5 w-5" />,
  media_release: <Camera className="h-5 w-5" />,
  emergency_contact: <Phone className="h-5 w-5" />,
};

export function SportRegistrationForms({
  sportCode,
  athleteUserId,
  teamId,
  registrationId,
  schoolId,
  districtId,
}: SportRegistrationFormsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedForm, setSelectedForm] = useState<any>(null);

  // Fetch applicable forms (general + sport-specific)
  const { data: forms, isLoading } = useQuery({
    queryKey: ['registration-forms', sportCode],
    queryFn: async () => {
      let query = supabase
        .from('registration_forms')
        .select('*')
        .order('is_required', { ascending: false })
        .order('form_type');

      // Get general forms (null sport_code) and sport-specific
      if (sportCode) {
        query = query.or(`sport_code.is.null,sport_code.eq.${sportCode}`);
      } else {
        query = query.is('sport_code', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch submissions for this athlete
  const { data: submissions } = useQuery({
    queryKey: ['form-submissions', athleteUserId, teamId],
    queryFn: async () => {
      let query = supabase
        .from('form_submissions')
        .select('*, digital_signatures(*)')
        .eq('athlete_user_id', athleteUserId);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!athleteUserId,
  });

  // Fetch school integration settings for FinalForms
  const { data: schoolSettings } = useQuery({
    queryKey: ['school-finalforms', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await supabase
        .from('schools')
        .select('finalforms_portal_url, finalforms_enabled, name')
        .eq('id', schoolId)
        .maybeSingle();
      return data;
    },
    enabled: !!schoolId,
  });

  // Fetch district settings as fallback
  const { data: districtSettings } = useQuery({
    queryKey: ['district-finalforms', districtId],
    queryFn: async () => {
      if (!districtId) return null;
      const { data } = await supabase
        .from('districts')
        .select('finalforms_portal_url, finalforms_enabled, name')
        .eq('id', districtId)
        .maybeSingle();
      return data;
    },
    enabled: !!districtId && !schoolSettings?.finalforms_enabled,
  });

  const finalformsUrl = schoolSettings?.finalforms_portal_url || districtSettings?.finalforms_portal_url;
  const finalformsEnabled = schoolSettings?.finalforms_enabled || districtSettings?.finalforms_enabled;

  // Submit form mutation
  const submitMutation = useMutation({
    mutationFn: async ({ formId, signatureData }: { formId: string; signatureData: any }) => {
      // Create or update submission
      const { data: submission, error: subError } = await supabase
        .from('form_submissions')
        .upsert({
          form_id: formId,
          registration_id: registrationId,
          athlete_user_id: athleteUserId,
          team_id: teamId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        }, { onConflict: 'form_id,athlete_user_id' })
        .select()
        .single();

      if (subError) throw subError;

      // Add signature
      const { error: sigError } = await supabase.from('digital_signatures').insert({
        form_submission_id: submission.id,
        signer_user_id: user?.id,
        signer_role: signatureData.role || 'athlete',
        signer_name: signatureData.name,
        signature_data: signatureData.data,
        signature_type: signatureData.type,
      });

      if (sigError) throw sigError;
      return submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      setSelectedForm(null);
      toast({ title: 'Form signed successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error submitting form', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate completion stats
  const requiredForms = forms?.filter((f) => f.is_required) || [];
  const completedRequired = requiredForms.filter((f) =>
    submissions?.some((s) => s.form_id === f.id && s.status === 'submitted')
  ).length;
  const completionPercent = requiredForms.length > 0 ? (completedRequired / requiredForms.length) * 100 : 0;

  const getFormStatus = (formId: string) => {
    const submission = submissions?.find((s) => s.form_id === formId);
    if (!submission) return 'pending';
    return submission.status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Complete</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500/10 text-blue-500"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      default:
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading forms...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Registration Forms
          </CardTitle>
          <CardDescription>
            Complete all required forms to finalize registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Required Forms Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedRequired} of {requiredForms.length} completed
            </span>
          </div>
          <Progress value={completionPercent} className="h-2" />
          
          {completionPercent === 100 && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                All required forms have been completed!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* FinalForms Integration Notice */}
      {finalformsEnabled && finalformsUrl && (
        <Alert>
          <Heart className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Health forms</strong> must be completed through FinalForms
            </span>
            <Button variant="outline" size="sm" asChild>
              <a href={finalformsUrl} target="_blank" rel="noopener noreferrer">
                Open FinalForms <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Forms List */}
      <div className="grid gap-4">
        {forms?.map((form) => {
          const status = getFormStatus(form.id);
          const isFinalForms = form.external_provider === 'finalforms';

          return (
            <Card 
              key={form.id} 
              className={status === 'submitted' || status === 'approved' ? 'border-green-500/30' : ''}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      status === 'submitted' ? 'bg-green-500/10' : 'bg-muted'
                    }`}>
                      {FORM_TYPE_ICONS[form.form_type] || <FileText className="h-5 w-5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{form.title}</h3>
                        {form.is_required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        {form.sport_code && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {form.sport_code.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{form.description}</p>
                      {(form.requires_parent_signature || form.requires_coach_signature) && (
                        <div className="flex gap-2 mt-2">
                          {form.requires_parent_signature && (
                            <Badge variant="outline" className="text-xs">Parent Signature Required</Badge>
                          )}
                          {form.requires_coach_signature && (
                            <Badge variant="outline" className="text-xs">Coach Signature Required</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(status)}
                    {isFinalForms && finalformsUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={finalformsUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : status === 'pending' ? (
                      <Button size="sm" onClick={() => setSelectedForm(form)}>
                        Complete
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setSelectedForm(form)}>
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForm?.title}</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {selectedForm.description}
                </AlertDescription>
              </Alert>

              {/* Form content would go here - for now show placeholder */}
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    <h4>Terms and Conditions</h4>
                    <p>
                      By signing this form, you acknowledge that you have read, understood, and agree
                      to comply with all athletic department policies and procedures. You understand
                      the inherent risks associated with athletic participation and accept responsibility
                      for following all safety guidelines.
                    </p>
                    {selectedForm.form_type === 'consent' && (
                      <>
                        <h4>Risk Acknowledgment</h4>
                        <p>
                          You acknowledge that participation in athletic activities involves inherent risks,
                          including but not limited to physical injury. You agree to follow all safety
                          protocols and report any concerns to coaching staff immediately.
                        </p>
                      </>
                    )}
                    {selectedForm.form_type === 'equipment' && (
                      <>
                        <h4>Equipment Responsibility</h4>
                        <p>
                          You agree to take proper care of all issued equipment, return it in good condition,
                          and report any damage or loss immediately. You may be held financially responsible
                          for lost or damaged equipment.
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Signature Section */}
              <DigitalSignature
                signerRole={selectedForm.requires_parent_signature ? 'Parent/Guardian' : 'Athlete'}
                onSign={(signatureData) => {
                  submitMutation.mutate({
                    formId: selectedForm.id,
                    signatureData: {
                      ...signatureData,
                      role: selectedForm.requires_parent_signature ? 'parent' : 'athlete',
                    },
                  });
                }}
                disabled={submitMutation.isPending}
                existingSignature={
                  submissions?.find((s) => s.form_id === selectedForm.id)?.digital_signatures?.[0]
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}