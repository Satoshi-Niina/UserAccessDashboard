import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import OperationsNav from "@/components/OperationsNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InspectionValueStatus from "@/components/InspectionValueStatus";


interface InspectionItem {
  id: number;
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
  measurementRecord: string;
  diagramRecord: string;
  manufacturer?: string;
  model?: string;
  engineType?: string;
  result?: string;
  remark?: string;
}

const resultOptions = [
  "良好",
  "補給・給脂",
  "修繕",
  "経過観察",
  "その他"
];

type InspectionTab = "general";

interface StandardValue {
  category: string;
  equipment: string;
  item: string;
  manufacturer?: string;
  model?: string;
  minValue: number;
  maxValue: number;
}

const standardValues: StandardValue[] = [
  { category: "ブレーキ", equipment: "ブレーキシリンダー", item: "ブレーキストローク", minValue: 0.5, maxValue: 1.5 },
  { category: "ブレーキ", equipment: "ブレーキシリンダー", item: "ブレーキパッド厚", minValue: 2, maxValue: 10 },
  // ... 他の測定基準を追加
];

const findStandardValue = (item: InspectionItem) => {
  if (!standardValues || standardValues.length === 0) {
    console.log('基準値データが存在しません');
    return null;
  }

  const matchConditions = [
    { field: 'manufacturer', itemField: 'manufacturer' },
    { field: 'model', itemField: 'model' },
    { field: 'category', itemField: 'category' },
    { field: 'equipment', itemField: 'equipment' },
    { field: 'item', itemField: 'item' }
  ];

  const matchedStandard = standardValues.find(standard => {
    const isMatch = matchConditions.every(condition => {
      const standardValue = standard[condition.field];
      const itemValue = item[condition.itemField];

      if (standardValue === undefined || itemValue === undefined) return true;

      return standardValue === itemValue;
    });

    return isMatch;
  });

  if (matchedStandard) {
    console.log(`基準値が見つかりました: 項目=${item.item}, 最小値=${matchedStandard.minValue}, 最大値=${matchedStandard.maxValue}`);
  } else {
    console.log(`基準値が見つかりません: 項目=${item.item}, カテゴリ=${item.category}, 装置=${item.equipment}`);
  }

  return matchedStandard || null;
};

// 測定基準値データを取得する関数
const fetchMeasurementStandards = async () => {
  try {
    const response = await fetch('/api/files/測定基準値_20250313.csv');
    if (!response.ok) {
      throw new Error('測定基準値の取得に失敗しました');
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');

    const manufacturerIndex = headers.findIndex(h => h === '製造メーカー' || h === 'manufacturer');
    const modelIndex = headers.findIndex(h => h === '機種' || h === 'model');
    const engineTypeIndex = headers.findIndex(h => h === 'エンジン型式' || h === 'engineType');
    const categoryIndex = headers.findIndex(h => h === '部位' || h === 'category');
    const equipmentIndex = headers.findIndex(h => h === '装置' || h === 'equipment');
    const itemIndex = headers.findIndex(h => h === '確認箇所' || h === 'item');
    const minValueIndex = headers.findIndex(h => h === 'minValue');
    const maxValueIndex = headers.findIndex(h => h === 'maxValue');

    const standards = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',');

      if (values.length < Math.max(manufacturerIndex, modelIndex, categoryIndex, equipmentIndex, itemIndex, minValueIndex, maxValueIndex) + 1) {
        continue;
      }

      standards.push({
        manufacturer: values[manufacturerIndex],
        model: values[modelIndex],
        engineType: engineTypeIndex >= 0 ? values[engineTypeIndex] : undefined,
        category: values[categoryIndex],
        equipment: values[equipmentIndex],
        item: values[itemIndex],
        minValue: parseFloat(values[minValueIndex]),
        maxValue: parseFloat(values[maxValueIndex])
      });
    }

    return standards;
  } catch (error) {
    console.error('測定基準値取得エラー:', error);
    return [];
  }
};

export default function InspectionPage() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<InspectionTab>("general");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBasicInfo, setShowBasicInfo] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [inspectorInput, setInspectorInput] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollIndicatorWidth, setScrollIndicatorWidth] = useState(100);
  const [scrollIndicatorLeft, setScrollIndicatorLeft] = useState(0);
  const [filterCriteria, setFilterCriteria] = useState({ category: "all", equipment: "all", result: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [measurementRecords, setMeasurementRecords] = useState<Record<number, string>>({});
  const [fileName, setFileName] = useState(""); // Add filename state
  const [uncheckedItemsDialog, setUncheckedItemsDialog] = useState<InspectionItem[]>([]); // Add state for unchecked items dialog

  // 測定記録の読み込み
  const loadMeasurementRecords = async () => {
    try {
      const response = await fetch('/api/measurement-records');
      if (response.ok) {
        const data = await response.json();
        setMeasurementRecords(data);
      }
    } catch (error) {
      console.error('測定記録の読み込みエラー:', error);
    }
  };

  useEffect(() => {
    const fetchInspectionItems = async () => {
      setLoading(true);
      try {
        await loadMeasurementRecords();
        const response = await fetch('/api/inspection-items?useLatest=true');
        const data = await response.json();

        console.log('点検項目データ取得:', data.length, '件');

        const items = [];
        const headerMapping = {
          '製造メーカー': 'manufacturer',
          '機種': 'model',
          'エンジン型式': 'engineType',
          '部位': 'category',
          '装置': 'equipment',
          '確認箇所': 'item',
          '判断基準': 'criteria',
          '確認要領': 'method',
          '測定等記録': 'measurementRecord',
          '図形記録': 'diagramRecord',
          '備考': 'remark'
        };

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || Object.keys(row).length === 0) continue;

          const item: any = { id: i + 1 };
          Object.keys(row).forEach(header => {
            const propName = headerMapping[header] || header;
            item[propName] = row[header] || '';
          });

          const requiredProps = ['category', 'equipment', 'item', 'criteria'];
          const hasRequiredProps = requiredProps.every(prop => item.hasOwnProperty(prop));

          if (hasRequiredProps) {
            items.push(item);
          }
        }

        console.log('変換後の点検項目:', items.length, '件');
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

  const handleComplete = async () => {
    // チェック漏れの項目を確認
    const uncheckedItems = inspectionItems.filter(item => !item.result);
    setUncheckedItemsDialog(uncheckedItems); // Update state for unchecked items dialog

    if (uncheckedItems.length > 0) {
      // チェック漏れがある場合、アラートを表示し、処理を中断
      // Alert is now handled by the dialog
      return;
    }

    // すべてチェック済みの場合、保存処理を実行
    const saveData = { inspectionItems, date, startTime, endTime, locationInput, responsiblePerson, inspectorInput, vehicleId };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'inspection_results.json';
    link.click();
    URL.revokeObjectURL(url);


    try {
      const response = await fetch('/api/inspection-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inspectionItems, date, startTime, endTime, locationInput, responsiblePerson, inspectorInput, vehicleId })
      });

      if (!response.ok) {
        throw new Error(`保存失敗: ${response.status} ${response.statusText}`);
      }

      toast({
        title: "点検完了",
        description: "点検結果が保存されました",
        variant: "success",
      });
      navigate('/operations'); //保存後に遷移


    } catch (error) {
      toast({
        title: "エラー",
        description: `点検結果の保存に失敗しました: ${error}`,
        variant: "destructive",
      });
      console.error("保存エラー:", error);
    }
  };

  const handleCancel = () => {
    if (window.confirm("点検をキャンセルしますか？変更内容は破棄されます。")) {
      window.location.href = '/';
    }
  };

  const updateInspectionMeasurementRecord = (id: number, value: string) => {
    setInspectionItems(
      inspectionItems.map(item =>
        item.id === id ? { ...item, measurementRecord: value } : item
      )
    );
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      const maxScrollLeft = scrollWidth - clientWidth;

      if (maxScrollLeft > 0) {
        const indicatorWidth = Math.max((clientWidth / scrollWidth) * 100, 10);
        const indicatorLeft = (scrollLeft / maxScrollLeft) * (100 - indicatorWidth);

        setScrollIndicatorWidth(indicatorWidth);
        setScrollIndicatorLeft(indicatorLeft);
      } else {
        setScrollIndicatorWidth(100);
        setScrollIndicatorLeft(0);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    handleScroll();

    const intervalId = setInterval(handleScroll, 1000);

    return () => {
      window.removeEventListener('resize', handleScroll);
      scrollContainer.removeEventListener('scroll', handleScroll);
      clearInterval(intervalId);
    };
  }, [showBasicInfo, inspectionItems]);

  const scrollLeft = () => {};
  const scrollRight = () => {};

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">仕業点検</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate("/operations")}>
            戻る
          </Button>
          <Button onClick={() => setShowBasicInfo(!showBasicInfo)}>
            {showBasicInfo ? "点検表示" : "基本情報表示"}
          </Button>
        </div>
      </div>

      <OperationsNav currentPage="inspection" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>点検基本情報</CardTitle>
          <CardDescription>仕業点検の基本情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="inspection-date">点検日</Label>
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
              <Label htmlFor="start-time">開始時刻</Label>
              <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">終了時刻</Label>
              <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">点検場所</Label>
              <Input id="location" placeholder="点検場所を入力" value={locationInput} onChange={e => setLocationInput(e.target.value)}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible-person">責任者</Label>
              <Input id="responsible-person" placeholder="責任者名を入力" value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspector">点検者</Label>
              <Input id="inspector" placeholder="点検者名を入力" value={inspectorInput} onChange={e => setInspectorInput(e.target.value)}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-id">車両番号</Label>
              <Input id="vehicle-id" placeholder="車両番号を入力" value={vehicleId} onChange={e => setVehicleId(e.target.value)}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-name">ファイル名</Label>
              <Input id="file-name" type="text" value={fileName} onChange={e => setFileName(e.target.value)}/>
            </div>
          </div>
        </CardContent>
      </Card>

      {showBasicInfo ? null : (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center">
            <div>
              <CardTitle>仕業点検表</CardTitle>
              <CardDescription>
                各項目を確認し、判定を入力してください
              </CardDescription>
            </div>
            <div className="ml-auto flex space-x-2">
            </div>
          </CardHeader>
          <CardContent>
        {uncheckedItemsDialog.length > 0 && (
          <div className="mb-4 p-4 border-2 border-red-500 rounded-lg">
            <h3 className="text-lg font-bold text-red-500 mb-2">チェック漏れの項目</h3>
            <ul className="list-disc pl-5">
              {uncheckedItemsDialog.map((item) => (
                <li key={item.id} className="text-red-700">
                  {item.category} - {item.equipment} - {item.item}
                </li>
              ))}
            </ul>
          </div>
        )}
            <div className="mb-2 p-2 bg-muted/20 rounded-md">
              <div className="flex flex-wrap gap-2">
                <div className="min-w-[150px]">
                  <Label htmlFor="manufacturerFilter" className="text-xs">製造メーカー</Label>
                  <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                    <SelectTrigger id="manufacturerFilter" className="h-8">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {[...new Set(inspectionItems.map(item => item.manufacturer))].filter(Boolean).sort().map(manufacturer => (
                        <SelectItem key={manufacturer} value={manufacturer}>{manufacturer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[150px]">
                  <Label htmlFor="modelFilter" className="text-xs">機種</Label>
                  <Select value={modelFilter} onValueChange={setModelFilter}>
                    <SelectTrigger id="modelFilter" className="h-8">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {[...new Set(inspectionItems.map(item => item.model))].filter(Boolean).sort().map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[150px]">
                  <Label htmlFor="categoryFilter" className="text-xs">部位</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger id="categoryFilter" className="h-8">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {[...new Set(inspectionItems.map(item => item.category))]
                        .filter(Boolean)
                        .sort()
                        .map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[150px]">
                  <Label htmlFor="equipmentFilter" className="text-xs">装置</Label>
                  <Select
                    value={equipmentFilter}
                    onValueChange={setEquipmentFilter}
                  >
                    <SelectTrigger id="equipmentFilter" className="h-8">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {[...new Set(inspectionItems
                        .filter(item => !categoryFilter || item.category === categoryFilter)
                        .map(item => item.equipment))]
                        .filter(Boolean)
                        .sort()
                        .map(equipment => (
                          <SelectItem key={equipment} value={equipment}>
                            {equipment}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[150px]">
                  <Label htmlFor="resultFilter" className="text-xs">判定</Label>
                  <Select
                    value={resultFilter}
                    onValueChange={setResultFilter}
                  >
                    <SelectTrigger id="resultFilter" className="h-8">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {resultOptions.map(result => (
                        <SelectItem key={result} value={result}>{result}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Input
                  type="text"
                  placeholder="記事を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <tr>
                    <th className="p-2 text-center whitespace-nowrap text-xs">部位</th>
                    <th className="p-2 text-center whitespace-nowrap text-xs">装置</th>
                    <th className="p-2 text-center whitespace-nowrap text-xs">確認箇所</th>
                    <th className="p-2 text-center whitespace-nowrap text-xs">判断基準</th>
                    <th className="p-2 text-center whitespace-nowrap text-xs">確認要領</th>
                    <th className="p-2 text-center whitespace-nowrap text-xs">
                      測定等記録
                      <div className="text-xs text-gray-500">
                        (測定値を記録)
                      </div>
                    </th>
                    <th className="p-2 text-center whitespace-nowrap w-[30ch] text-xs">図形記録</th>
                    <th className="p-2 text-center whitespace-nowrap w-[15ch] text-xs">判定</th>
                    <th className="p-2 text-center whitespace-nowrap w-[50ch] text-xs">記事</th>
                  </tr>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        データを読み込み中...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : inspectionItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        表示する点検項目がありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    inspectionItems
                      .filter(item => {
                        if (manufacturerFilter !== "all" && item.manufacturer !== manufacturerFilter) return false;
                        if (modelFilter !== "all" && item.model !== modelFilter) return false;
                        if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
                        if (equipmentFilter !== "all" && item.equipment !== equipmentFilter) return false;
                        if (resultFilter !== "all" && item.result !== resultFilter) return false;
                        if (searchQuery) {
                          const searchTermLower = searchQuery.toLowerCase();
                          const remarkText = item.remark || '';
                          return remarkText.toLowerCase().includes(searchTermLower);
                        }
                        return true;
                      })
                      .map((item, index) => {
                        const standard = findStandardValue(item);
                        return (
                          <tr key={item.id} className="border-t">
                            <td className="p-1 text-xs">{item.category}</td>
                            <td className="p-1 text-xs">{item.equipment}</td>
                            <td className="p-1 text-xs">{item.item}</td>
                            <td className="p-1 text-xs">{item.criteria}</td>
                            <td className="p-1 text-xs">{item.method}</td>
                            <td className="p-1 text-xs">
                              <Input type="number" value={item.measurementRecord || ''} onChange={e => updateInspectionMeasurementRecord(item.id, e.target.value)} className="w-24"/>
                              <InspectionValueStatus
                                value={item.measurementRecord || ''}
                                minValue={standard?.minValue || ''}
                                maxValue={standard?.maxValue || ''}
                                onChange={(value) => updateInspectionMeasurementRecord(item.id, value)}
                              />
                            </td>
                            <td className="p-1 text-xs">{item.diagramRecord}</td>
                            <td className="p-1 text-xs">
                              <Select
                                value={item.result}
                                onValueChange={(value) => updateInspectionResult(item.id, value)}
                              >
                                <SelectTrigger className="w-full text-xs p-1">
                                  <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent className="text-xs">
                                  {resultOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-1 text-xs">
                              <Textarea
                                value={item.remark || ""}
                                onChange={(e) => updateInspectionRemark(item.id, e.target.value)}
                                placeholder="備考"
                                className="h-20 w-full text-xs p-0.5"
                              />
                            </td>
                          </tr>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <div className="p-4">
            <Button variant="outline" onClick={handleCancel}>キャンセル</Button>
            <Button onClick={handleComplete}>点検完了</Button>
          </div>
        </Card>
      )}
    </div>
  );
}