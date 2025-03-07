import { useState, useEffect } from 'react';
import { Card, CardContent } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from '../../components/ui/button';
import Inspection from './inspection';
import OperationalPlan from './operational-plan';

// キャッシュをimport OperationalPlan from './operational-plan';

// 強制的にクリアする関数
const clearCache = () => {
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  // ローカルストレージとセッションストレージもクリア
  localStorage.clear();
  sessionStorage.clear();
};

export default function Operations() {
  const [activeTab, setActiveTab] = useState("inspection");

  // コンポーネントマウント時にキャッシュをクリア
  useEffect(() => {
    clearCache();
    console.log("キャッシュをクリアしました");

    // 強制的にページをリロード（最初の1回のみ）
    const hasReloaded = sessionStorage.getItem('hasReloaded');
    if (!hasReloaded) {
      sessionStorage.setItem('hasReloaded', 'true');
      window.location.reload();
    }
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">運用管理</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          終了
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="inspection">仕業点検</TabsTrigger>
              <TabsTrigger value="operational-plan">運用計画</TabsTrigger>
            </TabsList>

            <TabsContent value="inspection" className="p-4">
              <Inspection />
            </TabsContent>

            <TabsContent value="operational-plan" className="p-4">
              <OperationalPlan />
            </TabsContent>
            </TabsContent>

            <TabsContent value="operational-plan" className="p-4">
              <OperationalPlan />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}