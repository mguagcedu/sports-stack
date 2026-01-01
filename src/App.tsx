import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SchoolBrandingProvider } from "@/contexts/SchoolBrandingContext";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SchoolBrandingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ImpersonationBanner />
        <BrowserRouter>
          <Routes>
            {/* Role-specific dashboards */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/coach" element={<CoachDashboard />} />
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/athlete" element={<AthleteDashboard />} />
            
            {/* Auth */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Organizations & Schools */}
            <Route path="/schools" element={<Schools />} />
            <Route path="/schools/:id" element={<SchoolDetail />} />
            <Route path="/districts" element={<Districts />} />
            <Route path="/districts/:id" element={<DistrictDetail />} />
            <Route path="/organizations" element={<Organizations />} />
            
            {/* Core Setup */}
            <Route path="/sports" element={<Sports />} />
            <Route path="/seasons" element={<Seasons />} />
            <Route path="/users" element={<Users />} />
            <Route path="/permissions" element={<PermissionsMatrix />} />
            
            {/* Teams */}
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:id" element={<TeamDetail />} />
            <Route path="/join/:code" element={<JoinTeam />} />
            <Route path="/join" element={<JoinTeam />} />
            
            {/* Operations */}
            <Route path="/registrations" element={<Registrations />} />
            <Route path="/events" element={<Events />} />
            <Route path="/payments" element={<Payments />} />
            
            {/* Admin */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/governance" element={<Governance />} />
            <Route path="/validation" element={<SystemValidation />} />
            <Route path="/import" element={<ImportData />} />
            
            {/* Placeholder routes */}
            <Route path="/messages" element={<Dashboard />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
          <AIChatbot />
        </TooltipProvider>
      </SchoolBrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
