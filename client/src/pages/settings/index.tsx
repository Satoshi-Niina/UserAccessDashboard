
import React from 'react';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Database, List, BarChart2, History, Users } from 'lucide-react';

export default function Settings() {
  const settingsLinks = [
    {
      title: '基本データ処理',
      description: 'システムの基本データを管理します',
      icon: <Database className="h-8 w-8" />,
      href: '/settings/basic-data',
    },
    {
      title: '点検項目管理',
      description: '点検項目の追加・編集・並び替えを行います',
      icon: <List className="h-8 w-8" />,
      href: '/settings/inspection-items',
    },
    {
      title: '測定基準値設定',
      description: '点検項目の測定基準値を設定します',
      icon: <BarChart2 className="h-8 w-8" />,
      href: '/settings/measurement-standards',
    },
    {
      title: '履歴検索',
      description: '操作履歴を確認します',
      icon: <History className="h-8 w-8" />,
      href: '/settings/history',
    },
    {
      title: 'ユーザー登録',
      description: 'ユーザーの追加・編集・削除を行います',
      icon: <Users className="h-8 w-8" />,
      href: '/settings/user-management',
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">設定</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-md">{link.icon}</div>
                <div>
                  <CardTitle>{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{link.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
