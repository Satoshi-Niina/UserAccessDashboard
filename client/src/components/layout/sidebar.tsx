// サイドバーコンポーネント
// アプリケーションのナビゲーションメニューを提供
// 展開/折りたたみ可能なレスポンシブなデザイン
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useRoute } from "wouter"; // Assuming this hook exists
import {
  Home,
  Mic,
  ClipboardCheck,
  MessageSquare,
  Settings,
  LogOut,
  Database,
  History,
  Users,
  ChevronRight,
  BarChart2,
  List,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  adminOnly?: boolean;
  subItems?: MenuItem[];
};

const menuItems: MenuItem[] = [
  { icon: Home, label: "ホーム", href: "/" },
  { icon: Mic, label: "応急対応サポート", href: "/voice-assistant" },
  {
    icon: ClipboardCheck,
    label: "運用管理",
    href: "/operations",
    subItems: [
      { icon: ClipboardCheck, label: "仕業点検", href: "/operations/inspection" },
      { icon: Calendar, label: "運用計画", href: "/operations/operational-plan" },
    ],
  },
  { icon: MessageSquare, label: "メッセージ", href: "/messages" },
  {
    icon: Settings,
    label: "設定",
    href: "/settings",
    adminOnly: true,
    subItems: [
      { icon: Database, label: "応急対応サポートデータ処理", href: "/settings/tech-support-data" },
      { icon: List, label: "点検項目管理", href: "/settings/inspection-items" }, // Changed label here
      { icon: BarChart2, label: "測定基準値設定", href: "/settings/measurement-standards" },
      { icon: List, label: "点検実績管理", href: "/settings/inspection-records" }, // Added Inspection Records
      { icon: History, label: "履歴検索", href: "/settings/history" },
      { icon: Users, label: "ユーザー登録", href: "/settings/user-management" },
    ],
  },
];

interface SidebarProps {
  onExpandChange?: (expanded: boolean) => void;
}

export function Sidebar({ onExpandChange }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSettingsRoute] = useRoute("/settings*");

  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  // サイドバーの展開/折りたたみを切り替える
  const toggleSidebar = () => {
    // 設定ページの場合はサイドバーを常に展開する
    if (isSettingsRoute && !isExpanded) {
      setIsExpanded(true);
      if (onExpandChange) {
        onExpandChange(true);
      }
      return;
    }

    setIsExpanded(!isExpanded);
    if (onExpandChange) {
      onExpandChange(!isExpanded);
    }
  };

  // 設定ページの場合、サイドバーを常に展開する
  useEffect(() => {
    if (isSettingsRoute && !isExpanded) {
      setIsExpanded(true);
      if (onExpandChange) {
        onExpandChange(true);
      }
    }
  }, [isSettingsRoute, isExpanded, onExpandChange]);


  return (
    <div
      className={cn(
        "fixed h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        isExpanded ? "w-64" : "w-16"
      )}
      //onMouseEnter={() => setIsExpanded(true)}
      //onMouseLeave={() => setIsExpanded(false)}
    >
      {/* サイドバーの展開・収納トリガー */}
      <div
        className={cn(
          "absolute top-1/2 -right-3 w-6 h-12 bg-sidebar border border-sidebar-border rounded-r-lg flex items-center justify-center cursor-pointer transition-opacity",
          isExpanded ? "opacity-0" : "opacity-100"
        )}
        onClick={toggleSidebar}
      >
        <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
      </div>

      <div className={cn("p-6", !isExpanded && "hidden")}>
        <h1 className="text-2xl font-bold text-sidebar-foreground">
          ダッシュボード
        </h1>
      </div>

      <nav className="flex-1">
        {menuItems.filter(item => !item.adminOnly || (user && user.isAdmin)).map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.subItems && item.subItems.some(subItem => location === subItem.href));
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <div key={item.href}>
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex items-center p-3 mx-3 rounded-lg cursor-pointer",
                    isActive ? "bg-sidebar-selected text-sidebar-foreground font-medium" : "text-sidebar-muted hover:bg-sidebar-hover"
                  )}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {isExpanded && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {hasSubItems && <ChevronRight className={cn("h-4 w-4 transition-transform", isActive && "rotate-90")} />}
                    </div>
                  )}
                </div>
              </Link>

              {/* サブメニューの表示 */}
              {isExpanded && isActive && hasSubItems && (
                <div className="ml-10 space-y-1">
                  {item.subItems
                    ?.filter(subItem => !subItem.adminOnly || (user && user.isAdmin))
                    // サブメニューを指定した順序に並び替え
                    .sort((a, b) => {
                      const order = [
                        "点検実績管理",
                        "履歴検索",
                        "技術支援データ処理",
                        "点検項目管理", // Changed label here
                        "測定基準値設定", 
                        "測定基準編集",
                        "ユーザー登録"
                      ];
                      const indexA = order.indexOf(a.label);
                      const indexB = order.indexOf(b.label);
                      if (indexA === -1) return 1; // リストにないものは後ろへ
                      if (indexB === -1) return -1; // リストにないものは後ろへ
                      if (a.label === "ユーザー登録" && b.label !== "ユーザー登録") return 1; // ユーザー登録を最後に
                      if (a.label !== "ユーザー登録" && b.label === "ユーザー登録") return -1; // ユーザー登録を最後に
                      return indexA - indexB;
                    })
                    .map((subItem, index, arr) => (
                      <>
                        {/* ユーザー登録の前に1行空ける */}
                        {index > 0 && subItem.label === "ユーザー登録" && (
                          <div className="h-2"></div>
                        )}
                        <Link key={subItem.href} href={subItem.href}>
                          <div 
                            className={cn(
                              "flex items-center p-2 rounded-md text-sm",
                              location === subItem.href ? "bg-sidebar-selected/50 text-sidebar-foreground font-medium" : "text-sidebar-muted hover:bg-sidebar-hover"
                            )}
                          >
                            {subItem.label}
                          </div>
                        </Link>
                      </>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={cn("p-6 border-t border-sidebar-border", !isExpanded && "hidden")}>
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