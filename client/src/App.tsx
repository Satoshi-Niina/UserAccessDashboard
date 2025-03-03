import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import VoiceAssistant from "@/pages/voice-assistant";
import Operations from "@/pages/operations";
import Messages from "@/pages/messages";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import BasicData from "@/pages/settings/basic-data";
import History from "@/pages/settings/history";
import UserManagement from "@/pages/settings/user-management";
import InspectionItems from "@/pages/settings/inspection-items";
import { ProtectedRoute } from "./lib/protected-route";

// アプリケーションのルートコンポーネント
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={AuthPage} />
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/voice-assistant" component={VoiceAssistant} />
          <ProtectedRoute path="/operations" component={Operations} />
          <ProtectedRoute path="/messages" component={Messages} />
          <ProtectedRoute path="/settings" component={Settings} />
          <ProtectedRoute path="/settings/basic-data" component={BasicData} />
          <ProtectedRoute path="/settings/inspection-items" component={InspectionItems} />
          <ProtectedRoute path="/settings/history" component={History} />
          <ProtectedRoute path="/settings/user-management" component={UserManagement} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Router() {
  return null; // This function appears to be unused, but keeping it for compatibility
}