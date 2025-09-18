import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/contexts/auth-context";

import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import InterviewPage from "@/pages/interview";
import ResultsPage from "@/pages/results";
import Analytics from "@/pages/analytics";
import HRDashboard from "@/pages/hr-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={LoginPage} />
      <Route path="/interview">
        <ProtectedRoute>
          <InterviewPage />
        </ProtectedRoute>
      </Route>
      <Route path="/results">
        <ProtectedRoute>
          <ResultsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute requireHR>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path="/hr-dashboard">
        <ProtectedRoute requireHR>
          <HRDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
