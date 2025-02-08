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
  Database,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  adminOnly?: boolean;
  subItems?: MenuItem[];
};

const menuItems: MenuItem[] = [
  { icon: Home, label: "ホーム", href: "/" },
  { icon: Mic, label: "音声Assistant", href: "/voice-assistant" },
  {
    icon: ClipboardCheck,
    label: "運用管理",
    href: "/operations",
    subItems: [
      { icon: ClipboardCheck, label: "仕業点検", href: "/operations?tab=inspection" },
      { icon: ClipboardCheck, label: "運用実績", href: "/operations?tab=performance" },
    ],
  },
  { icon: MessageSquare, label: "メッセージ", href: "/messages" },
  {
    icon: Settings,
    label: "設定",
    href: "/settings",
    adminOnly: true,
    subItems: [
      { icon: Database, label: "基本データ処理", href: "/settings/basic-data" },
      { icon: History, label: "履歴検索", href: "/settings/history" },
    ],
  },
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
          const isActive = location === item.href || 
            (item.subItems?.some(sub => location === sub.href) ?? false);

          return (
            <div key={item.href}>
              <Link href={item.href}>
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
              {item.subItems && isActive && (
                <div className="pl-12">
                  {item.subItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = location === subItem.href;

                    return (
                      <Link key={subItem.href} href={subItem.href}>
                        <a
                          className={cn(
                            "flex items-center gap-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                            isSubActive && "text-sidebar-accent-foreground"
                          )}
                        >
                          <SubIcon className="h-4 w-4" />
                          <span>{subItem.label}</span>
                        </a>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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