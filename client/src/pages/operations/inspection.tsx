import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { InspectionItem } from "@/types/inspection";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import OperationsNav from "@/components/OperationsNav";


// 新規点検項目フォームインターフェース
interface NewInspectionItemForm {
  category: string;
  item: string;
  method?: string;
  criteria?: string;
}

export default function InspectionPage() {
  const [location, navigate] = useLocation();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [location_, setLocation] = useState<string>("");
  const [responsible, setResponsible] = useState<string>("");
  const [inspector, setInspector] = useState<string>("");
  const [manufacturer, setManufacturer] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [engineModel, setEngineModel] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [newItem, setNewItem] = useState<NewInspectionItemForm>({
    category: "",
    item: "",
  });


  // 運用計画ページへの移動
  const navigateToOperationalPlan = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm("変更が保存されていません。移動しますか？");
      if (!confirmLeave) return;
    }
    navigate("/operations/operational-plan");
  };

  // 保存処理
  const saveChanges = () => {
    // APIに保存する処理
    console.log("保存データ:", {
      date,
      startTime,
      endTime,
      location: location_,
      responsible,
      inspector,
      manufacturer,
      model,
      engineModel,
      vehicleNumber,
      items: inspectionItems,
    });

    toast({
      title: "保存完了",
      description: "仕業点検が保存されました",
    });

    setHasChanges(false);
    navigate("/operations");
  };

  // 点検結果の更新処理
  const updateInspectionResult = (id: number, result: string) => {
    setInspectionItems(
      inspectionItems.map((item) =>
        item.id === id ? { ...item, result } : item
      )
    );
    setHasChanges(true);
  };

  // 点検備考の更新処理
  const updateInspectionRemark = (id: number, remark: string) => {
    setInspectionItems(
      inspectionItems.map((item) =>
        item.id === id ? { ...item, remark } : item
      )
    );
    setHasChanges(true);
  };

  // 新規項目追加処理
  const handleAddNewItem = () => {
    if (newItem.category && newItem.item) {
      // 新しい点検項目を追加
      const newInspectionItem: InspectionItem = {
        id: Date.now(),
        manufacturer: manufacturer,
        model: model,
        category: newItem.category,
        item: newItem.item,
        method: newItem.method || "",
        criteria: newItem.criteria || "",
        result: "",
        remark: ""
      };
      setInspectionItems([...inspectionItems, newInspectionItem]);
      toast({
        title: "追加完了",
        description: "新しい点検項目を追加しました",
      });
    }
    setIsDialogOpen(false);
    setHasChanges(true);
  };

  // コンポーネントマウント時に点検項目を取得
  useEffect(() => {
    // APIから点検項目を取得する処理
    // ここではモックデータを使用
    const fetchInspectionItems = async () => {
      try {
        const response = await fetch("/api/inspection-items");
        if (response.ok) {
          const data = await response.json();
          // 取得したデータをフォーマット
          const formattedItems: InspectionItem[] = data.map((item: any, index: number) => ({
            id: index + 1,
            manufacturer: item[0] || "",
            model: item[1] || "",
            category: item[4] || "",
            item: item[5] || "",
            method: item[7] || "",
            criteria: item[6] || "",
            result: "",
            remark: ""
          }));
          setInspectionItems(formattedItems);
        }
      } catch (error) {
        console.error("点検項目の取得に失敗しました", error);
        toast({
          title: "エラー",
          description: "点検項目の取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchInspectionItems();
  }, [toast]);


  return (
    <div className="container mx-auto py-8">
      {/* ヘッダー部分 */}
      <OperationsNav currentPage="inspection" /> {/* Added Navigation Component */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">仕業点検登録</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate("/operations/operational-plan")}>
            運用計画へ
          </Button>
          <Button variant="outline" onClick={saveChanges}>
            保存して戻る
          </Button>
        </div>
      </div>

      {/* 基本情報フォーム */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
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
                    {date ? format(date, "yyyy年MM月dd日") : <span>日付を選択</span>}
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
              <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">終了時間</Label>
              <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">点検場所</Label>
              <Input id="location" placeholder="場所を入力" value={location_} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsible">責任者</Label>
              <Input id="responsible" placeholder="責任者名を入力" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspector">点検者</Label>
              <Input id="inspector" placeholder="点検者名を入力" value={inspector} onChange={(e) => setInspector(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Input id="manufacturer" placeholder="メーカー名を入力" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">機種</Label>
              <Input id="model" placeholder="機種を入力" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engineModel">エンジン型式</Label>
              <Input id="engineModel" placeholder="エンジン型式を入力" value={engineModel} onChange={(e) => setEngineModel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">車両番号</Label>
              <Input id="vehicleNumber" placeholder="車両番号を入力" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 点検項目タブ */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>点検項目</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="engine">
            <TabsList>
              <TabsTrigger value="engine">エンジン関係</TabsTrigger>
              <TabsTrigger value="brake">ブレーキ関係</TabsTrigger>
              <TabsTrigger value="other">その他</TabsTrigger>
            </TabsList>

            <TabsContent value="engine" className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">項目</th>
                      <th className="p-2 text-left">確認要領</th>
                      <th className="p-2 text-left">判断基準</th>
                      <th className="p-2 text-center w-40">判定</th>
                      <th className="p-2 text-left">備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionItems
                      .filter((item) => item.category.includes("エンジン") || item.category.includes("engine"))
                      .map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.item}</td>
                          <td className="p-2">{item.method}</td>
                          <td className="p-2">{item.criteria}</td>
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
                              placeholder="備考"
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

            <TabsContent value="brake" className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">項目</th>
                      <th className="p-2 text-left">確認要領</th>
                      <th className="p-2 text-left">判断基準</th>
                      <th className="p-2 text-center w-40">判定</th>
                      <th className="p-2 text-left">備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionItems
                      .filter((item) => item.category.includes("ブレーキ") || item.category.includes("brake"))
                      .map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.item}</td>
                          <td className="p-2">{item.method}</td>
                          <td className="p-2">{item.criteria}</td>
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
                              placeholder="備考"
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

            <TabsContent value="other" className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">項目</th>
                      <th className="p-2 text-left">確認要領</th>
                      <th className="p-2 text-left">判断基準</th>
                      <th className="p-2 text-center w-40">判定</th>
                      <th className="p-2 text-left">備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionItems
                      .filter(
                        (item) =>
                          !item.category.includes("エンジン") &&
                          !item.category.includes("engine") &&
                          !item.category.includes("ブレーキ") &&
                          !item.category.includes("brake")
                      )
                      .map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.item}</td>
                          <td className="p-2">{item.method}</td>
                          <td className="p-2">{item.criteria}</td>
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
                              placeholder="備考"
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
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import OperationsNav from "@/components/OperationsNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function InspectionPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
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
      
      <Card>
        <CardHeader>
          <CardTitle>仕業点検</CardTitle>
          <CardDescription>保守用車の点検を記録します</CardDescription>
        </CardHeader>
        <CardContent>
          <p>仕業点検のフォームをここに実装します。</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">キャンセル</Button>
          <Button>保存</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
