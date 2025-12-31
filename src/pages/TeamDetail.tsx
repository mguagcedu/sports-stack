import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Users, Building, Calendar, Trophy, Edit } from "lucide-react";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    user_id: "",
    role: "athlete",
    jersey_number: "",
    position: "",
  });

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          organizations(name),
          sports(name, icon),
          seasons(name, academic_year),
          schools(name)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["team-members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select(`
          *,
          profiles:user_id(first_name, last_name, email)
        `)
        .eq("team_id", id)
        .order("role")
        .order("jersey_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: availableUsers } = useQuery({
    queryKey: ["available-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .order("last_name");
      if (error) throw error;
      return data;
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (member: typeof newMember) => {
      const { data, error } = await supabase
        .from("team_members")
        .insert({
          team_id: id,
          user_id: member.user_id,
          role: member.role,
          jersey_number: member.jersey_number || null,
          position: member.position || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", id] });
      setIsAddMemberOpen(false);
      setNewMember({ user_id: "", role: "athlete", jersey_number: "", position: "" });
      toast({ title: "Member added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding member", description: error.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", id] });
      toast({ title: "Member removed" });
    },
    onError: (error) => {
      toast({ title: "Error removing member", description: error.message, variant: "destructive" });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Team deleted" });
      navigate("/teams");
    },
    onError: (error) => {
      toast({ title: "Error deleting team", description: error.message, variant: "destructive" });
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "coach": return "default";
      case "assistant_coach": return "secondary";
      case "team_manager": return "outline";
      case "trainer": return "outline";
      default: return "secondary";
    }
  };

  if (teamLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading team...</div>
      </DashboardLayout>
    );
  }

  if (!team) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Team not found</h2>
          <Button className="mt-4" onClick={() => navigate("/teams")}>Back to Teams</Button>
        </div>
      </DashboardLayout>
    );
  }

  const athletes = members?.filter((m) => m.role === "athlete") || [];
  const staff = members?.filter((m) => m.role !== "athlete") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/teams")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-muted-foreground">
              {team.sports?.name} • {team.seasons?.name}
            </p>
          </div>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Team</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground">Team editing coming soon...</p>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Team?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the team and all roster data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteTeamMutation.mutate()}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organization</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.organizations?.name || "N/A"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sport</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.sports?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground capitalize">{team.level} • {team.gender}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Season</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.seasons?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">{team.seasons?.academic_year}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roster</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{athletes.length}/{team.max_roster_size || "∞"}</div>
              <p className="text-xs text-muted-foreground">{staff.length} staff members</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Team Roster</CardTitle>
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select
                      value={newMember.user_id}
                      onValueChange={(value) => setNewMember({ ...newMember, user_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="athlete">Athlete</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="assistant_coach">Assistant Coach</SelectItem>
                        <SelectItem value="team_manager">Team Manager</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newMember.role === "athlete" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Jersey #</Label>
                        <Input
                          value={newMember.jersey_number}
                          onChange={(e) => setNewMember({ ...newMember, jersey_number: e.target.value })}
                          placeholder="e.g., 23"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          value={newMember.position}
                          onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
                          placeholder="e.g., Guard"
                        />
                      </div>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => addMemberMutation.mutate(newMember)}
                    disabled={!newMember.user_id || addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="text-center py-8">Loading roster...</div>
            ) : members?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members yet. Add your first team member to get started.
              </div>
            ) : (
              <div className="space-y-6">
                {staff.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Staff</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.profiles?.first_name} {member.profiles?.last_name}
                            </TableCell>
                            <TableCell>{member.profiles?.email}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                                {member.role.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMemberMutation.mutate(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {athletes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Athletes ({athletes.length})</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {athletes.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-bold">{member.jersey_number || "-"}</TableCell>
                            <TableCell className="font-medium">
                              {member.profiles?.first_name} {member.profiles?.last_name}
                              {member.is_captain && <Badge variant="outline" className="ml-2">C</Badge>}
                            </TableCell>
                            <TableCell>{member.position || "-"}</TableCell>
                            <TableCell>{member.profiles?.email}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMemberMutation.mutate(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
