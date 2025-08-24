import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Pages
import Dashboard from "@/pages/dashboard";
import Search from "@/pages/search";
import Rules from "@/pages/rules";
import Downloads from "@/pages/downloads";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { toast } = useToast();

  const { data: gmailStatus } = useQuery({
    queryKey: ["/api/gmail/status"],
    refetchInterval: 10000,
  });

  const handleSignOut = () => {
    // In a real app, you'd clear tokens and redirect
    toast({
      title: "Sign Out",
      description: "Sign out functionality would be implemented here",
    });
  };

  const isConnected = gmailStatus?.connected === true;
  const userEmail = gmailStatus?.user || "demo@example.com";

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar 
        isConnected={isConnected}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />
      
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/search" component={Search} />
        <Route path="/rules" component={Rules} />
        <Route path="/downloads" component={Downloads} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
