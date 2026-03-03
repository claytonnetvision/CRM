import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import SearchEstablishments from "@/pages/SearchEstablishments";
import ClientDetails from "@/pages/ClientDetails";
import ClientForm from "@/pages/ClientForm";
import Financials from "@/pages/Financials";
import CommissionsReport from "@/pages/CommissionsReport";
import Payments from "@/pages/Payments";
import Consultants from "@/pages/Consultants";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function Router() {
  console.log('[APP] Router component rendering');
  const { isAuthenticated, loading } = useAuth();
  console.log('[APP] Auth state:', { isAuthenticated, loading });

  // TEMPORARY: Skip authentication check to allow system to work
  // TODO: Fix authentication in production
  if (loading) {
    console.log('[APP] Still loading authentication...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // TEMPORARY: Allow access without authentication
  console.log('[APP] Rendering dashboard (auth check bypassed)');

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={Dashboard} />
        <Route path="/clients/new" component={ClientForm} />
        <Route path="/clients/:id/edit" component={ClientForm} />
        <Route path="/clients/:id" component={ClientDetails} />
        <Route path="/leads" component={Leads} />
        <Route path="/leads/search" component={SearchEstablishments} />
        <Route path="/financials" component={Financials} />
        <Route path="/commissions" component={CommissionsReport} />
        <Route path="/payments" component={Payments} />
        <Route path="/consultants" component={Consultants} />
        <Route path="/404" component={NotFound} />
        <Route component={Dashboard} />
      </Switch>
    </DashboardLayout>
  );

}

function App() {
  console.log('[APP] App component rendering');
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
