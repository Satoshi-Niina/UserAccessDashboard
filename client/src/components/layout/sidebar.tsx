import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Home,
  Mic,
  ClipboardCheck,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [
  { icon: Home, label: "ホーム", href: "/" },
  { icon: Mic, label: "音声Assistant", href: "/voice-assistant" },
  { icon: ClipboardCheck, label: "運用管理", href: "/operations" },
  { icon: MessageSquare, label: "メッセージ", href: "/messages" },
  { icon: Settings, label: "設定", href: "/settings", adminOnly: true },
];

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <div className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-sidebar-foreground">
          ダッシュボード
        </h1>
      </div>

      <nav className="flex-1">
        {menuItems.map((item) => {
          if (item.adminOnly && !user?.isAdmin) return null;
          
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-sidebar-border">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
