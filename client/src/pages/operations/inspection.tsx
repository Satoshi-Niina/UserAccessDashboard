import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import OperationsNav from "@/components/OperationsNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// 点検項目インターフェース
interface InspectionItem {
  id: number;
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
  measurementRecord: string;
  diagramRecord: string;
  result?: string;
  remark?: string;
  manufacturer?: string;
  model?: string;
  engineType?: string;
}

export default function InspectionPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("engine");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [location_, setLocation] = useState<string>("");
  const [responsible, setResponsible] = useState<string>("");
  const [inspector, setInspector] = useState<string>("");
  const [manufacturer, setManufacturer] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [engineType, setEngineType] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState<string>("");

  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items?latest=true');

        if (!response.ok) {
          throw new Error('点検項目の取得に失敗しました');
        }

        const csvText = await response.text();

        // CSVパース（簡易的な実装）
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');

        // ヘッダーのインデックスを取得
        const categoryIndex = headers.findIndex(h => h === '部位' || h === 'category');
        const equipmentIndex = headers.findIndex(h => h === '装置' || h === 'equipment');
        const itemIndex = headers.findIndex(h => h === '確認箇所' || h === 'item');
        const criteriaIndex = headers.findIndex(h => h === '判断基準' || h === 'criteria');
        const methodIndex = headers.findIndex(h => h === '確認要領' || h === 'method');
        const measurementRecordIndex = headers.findIndex(h => h === '測定等記録' || h === 'measurementRecord');
        const diagramRecordIndex = headers.findIndex(h => h === '図形記録' || h === 'diagramRecord');
        const idIndex = headers.findIndex(h => h === 'id');
        const manufacturerIndex = headers.findIndex(h => h === '製造メーカー' || h === 'manufacturer');
        const modelIndex = headers.findIndex(h => h === '機種' || h === 'model');
        const engineTypeIndex = headers.findIndex(h => h === 'エンジン型式' || h === 'engineType');

        // CSVから点検項目を作成
        const items: InspectionItem[] = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // 空行をスキップ

          const values = rows[i].split(',');

          // 各カラムの値を取得（存在しない場合は空文字）
          const getId = () => idIndex >= 0 ? parseInt(values[idIndex]) || i : i;
          const getCategory = () => categoryIndex >= 0 ? values[categoryIndex] || '' : '';
          const getEquipment = () => equipmentIndex >= 0 ? values[equipmentIndex] || '' : '';
          const getItem = () => itemIndex >= 0 ? values[itemIndex] || '' : '';
          const getCriteria = () => criteriaIndex >= 0 ? values[criteriaIndex] || '' : '';
          const getMethod = () => methodIndex >= 0 ? values[methodIndex] || '' : '';
          const getMeasurementRecord = () => measurementRecordIndex >= 0 ? values[measurementRecordIndex] || '' : '';
          const getDiagramRecord = () => diagramRecordIndex >= 0 ? values[diagramRecordIndex] || '' : '';
          const getManufacturer = () => manufacturerIndex >= 0 ? values[manufacturerIndex] || '' : '';
          const getModel = () => modelIndex >= 0 ? values[modelIndex] || '' : '';
          const getEngineType = () => engineTypeIndex >= 0 ? values[engineTypeIndex] || '' : '';

          items.push({
            id: getId(),
            category: getCategory(),
            equipment: getEquipment(),
            item: getItem(),
            criteria: getCriteria(),
            method: getMethod(),
            measurementRecord: getMeasurementRecord(),
            diagramRecord: getDiagramRecord(),
            manufacturer: getManufacturer(),
            model: getModel(),
            engineType: getEngineType()
          });
        }

        setInspectionItems(items);
        setLoading(false);
      } catch (err) {
        console.error('点検項目取得エラー:', err);
        toast({
          title: "エラー",
          description: "点検項目の取得に失敗しました",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, [toast]);

  const updateInspectionResult = (id: number, result: string) => {
    setInspectionItems(prevItems => prevItems.map(item =>
      item.id === id ? {...item, result} : item
    ));
  };

  const updateInspectionRemark = (id: number, remark: string) => {
    setInspectionItems(prevItems => prevItems.map(item =>
      item.id === id ? {...item, remark} : item
    ));
  };

  return (
    <div className="container mx-auto py-8">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">仕業点検</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate("/operations")}>
            戻る
          </Button>
        </div>
      </div>

      {/* 運用画面ナビゲーション */}
      <OperationsNav currentPage="inspection" />

      {/* 点検基本情報 */}
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>点検基本情報</CardTitle>
          <CardDescription>点検の基本情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">点検日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "yyyy年MM月dd日") : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">開始時間</Label>
              <Input 
                id="startTime" 
                placeholder="開始時間を入力" 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">終了時間</Label>
              <Input 
                id="endTime" 
                placeholder="終了時間を入力" 
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">点検場所</Label>
              <Input 
                id="location" 
                placeholder="場所を入力"
                value={location_}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsible">責任者</Label>
              <Input 
                id="responsible" 
                placeholder="責任者名を入力"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspector">点検者</Label>
              <Input 
                id="inspector" 
                placeholder="点検者名を入力"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Input 
                id="manufacturer" 
                placeholder="製造メーカーを入力"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">機種</Label>
              <Input 
                id="model" 
                placeholder="機種を入力"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engineType">エンジン型式</Label>
              <Input 
                id="engineType" 
                placeholder="エンジン型式を入力"
                value={engineType}
                onChange={(e) => setEngineType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">車両番号</Label>
              <Input 
                id="vehicleNumber" 
                placeholder="車両番号を入力"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 点検項目タブ */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>点検項目</CardTitle>
          <CardDescription>点検項目を確認し、結果を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="engine" value={activeTab} onValueChange={(value) => setActiveTab(value)}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="engine">エンジン関係</TabsTrigger>
              <TabsTrigger value="brake">ブレーキ関係</TabsTrigger>
              <TabsTrigger value="other">その他</TabsTrigger>
            </TabsList>

            <TabsContent value="engine">
              <div className="border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left w-20">部位</th>
                      <th className="p-2 text-left w-24">装置</th>
                      <th className="p-2 text-left w-32">確認箇所</th>
                      <th className="p-2 text-left w-32">判断基準</th>
                      <th className="p-2 text-left w-32">確認要領</th>
                      <th className="p-2 text-left w-24">測定等記録</th>
                      <th className="p-2 text-left w-24">図形記録</th>
                      <th className="p-2 text-center w-20">判定</th>
                      <th className="p-2 text-left w-32">記事</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionItems
                      .filter((item) => 
                        item.category.toLowerCase().includes("エンジン") || 
                        item.category.toLowerCase().includes("engine"))
                      .map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.category}</td>
                          <td className="p-2">{item.equipment}</td>
                          <td className="p-2">{item.item}</td>
                          <td className="p-2">{item.criteria}</td>
                          <td className="p-2">{item.method}</td>
                          <td className="p-2">{item.measurementRecord}</td>
                          <td className="p-2">{item.diagramRecord}</td>
                          <td className="p-2">
                            <div className="flex justify-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  id={`ok-${item.id}`}
                                  checked={item.result === "OK"}
                                  onCheckedChange={() => updateInspectionResult(item.id, "OK")}
                                />
                                <label htmlFor={`ok-${item.id}`}>良</label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  id={`ng-${item.id}`}
                                  checked={item.result === "NG"}
                                  onCheckedChange={() => updateInspectionResult(item.id, "NG")}
                                />
                                <label htmlFor={`ng-${item.id}`}>否</label>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Input
                              placeholder="記事"
                              value={item.remark || ""}
                              onChange={(e) => updateInspectionRemark(item.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="brake">
              <div className="border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left w-20">部位</th>
                      <th className="p-2 text-left w-24">装置</th>
                      <th className="p-2 text-left w-32">確認箇所</th>
                      <th className="p-2 text-left w-32">判断基準</th>
                      <th className="p-2 text-left w-32">確認要領</th>
                      <th className="p-2 text-left w-24">測定等記録</th>
                      <th className="p-2 text-left w-24">図形記録</th>
                      <th className="p-2 text-center w-20">判定</th>
                      <th className="p-2 text-left w-32">記事</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionItems
                      .filter((item) => 
                        item.category.toLowerCase().includes("ブレーキ") || 
                        item.category.toLowerCase().includes("brake"))
                      .map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.category}</td>
                          <td className="p-2">{item.equipment}</td>
                          <td className="p-2">{item.item}</td>
                          <td className="p-2">{item.criteria}</td>
                          <td className="p-2">{item.method}</td>
                          <td className="p-2">{item.measurementRecord}</td>
                          <td className="p-2">{item.diagramRecord}</td>
                          <td className="p-2">
                            <div className="flex justify-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  id={`ok-${item.id}`}
                                  checked={item.result === "OK"}
                                  onCheckedChange={() => updateInspectionResult(item.id, "OK")}
                                />
                                <label htmlFor={`ok-${item.id}`}>良</label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  id={`ng-${item.id}`}
                                  checked={item.result === "NG"}
                                  onCheckedChange={() => updateInspectionResult(item.id, "NG")}
                                />
                                <label htmlFor={`ng-${item.id}`}>否</label>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Input
                              placeholder="記事"
                              value={item.remark || ""}
                              onChange={(e) => updateInspectionRemark(item.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="other">
              <div className="border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left w-20">部位</th>
                      <th className="p-2 text-left w-24">装置</th>
                      <th className="p-2 text-left w-32">確認箇所</th>
                      <th className="p-2 text-left w-32">判断基準</th>
                      <th className="p-2 text-left w-32">確認要領</th>
                      <th className="p-2 text-left w-24">測定等記録</th>
                      <th className="p-2 text-left w-24">図形記録</th>
                      <th className="p-2 text-center w-20">判定</th>
                      <th className="p-2 text-left w-32">記事</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionItems
                      .filter((item) => 
                        !item.category.toLowerCase().includes("エンジン") && 
                        !item.category.toLowerCase().includes("engine") &&
                        !item.category.toLowerCase().includes("ブレーキ") &&
                        !item.category.toLowerCase().includes("brake"))
                      .map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.category}</td>
                          <td className="p-2">{item.equipment}</td>
                          <td className="p-2">{item.item}</td>
                          <td className="p-2">{item.criteria}</td>
                          <td className="p-2">{item.method}</td>
                          <td className="p-2">{item.measurementRecord}</td>
                          <td className="p-2">{item.diagramRecord}</td>
                          <td className="p-2">
                            <div className="flex justify-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  id={`ok-${item.id}`}
                                  checked={item.result === "OK"}
                                  onCheckedChange={() => updateInspectionResult(item.id, "OK")}
                                />
                                <label htmlFor={`ok-${item.id}`}>良</label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  id={`ng-${item.id}`}
                                  checked={item.result === "NG"}
                                  onCheckedChange={() => updateInspectionResult(item.id, "NG")}
                                />
                                <label htmlFor={`ng-${item.id}`}>否</label>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Input
                              placeholder="記事"
                              value={item.remark || ""}
                              onChange={(e) => updateInspectionRemark(item.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/operations")}>キャンセル</Button>
          <Button>点検結果を保存</Button>
        </CardFooter>
      </Card>
    </div>
  );
}