
import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  CardDescription,
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

  // 保存関数
  const saveChanges = async () => {
    try {
      // ここで実際のデータ保存APIを呼び出す
      // 保存成功を示すためにhasChangesをfalseに設定
      setHasChanges(false);
      return true;
    } catch (error) {
      console.error("データ保存エラー:", error);
      return false;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <div className="space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">運用管理</h2>
            <ExitButton 
              hasChanges={hasChanges}
              onSave={saveChanges}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily-inspection">仕業点検</TabsTrigger>
              <TabsTrigger value="engine-hours">エンジンアワー</TabsTrigger>
            </TabsList>
            
            {/* 仕業点検タブ */}
            <TabsContent value="daily-inspection" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>仕業点検</CardTitle>
                  <CardDescription>
                    メーカーと機種を選択して点検項目を表示します。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 仕業点検コンポーネントを直接埋め込む */}
                  <Inspection />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* エンジンアワータブ */}
            <TabsContent value="engine-hours" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>エンジンアワー記録</CardTitle>
                  <CardDescription>
                    エンジンの稼働時間を記録します。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* エンジンアワーコンポーネントの実装（現在は未実装） */}
                  <div className="text-center py-4">
                    エンジンアワー記録機能は開発中です。
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
