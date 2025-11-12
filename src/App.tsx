import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Diagnose from "./pages/Diagnose";
import CattleNew from "./pages/CattleNew";
import CattleEdit from "./pages/CattleEdit";
import Report from "./pages/Report";
import Veterinarians from "./pages/Veterinarians";
import VetProfile from "./pages/VetProfile";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
