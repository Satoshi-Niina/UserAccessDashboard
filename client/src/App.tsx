// アプリケーションのルートコンポーネント
// React Queryによる状態管理とルーティングの設定を行う
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import VoiceAssistant from "@/pages/voice-assistant";
import Operations from "@/pages/operations";
import Messages from "@/pages/messages";
import Settings from "@/pages/settings";
import BasicData from "@/pages/settings/basic-data";
import History from "@/pages/settings/history";
import UserManagement from "@/pages/settings/user-management";
import InspectionItems from "@/pages/settings/inspection-items";

// アプリケーションのルートコンポーネント
export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/login" component={AuthPage} />
          <Route path="/" component={Dashboard} />
          <Route path="/voice" component={VoiceAssistant} />
          <Route path="/operations" component={Operations} />
          <Route path="/messages" component={Messages} />
          <Route path="/settings" component={Settings} />
          <Route path="/settings/basic-data" component={BasicData} />
          <Route path="/settings/inspection-items" component={InspectionItems} />
          <Route path="/settings/history" component={History} />
          <Route path="/settings/user-management" component={UserManagement} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );ings/user-management";
import InspectionItems from "@/pages/settings/inspection-items";ings/user-management";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/voice-assistant" component={VoiceAssistant} />
      <ProtectedRoute path="/operations" component={Operations} />
      <ProtectedRoute path="/messages" component={Messages} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/settings/basic-data" component={BasicData} />
      <ProtectedRoute path="/settings/history" component={History} />
      <ProtectedRoute path="/settings/user-management" component={UserManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;