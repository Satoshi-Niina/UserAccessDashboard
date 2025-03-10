import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import VoiceAssistant from "@/pages/voice-assistant";
import OperationsPage from "@/pages/operations";
import InspectionPage from "@/pages/operations/inspection";
import OperationalPlanPage from "@/pages/operations/operational-plan";
import Messages from "@/pages/messages";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import BasicData from "@/pages/settings/basic-data";
import History from "@/pages/settings/history";
import UserManagement from "@/pages/settings/user-management";
import InspectionItems from "@/pages/settings/inspection-items";
import MeasurementStandards from "@/pages/settings/measurement-standards"; // Added import
import { ProtectedRoute } from "./lib/protected-route";
import React, { lazy, Suspense } from "react";
import InspectionRecords from "@/pages/settings/inspection-records"; // Added import


// アプリケーションのルートコンポーネント
export default function App() {
  const LazyInspectionPage = lazy(() => import("@/pages/operations/inspection"));
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <Switch>
            <Route path="/login" component={AuthPage} />
            <ProtectedRoute path="/voice-assistant" component={VoiceAssistant} />
            <ProtectedRoute path="/operations" component={OperationsPage} />
            <ProtectedRoute path="/operations/inspection" component={LazyInspectionPage} />
            <ProtectedRoute path="/operations/operational-plan" component={OperationalPlanPage} />
            <ProtectedRoute path="/messages" component={Messages} />
            <ProtectedRoute path="/settings/basic-data" component={BasicData} adminOnly={true} />
            <ProtectedRoute path="/settings/inspection-items" component={InspectionItems} adminOnly={true} />
            <ProtectedRoute path="/settings/history" component={History} adminOnly={true} />
            <ProtectedRoute path="/settings/user-management" component={UserManagement} adminOnly={true} />
            <ProtectedRoute path="/settings/inspection-records" component={InspectionRecords} adminOnly={true} /> {/* Added route */}
            <ProtectedRoute path="/settings" component={Settings} adminOnly={true} />
            <ProtectedRoute path="/" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Router() {
  return null; // This function appears to be unused, but keeping it for compatibility
}