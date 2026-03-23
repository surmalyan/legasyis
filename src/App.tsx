import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Index from "./pages/Index";
import EntryPage from "./pages/EntryPage";
import RecordPage from "./pages/RecordPage";
import ResultPage from "./pages/ResultPage";
import ArchivePage from "./pages/ArchivePage";
import AuthPage from "./pages/AuthPage";
import PaywallPage from "./pages/PaywallPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <I18nProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/entry" element={<ProtectedRoute><EntryPage /></ProtectedRoute>} />
              <Route path="/record" element={<ProtectedRoute><RecordPage /></ProtectedRoute>} />
              <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
              <Route path="/archive" element={<ProtectedRoute><ArchivePage /></ProtectedRoute>} />
              <Route path="/paywall" element={<ProtectedRoute><PaywallPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
