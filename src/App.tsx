import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import Sports from "./pages/Sports";
import Seasons from "./pages/Seasons";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ImpersonationBanner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/schools" element={<Schools />} />
            <Route path="/schools/:id" element={<SchoolDetail />} />
            <Route path="/districts" element={<Districts />} />
            <Route path="/districts/:id" element={<DistrictDetail />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/import" element={<ImportData />} />
            <Route path="/coach" element={<CoachDashboard />} />
            {/* Priority 1: Core Setup */}
            <Route path="/sports" element={<Sports />} />
            <Route path="/seasons" element={<Seasons />} />
            <Route path="/users" element={<Users />} />
            {/* Placeholder routes */}
            <Route path="/teams" element={<Dashboard />} />
            <Route path="/registrations" element={<Dashboard />} />
            <Route path="/payments" element={<Dashboard />} />
            <Route path="/events" element={<Dashboard />} />
            <Route path="/messages" element={<Dashboard />} />
            <Route path="/reports" element={<Dashboard />} />
            <Route path="/audit-logs" element={<Dashboard />} />
            <Route path="/settings" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <AIChatbot />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
