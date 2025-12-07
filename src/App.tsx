import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Suspense, lazy } from "react";

const queryClient = new QueryClient();

// Lazy load pages to catch import errors
const Index = lazy(() => import("./pages/Index").catch(err => {
  console.error("Failed to load Index:", err);
  return { default: () => <div className="p-8 text-destructive">Failed to load Index: {err.message}</div> };
}));

const VaultDashboard = lazy(() => import("./pages/VaultDashboard").catch(err => {
  console.error("Failed to load VaultDashboard:", err);
  return { default: () => <div className="p-8 text-destructive">Failed to load VaultDashboard: {err.message}</div> };
}));

const Install = lazy(() => import("./pages/Install").catch(err => {
  console.error("Failed to load Install:", err);
  return { default: () => <div className="p-8 text-destructive">Failed to load Install: {err.message}</div> };
}));

const NotFound = lazy(() => import("./pages/NotFound").catch(err => {
  console.error("Failed to load NotFound:", err);
  return { default: () => <div className="p-8 text-destructive">Failed to load NotFound: {err.message}</div> };
}));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/vaults" element={<VaultDashboard />} />
              <Route path="/install" element={<Install />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
