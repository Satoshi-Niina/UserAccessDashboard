import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType<any>;
  adminOnly?: boolean;
};

export const ProtectedRoute = ({ component: Component, adminOnly = false, ...rest }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // ユーザーが認証されていない場合はログインページにリダイレクト
  if (!user) {
    return <Redirect to="/login" />;
  }

  // 管理者専用ルートの場合、管理者権限チェック
  if (adminOnly && !user.isAdmin) {
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
};