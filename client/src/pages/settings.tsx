// 設定ページコンポーネント
// システム全体の設定と管理機能を提供
// 基本データ、履歴、ユーザー管理などのサブページを含む
import { Sidebar } from "@/components/layout/sidebar";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Users, History } from "lucide-react";
import { useState } from "react";
import { ExitButton } from "@/components/layout/exit-button";

type SettingsCard = {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
};

const settingsCards: SettingsCard[] = [
  {
    icon: Database,
    title: "基本データ処理",
    description: "システムの基本データを管理します",
    href: "/settings/basic-data",
  },
  {
    icon: Users,
    title: "ユーザー登録",
    description: "システムユーザーを管理します",
    href: "/settings/user-management",
  },
  {
    icon: History,
    title: "履歴検索",
    description: "操作履歴を確認します",
    href: "/settings/history",
  },
];

export default function Settings() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">設定</h1>
            <ExitButton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settingsCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <Card className="cursor-pointer hover:bg-secondary/50 transition-colors">
                    <CardContent className="p-6">
                      <Icon className="h-8 w-8 mb-4 text-primary" />
                      <h2 className="text-xl font-bold mb-2">{card.title}</h2>
                      <p className="text-muted-foreground">{card.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}