import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type InspectionTab = "entry" | "exit" | "periodic";
type InspectionResult = "完了" | "調整" | "補充" | "交換" | "経過観察" | "その他";

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
  notes?: string;            //特記事項
}

export default function OperationsPage() {
  const [location, setLocation] = useLocation(); // Use wouter's location hook
  const [activeTab, setActiveTab] = useState<InspectionTab>("exit");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNotesChange = (id: number, value: string) => {
    setInspectionItems(prevItems => prevItems.map(item => 
      item.id === id ? {...item, notes: value} : item
    ));
  }


  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        setLoading(true);
        // 最新のCSVファイルを取得するためにlatestパラメータを追加
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
        const notesIndex = headers.findIndex(h => h === '特記事項' || h === 'notes');

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
          const getNotes = () => notesIndex >= 0 ? values[notesIndex] || '' : '';

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
            engineType: getEngineType(),
            notes: getNotes()
          });
        }

        setInspectionItems(items);
        setLoading(false);
      } catch (err) {
        console.error('点検項目取得エラー:', err);
        setError(err instanceof Error ? err.message : '点検項目の取得に失敗しました');
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  // メイン機能の点検表
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-6">
        <div>
          {/*Removed Title*/}
        </div>

        <Card className="w-full">
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
              <Input id="startTime" placeholder="開始時間を入力" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">終了時間</Label>
              <Input id="endTime" placeholder="終了時間を入力" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">点検場所</Label>
              <Input id="location" placeholder="場所を入力" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspector">責任者</Label>
              <Input id="inspector" placeholder="責任者名を入力" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspectorId">点検者</Label>
              <Input id="inspectorId" placeholder="点検者名を入力" />
            </div>
          </div>
        </CardContent>
      </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>点検表</CardTitle>
            <CardDescription>点検項目を確認し、結果を入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="exit" value={activeTab} onValueChange={(value) => setActiveTab(value as InspectionTab)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="exit">出発前点検</TabsTrigger>
                <TabsTrigger value="periodic">仕業点検</TabsTrigger>
                <TabsTrigger value="entry">帰着点検</TabsTrigger>
              </TabsList>

        <TabsContent value="exit">
          <Card>
            <CardHeader>
              <CardTitle>出発前点検表</CardTitle>
              <CardDescription>保守用車の出発前点検を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]" style={{ width: '100%' }}>
                <div className="min-w-[1200px]">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] min-w-[100px] text-xs border">部位</TableHead>
                      <TableHead className="w-[140px] min-w-[140px] text-xs border">装置</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">確認箇所</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">判断基準</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">確認要領</TableHead>
                      <TableHead className="w-[100px] min-w-[100px] text-xs border">測定等記録</TableHead>
                      <TableHead className="w-[100px] min-w-[100px] text-xs border">図形記録</TableHead>
                      <TableHead className="w-[50px] min-w-[50px] text-xs border">結果</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">特記事項</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspectionItems.map((item, index) => (
                      <TableRow key={item.id} className="h-12">
                        <TableCell className="text-xs border py-1">{item.category}</TableCell>
                        <TableCell className="text-xs border py-1">{item.equipment}</TableCell>
                        <TableCell className="text-xs border py-1">{item.item}</TableCell>
                        <TableCell className="text-xs border py-1">{item.criteria}</TableCell>
                        <TableCell className="text-xs border py-1">{item.method}</TableCell>
                        <TableCell className="text-xs border py-1">{item.measurementRecord}</TableCell>
                        <TableCell className="text-xs border py-1">{item.diagramRecord}</TableCell>
                        <TableCell className="text-xs border py-1">
                          <Select>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="完了">完了</SelectItem>
                              <SelectItem value="調整">調整</SelectItem>
                              <SelectItem value="補充">補充</SelectItem>
                              <SelectItem value="交換">交換</SelectItem>
                              <SelectItem value="経過観察">経過観察</SelectItem>
                              <SelectItem value="その他">その他</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs border py-1">
                          <Input className="text-xs h-8" value={item.notes || ''} onChange={(e) => handleNotesChange(item.id, e.target.value)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periodic">
          <Card>
            <CardHeader>
              <CardTitle>仕業点検表</CardTitle>
              <CardDescription>保守用車の定期的な仕業点検を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]" style={{ width: '100%' }}>
                <div className="min-w-[1200px]">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] min-w-[100px] text-xs border">部位</TableHead>
                      <TableHead className="w-[140px] min-w-[140px] text-xs border">装置</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">確認箇所</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">判断基準</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">確認要領</TableHead>
                      <TableHead className="w-[100px] min-w-[100px] text-xs border">測定等記録</TableHead>
                      <TableHead className="w-[100px] min-w-[100px] text-xs border">図形記録</TableHead>
                      <TableHead className="w-[50px] min-w-[50px] text-xs border">結果</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">特記事項</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspectionItems.map((item, index) => (
                      <TableRow key={item.id} className="h-12">
                        <TableCell className="text-xs border py-1">{item.category}</TableCell>
                        <TableCell className="text-xs border py-1">{item.equipment}</TableCell>
                        <TableCell className="text-xs border py-1">{item.item}</TableCell>
                        <TableCell className="text-xs border py-1">{item.criteria}</TableCell>
                        <TableCell className="text-xs border py-1">{item.method}</TableCell>
                        <TableCell className="text-xs border py-1">{item.measurementRecord}</TableCell>
                        <TableCell className="text-xs border py-1">{item.diagramRecord}</TableCell>
                        <TableCell className="text-xs border py-1">
                          <Select>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="完了">完了</SelectItem>
                              <SelectItem value="調整">調整</SelectItem>
                              <SelectItem value="補充">補充</SelectItem>
                              <SelectItem value="交換">交換</SelectItem>
                              <SelectItem value="経過観察">経過観察</SelectItem>
                              <SelectItem value="その他">その他</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs border py-1">
                          <Input className="text-xs h-8" value={item.notes || ''} onChange={(e) => handleNotesChange(item.id, e.target.value)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry">
          <Card>
            <CardHeader>
              <CardTitle>帰着点検表</CardTitle>
              <CardDescription>保守用車の帰着点検を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]" style={{ width: '100%' }}>
                <div className="min-w-[1200px]">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] min-w-[100px] text-xs border">部位</TableHead>
                      <TableHead className="w-[140px] min-w-[140px] text-xs border">装置</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">確認箇所</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">判断基準</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">確認要領</TableHead>
                      <TableHead className="w-[100px] min-w-[100px] text-xs border">測定等記録</TableHead>
                      <TableHead className="w-[100px] min-w-[100px] text-xs border">図形記録</TableHead>
                      <TableHead className="w-[50px] min-w-[50px] text-xs border">結果</TableHead>
                      <TableHead className="w-[250px] min-w-[250px] text-xs border">特記事項</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspectionItems.map((item, index) => (
                      <TableRow key={item.id} className="h-12">
                        <TableCell className="text-xs border py-1">{item.category}</TableCell>
                        <TableCell className="text-xs border py-1">{item.equipment}</TableCell>
                        <TableCell className="text-xs border py-1">{item.item}</TableCell>
                        <TableCell className="text-xs border py-1">{item.criteria}</TableCell>
                        <TableCell className="text-xs border py-1">{item.method}</TableCell>
                        <TableCell className="text-xs border py-1">{item.measurementRecord}</TableCell>
                        <TableCell className="text-xs border py-1">{item.diagramRecord}</TableCell>
                        <TableCell className="text-xs border py-1">
                          <Select>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="完了">完了</SelectItem>
                              <SelectItem value="調整">調整</SelectItem>
                              <SelectItem value="補充">補充</SelectItem>
                              <SelectItem value="交換">交換</SelectItem>
                              <SelectItem value="経過観察">経過観察</SelectItem>
                              <SelectItem value="その他">その他</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs border py-1">
                          <Input className="text-xs h-8" value={item.notes || ''} onChange={(e) => handleNotesChange(item.id, e.target.value)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="outline">キャンセル</Button>
      <Button>点検結果を保存</Button>
    </CardFooter>
  </Card>
</div>
</div>
);
}