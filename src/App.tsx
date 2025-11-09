import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Properties from "./pages/Properties";
import Kanban from "./pages/Kanban";
import Calendar from "./pages/Calendar";
import Proposals from "./pages/Proposals";
import Customers from "./pages/Customers";
import ProposalHistory from "./pages/ProposalHistory";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Navigate to="/dashboard" replace />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/leads" element={
            <ProtectedRoute>
              <AppLayout>
                <Leads />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/kanban" element={
            <ProtectedRoute>
              <AppLayout>
                <Kanban />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/properties" element={
            <ProtectedRoute>
              <AppLayout>
                <Properties />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <AppLayout>
                <Calendar />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/proposals" element={
            <ProtectedRoute>
              <AppLayout>
                <Proposals />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute>
              <AppLayout>
                <Customers />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/proposal-history" element={
            <ProtectedRoute>
              <AppLayout>
                <ProposalHistory />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
