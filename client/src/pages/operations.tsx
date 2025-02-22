// 運用管理ページコンポーネント
// 仕業点検と運用実績の管理機能を提供
// タブ切り替えによる情報の整理を実装
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Operations() {
  const [location, setLocation] = useLocation();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const currentTab = new URLSearchParams(location.split("?")[1]).get("tab") || "inspection";

  useEffect(() => {
    if (!location.includes("?tab=")) {
      setLocation("/operations?tab=inspection");
    }
  }, [location, setLocation]);

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">運用管理</h1>
          <Tabs value={currentTab} onValueChange={(value) => setLocation(`/operations?tab=${value}`)}>
            <TabsList>
              <TabsTrigger value="inspection">仕業点検</TabsTrigger>
              <TabsTrigger value="performance">運用実績</TabsTrigger>
            </TabsList>
            <TabsContent value="inspection">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">仕業点検</h2>
                  <p className="text-muted-foreground">
                    日常の点検業務をデジタル化し、正確な記録と管理を実現します。
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="performance">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">運用実績</h2>
                  <p className="text-muted-foreground">
                    運用状況の実績を記録し、効率的な業務改善に活用します。
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}