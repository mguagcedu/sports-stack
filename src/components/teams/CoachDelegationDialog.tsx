import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Link, QrCode, Copy, Check, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CoachDelegationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  organizationId?: string;
}

type InviteRole = "coach" | "assistant_coach" | "team_manager" | "athlete" | "parent";

const ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
  { value: "coach", label: "Head Coach" },
  { value: "assistant_coach", label: "Assistant Coach" },
  { value: "team_manager", label: "Team Manager" },
  { value: "athlete", label: "Athlete" },
  { value: "parent", label: "Parent/Guardian" },
];

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function CoachDelegationDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
  organizationId,
}: CoachDelegationDialogProps) {
  const [inviteRole, setInviteRole] = useState<InviteRole>("coach");
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch existing invitations for this team
  const { data: invitations } = useQuery({
    queryKey: ["team-invitations", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Create invitation mutation
  const createInviteMutation = useMutation({
    mutationFn: async (type: "link" | "code") => {
      const code = generateInviteCode();
      const { data, error } = await supabase
        .from("team_invitations")
        .insert({
          team_id: teamId,
          organization_id: organizationId || null,
          invite_code: code,
          invite_type: type,
          target_role: inviteRole,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations", teamId] });
      setGeneratedCode(data.invite_code);
      const link = `${window.location.origin}/join/${data.invite_code}`;
      setGeneratedLink(link);
      toast({ title: "Invitation created!" });
    },
    onError: (error) => {
      toast({ title: "Error creating invitation", description: error.message, variant: "destructive" });
    },
  });

  // Deactivate invitation
  const deactivateMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("team_invitations")
        .update({ is_active: false })
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations", teamId] });
      toast({ title: "Invitation deactivated" });
    },
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const roleLabel = ROLE_OPTIONS.find((r) => r.value === inviteRole)?.label || inviteRole;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite to {teamName}
          </DialogTitle>
          <DialogDescription>
            Create invitation codes or links to add coaches, staff, athletes, or parents to this team.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Invite</TabsTrigger>
            <TabsTrigger value="active">Active Invites ({invitations?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Invite Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as InviteRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteRole === "coach" || inviteRole === "assistant_coach"
                  ? "Coaches require admin approval before gaining team access."
                  : inviteRole === "athlete"
                  ? "Athletes require coach approval. Parents of approved athletes get access automatically."
                  : inviteRole === "parent"
                  ? "Parents are linked to their child's profile after athlete approval."
                  : "Team managers can manage rosters and communications."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => createInviteMutation.mutate("link")}
                disabled={createInviteMutation.isPending}
              >
                <Link className="h-6 w-6" />
                <span>Generate Link</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => createInviteMutation.mutate("code")}
                disabled={createInviteMutation.isPending}
              >
                <QrCode className="h-6 w-6" />
                <span>Generate Code</span>
              </Button>
            </div>

            {generatedLink && (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Invite Link</Label>
                  <div className="flex gap-2">
                    <Input value={generatedLink} readOnly className="text-sm" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedLink)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {generatedCode && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Invite Code</Label>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono font-bold tracking-wider bg-background px-3 py-2 rounded">
                        {generatedCode}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCode)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Share this with the {roleLabel.toLowerCase()} you want to invite.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="pt-4">
            {invitations?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active invitations. Create one to get started.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {invitations?.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-3 rounded-lg border flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-semibold">{invite.invite_code}</code>
                        <Badge variant="secondary" className="capitalize">
                          {invite.target_role.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Used {invite.uses_count} times
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deactivateMutation.mutate(invite.id)}
                    >
                      Deactivate
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
