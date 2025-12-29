import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth, AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import { MainLayout } from "@/components/layout/MainLayout";
import ChatbotPage from "./pages/ChatbotPage";
import SummarizerPage from "./pages/SummarizerPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import VoiceSearchPage from "./pages/VoiceSearchPage";
import EmergencyPage from "./pages/EmergencyPage";
import FeedbackPage from "./pages/FeedbackPage";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<VoiceSearchPage />} />
        <Route path="/chat" element={<ChatbotPage />} />
        <Route path="/voice" element={<VoiceSearchPage />} />
        <Route path="/summarizer" element={<SummarizerPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
