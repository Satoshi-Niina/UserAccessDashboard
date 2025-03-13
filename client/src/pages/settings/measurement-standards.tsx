
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem,
  SelectGroup 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// 点検項目の型定義
interface InspectionItem {
  id: number;
  category: string;          // 部位
  equipment: string;         // 装置
  item: string;              // 確認箇所
  criteria: string;          // 判断基準
  method: string;            // 確認要領
  measurementRecord: string; // 測定等記録
  diagramRecord: string;     // 図形記録
  manufacturer?: string;     // 製造メーカー
  model?: string;            // 機種
  engineType?: string;       // エンジン型式
}

export default function MeasurementStandards() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(true); // Always expanded
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const { toast } = useToast();

  // 点検項目データの取得
  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        const response = await fetch('/api/inspection-items');
        if (!response.ok) {
          throw new Error(`サーバーエラー: ${response.status}`);
        }
        
        const data = await response.json();
        setInspectionItems(data);
        setFilteredItems(data);
        setLoading(false);
        
      } catch (err) {
        console.error("Error fetching inspection items:", err);
        setLoading(false);
        toast({
          title: "エラー",
          description: `データの読み込みに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`,
          variant: "destructive",
        });
        setInspectionItems([]);
        setFilteredItems([]);
      }
    };

    fetchInspectionData();
  }, [toast]);

  // フィルタリング関数
  useEffect(() => {
    let result = [...inspectionItems];
    
    // 装置でフィルタリング
    if (selectedEquipment !== "all") {
      result = result.filter(item => item.equipment === selectedEquipment);
    }
    
    // 部位でフィルタリング
    if (selectedCategory !== "all") {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    // 機種でフィルタリング
    if (selectedModel !== "all") {
      result = result.filter(item => item.model === selectedModel);
    }
    
    setFilteredItems(result);
  }, [selectedEquipment, selectedCategory, selectedModel, inspectionItems]);

  // ユニークな装置・部位・機種リストの作成
  const uniqueEquipments = Array.from(
    new Set(inspectionItems.map(item => item.equipment))
  ).filter(equipment => equipment && equipment.trim() !== '');

  const uniqueCategories = Array.from(
    new Set(inspectionItems.map(item => item.category))
  ).filter(category => category && category.trim() !== '');

  const uniqueModels = Array.from(
    new Set(inspectionItems.map(item => item.model))
  ).filter(model => model && model.trim() !== '');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="hidden lg:block border-r" expanded={isMenuExpanded}>
          <div className="space-y-4 py-4">
            <div className="px-4 py-2">
              <h2 className="text-lg font-semibold">設定</h2>
            </div>
          </div>
        </Sidebar>
        <div className="flex-1">
          <div className="container mx-auto">
            <PageHeader
              title="測定基準値設定"
              description="測定基準値の管理"
            />
            <div className="pt-2">
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 装置フィルター */}
                    <div className="space-y-2">
                      <Label htmlFor="equipment-filter">装置</Label>
                      <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                        <SelectTrigger id="equipment-filter">
                          <SelectValue placeholder="装置を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="all">すべて表示</SelectItem>
                            {uniqueEquipments.map((equipment) => (
                              <SelectItem key={equipment} value={equipment}>
                                {equipment}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 部位フィルター */}
                    <div className="space-y-2">
                      <Label htmlFor="category-filter">部位</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger id="category-filter">
                          <SelectValue placeholder="部位を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="all">すべて表示</SelectItem>
                            {uniqueCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 機種フィルター */}
                    <div className="space-y-2">
                      <Label htmlFor="model-filter">機種</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger id="model-filter">
                          <SelectValue placeholder="機種を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="all">すべて表示</SelectItem>
                            {uniqueModels.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="rounded-md border">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">部位</TableHead>
                          <TableHead className="w-[100px]">装置</TableHead>
                          <TableHead className="w-[150px]">機種</TableHead>
                          <TableHead className="w-[150px]">確認箇所</TableHead>
                          <TableHead className="w-[200px]">判断基準</TableHead>
                          <TableHead className="w-[200px]">確認要領</TableHead>
                          <TableHead className="w-[120px]">測定等記録</TableHead>
                          <TableHead className="w-[120px]">図形記録</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              データ読み込み中...
                            </TableCell>
                          </TableRow>
                        ) : filteredItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              表示するデータがありません
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.category}</TableCell>
                              <TableCell>{item.equipment}</TableCell>
                              <TableCell>{item.model}</TableCell>
                              <TableCell>{item.item}</TableCell>
                              <TableCell>{item.criteria}</TableCell>
                              <TableCell>{item.method}</TableCell>
                              <TableCell>{item.measurementRecord}</TableCell>
                              <TableCell>{item.diagramRecord}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
