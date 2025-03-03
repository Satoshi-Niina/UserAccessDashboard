
import React, { useState } from 'react';
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

  // 仕業点検コンポーネントからの変更通知を受け取るハンドラー
  const handleInspectionChanges = (hasChanges: boolean) => {
    setHasChanges(hasChanges);
  };

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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebarコンポーネント - メニュー表示用 */}
      <Sidebar onExpandChange={setIsMenuExpanded} />
      
      {/* メインコンテンツエリア - サイドバーの幅に合わせて調整 */}
      <div className={`flex-1 overflow-auto p-0 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <div className="space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">運用管理</h2>
            <ExitButton 
              hasChanges={hasChanges}
              onSave={saveChanges}
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily-inspection">仕業点検</TabsTrigger>
              <TabsTrigger value="engine-hours">エンジンアワー記録</TabsTrigger>
            </TabsList>
            
            {/* 仕業点検タブ */}
            <TabsContent value="daily-inspection" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>仕業点検</CardTitle>
                  <CardDescription>
                    メーカーと機種を選択して点検項目を表示します。
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {/* 仕業点検コンポーネントを埋め込む */}
                  <Inspection onChanges={handleInspectionChanges} />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* エンジンアワータブ */}
            <TabsContent value="engine-hours" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>エンジンアワー記録</CardTitle>
                  <CardDescription>
                    エンジンの運転時間を記録・管理します。
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex justify-center items-center py-10">
                    <div className="text-center max-w-md">
                      <h3 className="text-lg font-semibold mb-2">機能開発中</h3>
                      <p className="text-muted-foreground">
                        エンジンアワー記録機能は現在開発中です。今後のアップデートをお待ちください。
                      </p>
                    </div>
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
