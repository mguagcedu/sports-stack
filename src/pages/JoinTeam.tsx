import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { SchoolLogo } from "@/components/branding/SchoolLogo";
import { SportIcon } from "@/components/branding/SportIcon";

export default function JoinTeam() {
  const { code } = useParams<{ code: string }>();
  const [manualCode, setManualCode] = useState(code || "");
  const [submitted, setSubmitted] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Look up invitation by code
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["invitation", code || manualCode],
    queryFn: async () => {
      const lookupCode = code || manualCode;
      if (!lookupCode) return null;
      
      const { data, error } = await supabase
        .from("team_invitations")
        .select(`
          *,
          teams(
            id, 
            name, 
            organizations(name),
            schools(id, name, logo_url, primary_color, secondary_color, text_on_primary),
            sports(name, code, icon)
          )
        `)
        .eq("invite_code", lookupCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!(code || manualCode.length >= 8),
  });

  // Get school branding from invitation
  const schoolBranding = invitation?.teams?.schools;
  const primaryColor = schoolBranding?.primary_color || undefined;
  const secondaryColor = schoolBranding?.secondary_color || undefined;
  const textOnPrimary = schoolBranding?.text_on_primary || 'white';

  // Submit join request
  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!invitation || !user) throw new Error("Missing invitation or user");

      // Check if user already has a pending request
      const { data: existing } = await supabase
        .from("pending_approvals")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("team_id", invitation.team_id)
        .maybeSingle();

      if (existing) {
        throw new Error(`You already have a ${existing.status} request for this team.`);
      }

      // Create pending approval
      const { data, error } = await supabase
        .from("pending_approvals")
        .insert({
          user_id: user.id,
          team_id: invitation.team_id,
          organization_id: invitation.organization_id,
          requested_role: invitation.target_role,
          invitation_id: invitation.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment uses count
      await supabase
        .from("team_invitations")
        .update({ uses_count: (invitation.uses_count || 0) + 1 })
        .eq("id", invitation.id);

      return data;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Request submitted!",
        description: "You'll be notified once your request is approved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error joining team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "coach":
        return "As a coach, you'll be able to manage the team roster, schedule, and communicate with parents.";
      case "assistant_coach":
        return "As an assistant coach, you'll help manage the team and communicate with athletes and parents.";
      case "team_manager":
        return "As a team manager, you'll handle administrative tasks, rosters, and team communications.";
      case "athlete":
        return "As an athlete, you'll join the team roster and have access to schedules and team info.";
      case "parent":
        return "As a parent/guardian, you'll have access to your child's team information and communications.";
      default:
        return "You'll join this team with the specified role.";
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                You need to sign in or create an account to join a team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                Sign In / Create Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <CardTitle>Request Submitted!</CardTitle>
              <CardDescription>
                Your request to join {invitation?.teams?.name} has been submitted.
                You'll receive a notification once it's approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
              <Button className="w-full" variant="outline" onClick={() => navigate("/")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Join a Team</CardTitle>
            <CardDescription>
              {code ? "You've been invited to join a team!" : "Enter your invite code to join a team."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!code && (
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  className="text-center font-mono text-lg tracking-wider"
                />
              </div>
            )}

            {isLoading && (
              <div className="text-center py-4 text-muted-foreground">
                Looking up invitation...
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-center">
                Error loading invitation. Please check the code and try again.
              </div>
            )}

            {invitation && (
              <div className="space-y-4">
                <div 
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: primaryColor ? `${primaryColor}10` : undefined,
                    borderColor: primaryColor || undefined
                  }}
                >
                  <div className="text-center space-y-3">
                    {schoolBranding?.logo_url && (
                      <div className="flex justify-center">
                        <img 
                          src={schoolBranding.logo_url} 
                          alt={schoolBranding.name || 'School logo'}
                          className="h-16 w-16 object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{invitation.teams?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {schoolBranding?.name || invitation.teams?.organizations?.name}
                      </p>
                    </div>
                    {invitation.teams?.sports && (
                      <div className="flex items-center justify-center gap-2">
                        <SportIcon 
                          sportName={invitation.teams.sports.name}
                          size="sm"
                          useSchoolColors={false}
                        />
                        <span className="text-sm">{invitation.teams.sports.name}</span>
                      </div>
                    )}
                    <Badge 
                      className="capitalize"
                      style={{
                        backgroundColor: primaryColor || undefined,
                        color: primaryColor ? textOnPrimary : undefined
                      }}
                    >
                      {invitation.target_role.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {getRoleDescription(invitation.target_role)}
                </p>

                <Button
                  className="w-full"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  style={{
                    backgroundColor: primaryColor || undefined,
                    color: primaryColor ? textOnPrimary : undefined
                  }}
                >
                  {joinMutation.isPending ? "Submitting..." : "Request to Join"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your request will be reviewed by a team administrator.
                </p>
              </div>
            )}

            {!invitation && !isLoading && (code || manualCode.length >= 8) && (
              <div className="p-4 rounded-lg bg-muted text-center text-muted-foreground">
                No active invitation found for this code.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
