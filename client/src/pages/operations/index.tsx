
import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Sidebar } from '@/components/layout/sidebar';
import { ExitButton } from '@/components/layout/exit-button';
import Inspection from './inspection'; // 仕業点検コンポーネントのインポート

export default function Operations() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("daily-inspection");
  const [hasChanges, setHasChanges] = useState(false);

  // 仕業点検コンポーネントからの変更通知を受け取るハンドラー
  const handleInspectionChanges = (hasChanges: boolean) => {
    setHasChanges(hasChanges);
  };

  // タブ切り替え前の確認
  const handleTabChange = (value: string) => {
    if (hasChanges) {
      // 確認ダイアログを表示
      if (window.confirm('保存されていない変更があります。移動しますか？')) {
        setActiveTab(value);
        setHasChanges(false);
      }
    } else {
      setActiveTab(value);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isExpanded={isMenuExpanded} setIsExpanded={setIsMenuExpanded} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="py-4 px-6 flex justify-between items-center border-b">
          <h1 className="text-xl font-semibold">運行管理システム</h1>
          <ExitButton />
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="daily-inspection">仕業点検</TabsTrigger>
              <TabsTrigger value="operation-log">運転日誌</TabsTrigger>
              <TabsTrigger value="operation-plan">運行計画</TabsTrigger>
            </TabsList>

            <TabsContent value="daily-inspection">
              <Card>
                <CardHeader>
                  <CardTitle>仕業点検</CardTitle>
                </CardHeader>
                <CardContent>
                  <Inspection onChanges={handleInspectionChanges} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operation-log">
              <Card>
                <CardHeader>
                  <CardTitle>運転日誌</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>運転日誌機能は現在開発中です。</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operation-plan">
              <Card>
                <CardHeader>
                  <CardTitle>運行計画</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>運行計画機能は現在開発中です。</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
