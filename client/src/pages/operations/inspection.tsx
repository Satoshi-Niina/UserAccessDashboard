import React, { useState, useEffect, useRef } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import OperationsNav from "@/components/OperationsNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
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
  isOutOfRange?: boolean;
  model_id?: number;
  standardMin?: string;
  standardMax?: string;
}

const resultOptions = [
  "良好",
  "補給・給脂",
  "修繕",
  "経過観察",
  "その他"
];

export default function InspectionPage() {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [locationInput, setLocationInput] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [inspectorInput, setInspectorInput] = useState("");
  const [machineNumber, setMachineNumber] = useState('');
  const [showBasicInfo, setShowBasicInfo] = useState(true);
  const [measurementRecords, setMeasurementRecords] = useState<Record<number, string>>({});
  const [uncheckedItemsDialog, setUncheckedItemsDialog] = useState<InspectionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [standards, setStandards] = useState<{[key: string]: {min: string, max: string}}>();


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [manufacturersRes, modelsRes, standardsRes] = await Promise.all([
          fetch('/api/inspection/table/manufacturers'),
          fetch('/api/inspection/table/models'),
          fetch('/attached_assets/inspection/table/measurement_standards.csv')
        ]);

        if (!manufacturersRes.ok || !modelsRes.ok || !standardsRes.ok) {
          throw new Error('データの取得に失敗しました');
        }

        const manufacturersData = await manufacturersRes.json();
        const modelsData = await modelsRes.json();
        const standardsText = await standardsRes.text();

        const standardsData = Papa.parse(standardsText, {header: true, dynamicTyping: true}).data;
        const standardsMap = {};
        standardsData.forEach(standard => {
          const key = `${standard.category}-${standard.equipment}-${standard.item}`;
          standardsMap[key] = {min: standard.min_value, max: standard.max_value};
        })

        setStandards(standardsMap);
        setManufacturers(manufacturersData);
        setModels(modelsData.filter(model => 
          !selectedManufacturer || model.manufacturer_id === selectedManufacturer
        ));
      } catch (error) {
        console.error('データ取得エラー:', error);
        toast({
          title: "エラー",
          description: error instanceof Error ? error.message : "データの取得に失敗しました",
          variant: "destructive"
        });
      }
    };

    fetchData();
  }, [selectedManufacturer]);

  useEffect(() => {
    const fetchInspectionItems = async () => {
      if (machineNumber) {
        try {
          const response = await fetch(`/api/machineNumbers/${machineNumber}`);
          if (!response.ok) {
            throw new Error('点検項目の取得に失敗しました');
          }
          const data = await response.json();

          // 点検項目を設定
          if (data.inspection_items) {
            const mergedItems = data.inspection_items.map((item: any) => {
              const key = `${item.category}-${item.equipment}-${item.item}`;
              const standard = standards[key];
              return {
                ...item,
                standardMin: standard?.min,
                standardMax: standard?.max
              };
            });
            setItems(mergedItems);
          }

        } catch (error) {
          console.error('点検項目取得エラー:', error);
          toast({
            title: "エラー",
            description: "点検項目の取得に失敗しました",
            variant: "destructive"
          });
        }
      }
    };

    fetchInspectionItems();
  }, [machineNumber, standards]);

  useEffect(() => {
    const fetchInspectionItems = async () => {
      if (selectedManufacturer && selectedModel) {
        try {
          const response = await fetch('/api/inspection/table/inspection_items');
          if (!response.ok) {
            throw new Error('点検項目の取得に失敗しました');
          }
          const data = await response.json();
          const filteredItems = data.filter(item =>
            item.manufacturer_id === selectedManufacturer &&
            item.model_id === selectedModel
          );
          const mergedItems = filteredItems.map((item: any) => {
            const key = `${item.category}-${item.equipment}-${item.item}`;
            const standard = standards[key];
            return {
              ...item,
              standardMin: standard?.min,
              standardMax: standard?.max
            };
          });
          setItems(mergedItems);
        } catch (error) {
          console.error('点検項目取得エラー:', error);
          toast({
            title: "エラー",
            description: "点検項目の取得に失敗しました",
            variant: "destructive"
          });
        }
      }
    };

    fetchInspectionItems();
  }, [selectedManufacturer, selectedModel, standards]);


  const updateInspectionResult = (id: number, result: string) => {
    setItems(prevItems => prevItems.map(item =>
      item.id === id ? { ...item, result } : item
    ));
  };

  const updateInspectionRemark = (id: number, remark: string) => {
    setItems(prevItems => prevItems.map(item =>
      item.id === id ? { ...item, remark } : item
    ));
  };

  const handleComplete = async () => {
    const uncheckedItems = items.filter(item => !item.result);
    setUncheckedItemsDialog(uncheckedItems);

    if (uncheckedItems.length > 0) {
      return;
    }

    const basicInfo = {
      点検年月日: date,
      開始時刻: startTime,
      終了時刻: endTime,
      実施箇所: locationInput,
      責任者: responsiblePerson,
      点検者: inspectorInput,
      引継ぎ: ""
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    const basicInfoFileName = `inspection_info_${dateStr}_${machineNumber}.csv`;
    const inspectionRecordFileName = `inspection_${dateStr}_${machineNumber}.csv`;

    try {
      const response = await fetch('/api/save-inspection-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceFileName: "inspection_data",
          data: items,
          fileName: basicInfoFileName,
          inspectionRecord: basicInfo,
          path: {
            basicInfo: 'Inspection results',
            inspectionRecord: 'Inspection record'
          }
        })
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      toast({
        title: "保存完了",
        description: "点検データが正常に保存されました",
      });

      // navigate('/'); //Commented out as it causes an error.  The navigate function is undefined here.
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "保存エラー",
        description: "点検データの保存中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (window.confirm("点検をキャンセルしますか？変更内容は破棄されます。")) {
      window.location.href = '/';
    }
  };

  const handleMeasurementChange = (id: number, value: string) => {
    setItems(
      items.map(item =>
        item.id === id ? { ...item, measurementRecord: value } : item
      )
    );
  };

  const handleSaveWithValidation = () => {
    const uncheckedItems = items.filter(item => !item.result);
    if (uncheckedItems.length > 0) {
      setUncheckedItemsDialog(uncheckedItems);
      return;
    }
    handleComplete();
  };


  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">仕業点検記録</h1>
      </div>

      <>
        <OperationsNav currentPage="inspection" />

        {showBasicInfo && (
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
                  <Label htmlFor="machine-id">機械番号</Label>
                  <div className="flex gap-2">
                    <Input
                      id="machine-id"
                      placeholder="機械番号を入力"
                      value={machineNumber}
                      onChange={e => setMachineNumber(e.target.value)}
                    />
                    <Button onClick={() => setShowBasicInfo(false)}>
                      点検項目取得
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-name">ファイル名</Label>
                  <Input id="file-name" type="text" value={""} onChange={e => {}} /> {/*Removed fileName state and onChange handler due to its non-usage*/}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!showBasicInfo && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center">
              <div>
                <CardTitle>仕業点検表</CardTitle>
                <CardDescription>
                  各項目を確認し、判定を入力してください
                </CardDescription>
              </div>
              <div className="ml-auto flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBasicInfo(true)}
                >
                  基本情報へ戻る
                </Button>
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
                        {[...new Set(items.map(item => item.category))]
                          .filter(Boolean)
                          .sort()
                          .map(category => (
                            <SelectItem key={category} value={category || ""}>
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
                        {[...new Set(items
                          .filter(item => !categoryFilter || item.category === categoryFilter)
                          .map(item => item.equipment))]
                          .filter(Boolean)
                          .sort()
                          .map(equipment => (
                            <SelectItem key={equipment} value={equipment || ""}>
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
                          <SelectItem key={result} value={result || ""}>{result}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex gap-4 mb-4">
                  <div className="w-2/3">
                    <Input
                      type="text"
                      placeholder="記事を検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-1/3 flex items-center justify-end">
                    <div className="text-sm font-medium">
                      残項目: {items.filter(item => !item.result).length}件
                    </div>
                  </div>
                </div>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead className="p-2 text-center whitespace-nowrap text-xs">部位</TableHead>
                      <TableHead className="p-2 text-center whitespace-nowrap text-xs">装置</TableHead>
                      <TableHead className="p-2 text-center whitespace-nowrap text-xs">確認箇所</TableHead>
                      <TableHead className="p-2 text-center whitespace-nowrap text-xs">判断基準</TableHead>
                      <TableHead className="p-2 text-center whitespace-nowrap text-xs">確認要領</TableHead>
                      <TableHead className="p-2 text-center whitespace-nowrap text-xs">
                        測定等記録
                        <div className="text-xs text-gray-500">
                          (測定値を記録)
                        </div>
                      </TableHead>
                      <TableHead className="p-2 text-center whitespace-nowrap w-[30ch] text-xs">図形記録</TableHead>
                      <TableHead className="p-2 text-center whitespace-nowrap w-[15ch] text-xs">判定</TableHead>
                      <TableHead className="p-2 text-center whitespace-nowrap w-[50ch] text-xs">記事</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">
                          表示する点検項目がありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      items
                        .filter(item => {
                          if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
                          if (equipmentFilter !== "all" && item.equipment !== equipmentFilter) return false;
                          if (searchQuery) {
                            const searchTermLower = searchQuery.toLowerCase();
                            return (
                              (item.category || '').toLowerCase().includes(searchTermLower) ||
                              (item.equipment || '').toLowerCase().includes(searchTermLower) ||
                              (item.item || '').toLowerCase().includes(searchTermLower) ||
                              (item.remark || '').toLowerCase().includes(searchTermLower)
                            );
                          }
                          return true;
                        })
                        .map((item, index) => {
                          return (
                            <tr key={item.id} className="border-t">
                              <td className="p-1 text-xs">{item.category}</td>
                              <td className="p-1 text-xs">{item.equipment}</td>
                              <td className="p-1 text-xs">{item.item}</td>
                              <td className="p-1 text-xs">{item.criteria}</td>
                              <td className="p-1 text-xs">{item.method}</td>
                              <td className="p-1 text-xs">
                                <div className="space-y-1 relative">
                                  {item.standardMin && item.standardMax ? (
                                    <div className="text-xs text-gray-500 mb-1 border-b pb-1">
                                      基準値: {item.standardMin} ～ {item.standardMax}
                                    </div>
                                  ) : null}
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={item.measurementRecord || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        handleMeasurementChange(item.id, value);
                                      }}
                                      className={`w-full text-xs ${
                                        item.standardMin && 
                                        item.standardMax && 
                                        item.measurementRecord &&
                                        (parseFloat(item.measurementRecord) < parseFloat(item.standardMin) || 
                                         parseFloat(item.measurementRecord) > parseFloat(item.standardMax))
                                          ? 'border-red-500'
                                          : ''
                                      }`}
                                    />
                                    {item.standardMin && 
                                     item.standardMax && 
                                     item.measurementRecord &&
                                     (parseFloat(item.measurementRecord) < parseFloat(item.standardMin) || 
                                      parseFloat(item.measurementRecord) > parseFloat(item.standardMax)) && (
                                      <div className="text-red-500 text-xs absolute -bottom-5">
                                        調整が必要です！
                                      </div>
                                    )} 
                                     {(Number(item.measurementRecord) < Number(item.standardMin) || 
                                      Number(item.measurementRecord) > Number(item.standardMax)) && (
                                      <span className="text-red-500 text-xs">調整が必要です！</span>
                                    )}
                                  </div>
                                </div>
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
                                      option && (
                                        <SelectItem key={option} value={option || ""}>
                                          {option}
                                        </SelectItem>
                                      )
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
              <Button onClick={handleSaveWithValidation}>点検完了</Button>
            </div>
          </Card>
        )}
      </>
    </div>
  );
}