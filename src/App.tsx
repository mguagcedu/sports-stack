import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SchoolBrandingProvider } from "@/contexts/SchoolBrandingContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/guards/ProtectedRoute";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import PendingApprovals from "./pages/PendingApprovals";
import Schools from "./pages/Schools";
import SchoolDetail from "./pages/SchoolDetail";
import Organizations from "./pages/Organizations";
import Districts from "./pages/Districts";
import DistrictDetail from "./pages/DistrictDetail";
import ImportData from "./pages/ImportData";
import CoachDashboard from "./pages/CoachDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import AthleteDashboard from "./pages/AthleteDashboard";
import PermissionsMatrix from "./pages/PermissionsMatrix";
import Sports from "./pages/Sports";
import Seasons from "./pages/Seasons";
import Users from "./pages/Users";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Registrations from "./pages/Registrations";
import Events from "./pages/Events";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import JoinTeam from "./pages/JoinTeam";
import Governance from "./pages/Governance";
import SystemValidation from "./pages/SystemValidation";
import Equipment from "./pages/Equipment";
import Integrations from "./pages/Integrations";
import Volunteering from "./pages/Volunteering";
import FinancialLedger from "./pages/FinancialLedger";
import SportsCards from "./pages/SportsCards";
import Fundraising from "./pages/Fundraising";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SchoolBrandingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ImpersonationBanner />
        <BrowserRouter>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
            
            {/* Auth routes */}
            <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute requireAuth={true}><Onboarding /></ProtectedRoute>} />
            <Route path="/join/:code" element={<JoinTeam />} />
            <Route path="/join" element={<JoinTeam />} />
            
            {/* Role-specific dashboards */}
            <Route path="/dashboard" element={
              <ProtectedRoute pageKey="dashboard">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/coach" element={
              <ProtectedRoute pageKey="coach_dashboard">
                <CoachDashboard />
              </ProtectedRoute>
            } />
            <Route path="/parent" element={
              <ProtectedRoute pageKey="parent_dashboard">
                <ParentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/athlete" element={
              <ProtectedRoute pageKey="athlete_dashboard">
                <AthleteDashboard />
              </ProtectedRoute>
            } />
            
            {/* Organizations & Schools */}
            <Route path="/schools" element={
              <ProtectedRoute pageKey="schools">
                <Schools />
              </ProtectedRoute>
            } />
            <Route path="/schools/:id" element={
              <ProtectedRoute pageKey="schools">
                <SchoolDetail />
              </ProtectedRoute>
            } />
            <Route path="/districts" element={
              <ProtectedRoute pageKey="districts">
                <Districts />
              </ProtectedRoute>
            } />
            <Route path="/districts/:id" element={
              <ProtectedRoute pageKey="districts">
                <DistrictDetail />
              </ProtectedRoute>
            } />
            <Route path="/organizations" element={
              <ProtectedRoute pageKey="organizations">
                <Organizations />
              </ProtectedRoute>
            } />
            
            {/* Core Setup */}
            <Route path="/sports" element={
              <ProtectedRoute pageKey="sports">
                <Sports />
              </ProtectedRoute>
            } />
            <Route path="/seasons" element={
              <ProtectedRoute pageKey="seasons">
                <Seasons />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute pageKey="users">
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/permissions" element={
              <ProtectedRoute pageKey="settings">
                <PermissionsMatrix />
              </ProtectedRoute>
            } />
            
            {/* Teams */}
            <Route path="/teams" element={
              <ProtectedRoute pageKey="teams">
                <Teams />
              </ProtectedRoute>
            } />
            <Route path="/teams/:id" element={
              <ProtectedRoute pageKey="teams">
                <TeamDetail />
              </ProtectedRoute>
            } />
            <Route path="/sports-cards" element={
              <ProtectedRoute pageKey="teams">
                <SportsCards />
              </ProtectedRoute>
            } />
            
            {/* Operations */}
            <Route path="/registrations" element={
              <ProtectedRoute pageKey="registrations">
                <Registrations />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute pageKey="events">
                <Events />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute pageKey="payments">
                <Payments />
              </ProtectedRoute>
            } />
            
            {/* Admin */}
            <Route path="/settings" element={
              <ProtectedRoute pageKey="settings">
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute pageKey="reports">
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/audit-logs" element={
              <ProtectedRoute pageKey="audit_logs">
                <AuditLogs />
              </ProtectedRoute>
            } />
            <Route path="/governance" element={
              <ProtectedRoute pageKey="governance">
                <Governance />
              </ProtectedRoute>
            } />
            <Route path="/validation" element={
              <ProtectedRoute pageKey="validation">
                <SystemValidation />
              </ProtectedRoute>
            } />
            <Route path="/import" element={
              <ProtectedRoute pageKey="import">
                <ImportData />
              </ProtectedRoute>
            } />
            <Route path="/approvals" element={
              <ProtectedRoute pageKey="users">
                <PendingApprovals />
              </ProtectedRoute>
            } />
            <Route path="/integrations" element={
              <ProtectedRoute pageKey="integrations">
                <Integrations />
              </ProtectedRoute>
            } />
            <Route path="/equipment" element={
              <ProtectedRoute pageKey="equipment">
                <Equipment />
              </ProtectedRoute>
            } />
            <Route path="/volunteering" element={
              <ProtectedRoute pageKey="events">
                <Volunteering />
              </ProtectedRoute>
            } />
            <Route path="/finances" element={
              <ProtectedRoute pageKey="payments">
                <FinancialLedger />
              </ProtectedRoute>
            } />
            <Route path="/fundraising" element={
              <ProtectedRoute pageKey="payments">
                <Fundraising />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
          <AIChatbot />
        </TooltipProvider>
      </SchoolBrandingProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
