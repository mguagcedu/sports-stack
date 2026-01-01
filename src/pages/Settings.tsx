import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { SessionManager } from "@/components/security/SessionManager";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Bell, 
  Shield, 
  Building, 
  Database, 
  Palette,
  Globe,
  Package,
  Link as LinkIcon,
  Key,
  Camera,
  IdCard,
  Monitor
} from "lucide-react";

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

const DATE_FORMATS = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (01/15/2026)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (15/01/2026)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2026-01-15)' },
];

const THEMES = [
  { value: 'system', label: 'System Default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function Settings() {
  const { user } = useAuth();
  const { roles, hasAnyRole } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = hasAnyRole(['system_admin', 'org_admin', 'superadmin']);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  const [prefsForm, setPrefsForm] = useState({
    theme: "system",
    timezone: "America/New_York",
    date_format: "MM/dd/yyyy",
    compact_mode: false,
    notifications_email: true,
    notifications_push: false,
    notifications_sms: false,
    email_registrations: true,
    email_payments: true,
    email_events: true,
    email_equipment: true,
    email_team_updates: true,
  });

  // Initialize forms when data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (preferences) {
      setPrefsForm({
        theme: preferences.theme || "system",
        timezone: preferences.timezone || "America/New_York",
        date_format: preferences.date_format || "MM/dd/yyyy",
        compact_mode: preferences.compact_mode || false,
        notifications_email: preferences.notifications_email ?? true,
        notifications_push: preferences.notifications_push ?? false,
        notifications_sms: preferences.notifications_sms ?? false,
        email_registrations: preferences.email_registrations ?? true,
        email_payments: preferences.email_payments ?? true,
        email_events: preferences.email_events ?? true,
        email_equipment: preferences.email_equipment ?? true,
        email_team_updates: preferences.email_team_updates ?? true,
      });
    }
  }, [preferences]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
        })
        .eq("id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({ title: "Profile updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (data: typeof prefsForm) => {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user?.id,
          ...data,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences", user?.id] });
      toast({ title: "Preferences saved" });
    },
    onError: (error) => {
      toast({ title: "Error saving preferences", description: error.message, variant: "destructive" });
    },
  });

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password reset email sent", description: "Check your inbox for the reset link" });
    }
  };

  if (profileLoading || prefsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading settings...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="organization" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Organization
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Integrations
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Photo Column */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Photos
                  </CardTitle>
                  <CardDescription>Profile and sports card photos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center p-4 border rounded-lg bg-muted/30">
                    <ProfilePhotoUploader
                      currentPhotoUrl={profile?.photo_url || profile?.avatar_url}
                      type="profile"
                      size="lg"
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Main profile picture
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 border rounded-lg bg-muted/30">
                    <ProfilePhotoUploader
                      currentPhotoUrl={profile?.card_photo_url || profile?.photo_url || profile?.avatar_url}
                      type="card"
                      size="lg"
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Sports card photo
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Info Column */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ""} disabled />
                    <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Your Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {roles.length > 0 ? (
                        roles.map((userRole, index) => (
                          <Badge key={index} variant="secondary">
                            {userRole.role.replace(/_/g, ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No roles assigned</span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => updateProfileMutation.mutate(profileForm)}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={prefsForm.theme}
                      onValueChange={(value) => setPrefsForm({ ...prefsForm, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THEMES.map((theme) => (
                          <SelectItem key={theme.value} value={theme.value}>
                            {theme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={prefsForm.timezone}
                      onValueChange={(value) => setPrefsForm({ ...prefsForm, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={prefsForm.date_format}
                    onValueChange={(value) => setPrefsForm({ ...prefsForm, date_format: value })}
                  >
                    <SelectTrigger className="w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Use a more condensed layout</p>
                  </div>
                  <Switch
                    checked={prefsForm.compact_mode}
                    onCheckedChange={(checked) => setPrefsForm({ ...prefsForm, compact_mode: checked })}
                  />
                </div>

                <Button
                  onClick={() => updatePrefsMutation.mutate(prefsForm)}
                  disabled={updatePrefsMutation.isPending}
                >
                  {updatePrefsMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Notification Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={prefsForm.notifications_email}
                        onCheckedChange={(checked) => setPrefsForm({ ...prefsForm, notifications_email: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Browser push notifications</p>
                      </div>
                      <Switch
                        checked={prefsForm.notifications_push}
                        onCheckedChange={(checked) => setPrefsForm({ ...prefsForm, notifications_push: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Text message alerts</p>
                      </div>
                      <Switch
                        checked={prefsForm.notifications_sms}
                        onCheckedChange={(checked) => setPrefsForm({ ...prefsForm, notifications_sms: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4">Email Categories</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Registration Updates</Label>
                        <p className="text-sm text-muted-foreground">New registrations and status changes</p>
                      </div>
                      <Switch
                        checked={prefsForm.email_registrations}
                        onCheckedChange={(checked) => setPrefsForm({ ...prefsForm, email_registrations: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Payment Notifications</Label>
                        <p className="text-sm text-muted-foreground">Payment confirmations and receipts</p>
                      </div>
                      <Switch
                        checked={prefsForm.email_payments}
                        onCheckedChange={(checked) => setPrefsForm({ ...prefsForm, email_payments: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Event Reminders</Label>
                        <p className="text-sm text-muted-foreground">Upcoming games and events</p>
                      </div>
                      <Switch
                        checked={prefsForm.email_events}
                        onCheckedChange={(checked) => setPrefsForm({ ...prefsForm, email_events: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Equipment Alerts</Label>
                        <p className="text-sm text-muted-foreground">Equipment checkouts, returns, and low stock</p>
                      </div>
                      <Switch
                        checked={prefsForm.email_equipment}
                        onCheckedChange={(checked) => setPrefsForm({ ...prefsForm, email_equipment: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Team Updates</Label>
                        <p className="text-sm text-muted-foreground">Roster changes and announcements</p>
                      </div>
                      <Switch
                        checked={prefsForm.email_team_updates}
                        onCheckedChange={(checked) => setPrefsForm({ ...prefsForm, email_team_updates: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => updatePrefsMutation.mutate(prefsForm)}
                  disabled={updatePrefsMutation.isPending}
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Change Password</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Update your password to keep your account secure
                    </p>
                    <Button variant="outline" onClick={handlePasswordReset}>
                      <Key className="mr-2 h-4 w-4" />
                      Send Password Reset Email
                    </Button>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage your active login sessions
                    </p>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-muted-foreground">
                            Browser • Active now
                          </p>
                        </div>
                        <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2 text-destructive">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Irreversible actions for your account
                    </p>
                    <Button variant="destructive" disabled>
                      Delete Account
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Contact an administrator to delete your account
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab (Admin only) */}
          {isAdmin && (
            <TabsContent value="organization">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>Manage your organization configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <Button variant="outline" onClick={() => window.location.href = "/organizations"}>
                      <Building className="mr-2 h-4 w-4" />
                      Manage Organizations
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = "/schools"}>
                      <Building className="mr-2 h-4 w-4" />
                      Manage Schools
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = "/users"}>
                      <User className="mr-2 h-4 w-4" />
                      Manage Users & Roles
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = "/approvals"}>
                      <Shield className="mr-2 h-4 w-4" />
                      Pending Approvals
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Integrations Tab (Admin only) */}
          {isAdmin && (
            <TabsContent value="integrations">
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>Connect external services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" onClick={() => window.location.href = "/integrations"}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Manage Integrations
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Configure GoFan ticketing, FinalForms, and other external services.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Data Tab */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export and manage your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Export Your Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download a copy of your data in various formats
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toast({ title: "Export started", description: "You'll receive an email when ready" })}>
                      Export Profile Data
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Export started", description: "You'll receive an email when ready" })}>
                      Export Activity Log
                    </Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Data Retention</h3>
                  <p className="text-sm text-muted-foreground">
                    Your data is retained according to your organization's data retention policies.
                    Contact your administrator for more information.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
