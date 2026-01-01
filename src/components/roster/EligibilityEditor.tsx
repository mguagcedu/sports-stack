import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, CheckCircle2, Clock, HelpCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

type EligibilityStatus = "unknown" | "pending" | "cleared" | "not_cleared";

interface TeamMember {
  id: string;
  user_id: string;
  eligibility_status: EligibilityStatus | null;
  eligibility_last_verified_at: string | null;
  eligibility_verified_by_user_id: string | null;
  eligibility_notes: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface EligibilityEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  teamId: string;
}

const statusConfig: Record<EligibilityStatus, { label: string; icon: React.ReactNode; color: string }> = {
  unknown: { 
    label: "Unknown", 
    icon: <HelpCircle className="h-4 w-4" />, 
    color: "bg-muted text-muted-foreground" 
  },
  pending: { 
    label: "Pending", 
    icon: <Clock className="h-4 w-4" />, 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" 
  },
  cleared: { 
    label: "Cleared", 
    icon: <CheckCircle2 className="h-4 w-4" />, 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
  },
  not_cleared: { 
    label: "Not Cleared", 
    icon: <AlertCircle className="h-4 w-4" />, 
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
  },
};

export function EligibilityEditor({ open, onOpenChange, member, teamId }: EligibilityEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [status, setStatus] = useState<EligibilityStatus>(
    (member.eligibility_status as EligibilityStatus) || "unknown"
  );
  const [reason, setReason] = useState("");

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Require reason for not_cleared status
      if (status === "not_cleared" && !reason.trim()) {
        throw new Error("A reason is required when setting status to Not Cleared");
      }

      // Update team member eligibility
      const { error: memberError } = await supabase
        .from("team_members")
        .update({
          eligibility_status: status,
          eligibility_last_verified_at: new Date().toISOString(),
          eligibility_verified_by_user_id: user?.id,
          eligibility_notes: reason || null,
        })
        .eq("id", member.id);

      if (memberError) throw memberError;

      // Create audit record
      const { error: auditError } = await supabase
        .from("eligibility_updates")
        .insert({
          team_member_id: member.id,
          old_status: member.eligibility_status || "unknown",
          new_status: status,
          reason: reason || null,
          updated_by_user_id: user?.id!,
        });

      if (auditError) {
        console.error("Audit log error:", auditError);
        // Don't fail the operation if audit fails
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast({ title: "Eligibility status updated" });
      onOpenChange(false);
      setReason("");
    },
    onError: (error) => {
      toast({ 
        title: "Error updating eligibility", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const memberName = `${member.profile?.first_name || ""} ${member.profile?.last_name || ""}`.trim() || "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Eligibility Status</DialogTitle>
          <DialogDescription>
            Update eligibility for {memberName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Status</p>
                <p className="text-sm text-muted-foreground">
                  {member.eligibility_last_verified_at 
                    ? `Last verified: ${format(new Date(member.eligibility_last_verified_at), "MMM d, yyyy 'at' h:mm a")}`
                    : "Never verified"
                  }
                </p>
              </div>
              <Badge className={statusConfig[member.eligibility_status as EligibilityStatus || "unknown"].color}>
                {statusConfig[member.eligibility_status as EligibilityStatus || "unknown"].icon}
                <span className="ml-1">{statusConfig[member.eligibility_status as EligibilityStatus || "unknown"].label}</span>
              </Badge>
            </div>
            {member.eligibility_notes && (
              <p className="mt-2 text-sm text-muted-foreground border-t pt-2">
                <strong>Notes:</strong> {member.eligibility_notes}
              </p>
            )}
          </div>

          {/* New Status */}
          <div className="space-y-2">
            <Label>New Eligibility Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EligibilityStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">
                  <div className="flex items-center gap-2">
                    {statusConfig.unknown.icon}
                    Unknown
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    {statusConfig.pending.icon}
                    Pending Review
                  </div>
                </SelectItem>
                <SelectItem value="cleared">
                  <div className="flex items-center gap-2">
                    {statusConfig.cleared.icon}
                    Cleared to Participate
                  </div>
                </SelectItem>
                <SelectItem value="not_cleared">
                  <div className="flex items-center gap-2">
                    {statusConfig.not_cleared.icon}
                    Not Cleared
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason/Notes */}
          <div className="space-y-2">
            <Label>
              {status === "not_cleared" ? "Reason (Required)" : "Notes (Optional)"}
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                status === "not_cleared" 
                  ? "Explain why the athlete is not cleared (e.g., missing physical, incomplete forms)"
                  : "Add any additional notes about this eligibility status"
              }
              rows={3}
            />
            {status === "not_cleared" && !reason.trim() && (
              <p className="text-sm text-destructive">
                A reason is required when marking an athlete as not cleared
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || (status === "not_cleared" && !reason.trim())}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EligibilityBadge({ status }: { status: EligibilityStatus | null }) {
  const effectiveStatus = status || "unknown";
  const config = statusConfig[effectiveStatus];
  
  return (
    <Badge className={`${config.color} gap-1`} variant="outline">
      {config.icon}
      {config.label}
    </Badge>
  );
}
