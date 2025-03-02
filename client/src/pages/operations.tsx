// オペレーションページコンポーネント
// 業務操作の一覧と実行機能を提供
// サイドバーとメインコンテンツのレイアウトを実装
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useEffect } from "react";

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
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">仕業点検</h2>
                    <div className="flex gap-2">
                      <Select defaultValue="manufacturer">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="フィルター選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manufacturer">製造メーカー</SelectItem>
                          <SelectItem value="modelType">機種</SelectItem>
                          <SelectItem value="part">部位</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button>
                        <ListChecks className="mr-2 h-4 w-4" />点検開始
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-muted-foreground mb-4">
                      日常の点検業務をデジタル化し、正確な記録と管理を実現します。製造メーカーや機種を選択して点検項目を表示できます。
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">堀川工機 MC300</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">点検項目: 137件</p>
                          <p className="text-sm text-muted-foreground">最終点検: 2023/5/15</p>
                          <Button variant="outline" className="w-full mt-4">選択</Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">コマツ HD785</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">点検項目: 98件</p>
                          <p className="text-sm text-muted-foreground">最終点検: 2023/5/12</p>
                          <Button variant="outline" className="w-full mt-4">選択</Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">日立建機 ZX200</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">点検項目: 112件</p>
                          <p className="text-sm text-muted-foreground">最終点検: 2023/5/8</p>
                          <Button variant="outline" className="w-full mt-4">選択</Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
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