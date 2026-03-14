import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Diagnose from "./pages/Diagnose";
import CattleNew from "./pages/CattleNew";
import CattleEdit from "./pages/CattleEdit";
import Report from "./pages/Report";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Appointments from "./pages/Appointments";
import AppointmentNew from "./pages/AppointmentNew";
import Vaccinations from "./pages/Vaccinations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/diagnose" element={<Diagnose />} />
            <Route path="/cattle/new" element={<CattleNew />} />
            <Route path="/cattle/edit/:cattleId" element={<CattleEdit />} />
            <Route path="/report/:reportId" element={<Report />} />
            <Route path="/veterinarians" element={<Veterinarians />} />
            <Route path="/vet-profile" element={<VetProfile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/new" element={<AppointmentNew />} />
            <Route path="/vaccinations" element={<Vaccinations />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
