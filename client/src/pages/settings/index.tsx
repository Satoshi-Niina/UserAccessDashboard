import { Sidebar } from "@/components/layout/sidebar";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Users, History } from "lucide-react";

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
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">設定</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="cursor-pointer hover:bg-accent transition-colors">
                  <CardContent className="p-6">
                    <Icon className="h-8 w-8 mb-4 text-primary" />
                    <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
                    <p className="text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
