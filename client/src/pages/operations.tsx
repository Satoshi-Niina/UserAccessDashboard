
import React, { useState } from "react";
import { 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableCell, 
  TableBody, 
  Table 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Operations() {
  const [activeTab, setActiveTab] = useState("daily-inspection");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  // 仮のデータ
  const manufacturers = ["メーカーA", "メーカーB", "メーカーC"];
  const models = ["機種1", "機種2", "機種3"];
  
  // 点検項目の仮データ
  const inspectionItems = [
    { id: 1, category: "エンジン", item: "オイル量確認", result: "正常" },
    { id: 2, category: "エンジン", item: "冷却水量確認", result: "正常" },
    { id: 3, category: "電気系統", item: "バッテリー電圧", result: "正常" },
    { id: 4, category: "電気系統", item: "ライト点灯確認", result: "正常" },
    { id: 5, category: "ブレーキ", item: "ブレーキオイル量", result: "正常" },
    { id: 6, category: "ブレーキ", item: "ブレーキパッド磨耗", result: "要点検" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">運用管理</h2>
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
              <div className="flex space-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">製造メーカー</label>
                  <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                    <SelectTrigger>
                      <SelectValue placeholder="メーカーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer} value={manufacturer}>
                          {manufacturer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">機種</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="機種を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedManufacturer && selectedModel && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>点検項目</TableHead>
                      <TableHead>結果</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspectionItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.result}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* エンジンアワータブ */}
        <TabsContent value="engine-hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>エンジンアワー</CardTitle>
              <CardDescription>
                エンジンアワーを記録・管理します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* エンジンアワー管理の内容をここに実装 */}
              <p>エンジンアワー管理画面（開発中）</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// デフォルトエクスポートを追加
export default Operations;
