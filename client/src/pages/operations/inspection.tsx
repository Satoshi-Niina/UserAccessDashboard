import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import OperationsNav from "@/components/OperationsNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";


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
  standardMin?: number;
  standardMax?: number;
}

const resultOptions = ["未チェック", "良好", "不良", "調整", "交換", "補充"];

export default function InspectionPage() {
  const [manufacturers, setManufacturers] = useState([]);
  const [, setLocation] = useLocation();
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
  const [standards, setStandards] = useState<{[key: string]: {min: number, max: number}}>({});
  const [showUncheckedDialog, setShowUncheckedDialog] = useState(false);
  const [measurementStandards, setMeasurementStandards] = useState<Record<string, any>>({});
  const [fileName, setFileName] = useState('');
  const [formErrors, setFormErrors] = React.useState<{[key: string]: boolean}>({});

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
          standardsMap[key] = {
            min: parseFloat(standard.min_value),
            max: parseFloat(standard.max_value)
          };
        });

        console.log('Loaded standards:', standardsMap);
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

  useEffect(() => {
    // 基準値の読み込み
    fetch('/api/measurement-standards')
      .then(response => response.json())
      .then(data => {
        const standards = data.standards || [];
        // inspection_item_idをキーとして基準値をマッピング
        const mappedStandards = standards.reduce((acc: Record<string, any>, standard: any) => {
          acc[standard.inspection_item_id] = {
            minValue: standard.minValue,
            maxValue: standard.maxValue
          };
          return acc;
        }, {});
        setMeasurementStandards(mappedStandards);
      })
      .catch(error => {
        console.error('基準値の読み込みエラー:', error);
      });
  }, []);


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

  const validateAndSaveBasicInfo = () => {
    const errors: {[key: string]: boolean} = {};
    
    // すべての必須フィールドをチェック
    if (!date) errors.date = true;
    if (!startTime) errors.startTime = true;
    if (!endTime) errors.endTime = true;
    if (!locationInput) errors.location = true;
    if (!responsiblePerson) errors.responsible = true;
    if (!inspectorInput) errors.inspector = true;
    if (!machineNumber) errors.machineNumber = true;
    if (!fileName) errors.fileName = true;

    setFormErrors(errors);

    // エラーがある場合は具体的なメッセージを表示
    if (Object.keys(errors).length > 0) {
      const missingFields = [];
      if (errors.date) missingFields.push('点検日');
      if (errors.location) missingFields.push('点検場所');
      if (errors.responsible) missingFields.push('責任者');
      if (errors.inspector) missingFields.push('点検者');
      if (errors.startTime) missingFields.push('開始時刻');
      if (errors.endTime) missingFields.push('終了時刻');
      if (errors.machineNumber) missingFields.push('機番');
      if (errors.fileName) missingFields.push('ファイル名');

      toast({
        title: "入力エラー",
        description: `以下の項目が未入力です：${missingFields.join('、')}`,
        variant: "destructive"
      });
      return;
    }

    // Store basic info in local storage (temporary solution)
    localStorage.setItem('inspectionBasicInfo', JSON.stringify({
      date: date.toISOString(),
      startTime,
      endTime,
      locationInput,
      responsiblePerson,
      inspectorInput,
      machineNumber,
      fileName
    }));

    setShowBasicInfo(false);
  };

  const handleComplete = async () => {
    // Basic info and inspection data are combined and saved in handleSaveWithValidation now.
    const basicInfo = JSON.parse(localStorage.getItem('inspectionBasicInfo') || '{}');
    const completeData = {
      ...basicInfo,
      inspectionItems: items
    };
    console.log("Complete data to save:", completeData); // Replace with actual save logic

    // Placeholder for file saving - Replace with your actual file saving logic
    try{
      const response = await fetch('/api/save-inspection-data', { // Replace with your API endpoint
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(completeData)
        });
        if(!response.ok){
          throw new Error("Failed to save data")
        }
        toast({title: "Saved successfully!", description: "Inspection data saved successfully!"})
    } catch(error){
      console.error("Failed to save data:", error);
      toast({title: "Error", description: "Failed to save data", variant: "destructive"})
    }
  };

  const handleCancel = () => {
    if (window.confirm("点検をキャンセルしますか？変更内容は破棄されます。")) {
      setLocation("/operations");
    }
  };

  const handleMeasurementChange = (id: number, value: string) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          const numValue = Number(value);
          const isOutOfRange = !isNaN(numValue) && 
            ((item.standardMin !== undefined && numValue < item.standardMin) ||
             (item.standardMax !== undefined && numValue > item.standardMax));

          return { 
            ...item, 
            measurementRecord: value,
            isOutOfRange 
          };
        }
        return item;
      })
    );
  };

  const handleSaveWithValidation = () => {
    const uncheckedItems = items.filter(item => !item.result);
    if (uncheckedItems.length > 0) {
      setUncheckedItemsDialog(uncheckedItems);
      setShowUncheckedDialog(true);
      return;
    }

    // 基本情報と点検結果を組み合わせて保存
    const basicInfo = JSON.parse(localStorage.getItem('inspectionBasicInfo') || '{}');
    const completeData = {
      ...basicInfo,
      inspectionItems: items
    };
    // TODO: ファイル保存処理を実装
    console.log('Save complete data:', completeData);

    handleComplete();
  };

  const getInputStyle = (fieldName: string) => {
    return cn(formErrors[fieldName] && "border-red-500 focus:ring-red-500");
  };

  const handleSaveAndProceed = () => {
    const errors = {};
    // Required fields validation
    if (!date) errors['date'] = true;
    if (!machineNumber) errors['machineNumber'] = true;
    if (!fileName) errors['fileName'] = true;

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      // Save basic info and proceed to inspection form
      validateAndSaveBasicInfo();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">仕業点検記録</h1>
      </div>

      <OperationsNav currentPage="inspection" />

      {showBasicInfo ? (
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
                <Input
                    id="machine-id"
                    placeholder="機械番号を入力"
                    value={machineNumber}
                    onChange={e => setMachineNumber(e.target.value)}
                    className={getInputStyle('machineNumber')}
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-name">ファイル名</Label>
                <Input
                  id="file-name"
                  placeholder="ファイル名を入力"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  className={cn("w-[calc(100%+10ch)]", formErrors.fileName && "border-red-500")}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveAndProceed} className={Object.values(formErrors).some(error => error) ? 'bg-red-500' : ''}>
              一時保存して仕業点検表を表示
            </Button>
          </CardFooter>
        </Card>
      ) : (
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
                        <SelectItem key={result} value={result}>{result}</SelectItem>
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
                    {`${items.filter(item => item.result).length}/${items.length}件（残${items.filter(item => !item.result).length}件）`}
                  </div>
                </div>
              </div>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  </TableRow>
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
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="p-1 text-xs">{item.category}</TableCell>
                          <TableCell className="p-1 text-xs">{item.equipment}</TableCell>
                          <TableCell className="p-1 text-xs">{item.item}</TableCell>
                          <TableCell className="p-1 text-xs">{item.criteria}</TableCell>
                          <TableCell className="p-1 text-xs">{item.method}</TableCell>
                          <TableCell className="p-1 text-xs">
                            <div className="space-y-2">
                              <div className="text-xs text-gray-600 mb-1">
                                {item.standardMin && item.standardMax ? (
                                  `基準値：${item.standardMin}～${item.standardMax}`
                                ) : item.category === '制動装置' && item.equipment === 'ブレーキシリンダー' ? (
                                  '基準値：60～90mm（ブレーキ約200kpa時）'
                                ) : ''}
                              </div>
                              <div className="relative flex flex-col">
                                <InspectionValueStatus
                                  value={item.measurementRecord || ''}
                                  minValue={item.standardMin?.toString()}
                                  maxValue={item.standardMax?.toString()}
                                  onChange={(value) => handleMeasurementChange(item.id, value)}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-1 text-xs">{item.diagramRecord}</TableCell>
                          <TableCell className="p-1 text-xs">
                            <Select
                              value={item.result}
                              onValueChange={(value) => updateInspectionResult(item.id, value)}
                            >
                              <SelectTrigger className="w-full text-xs p-1">
                                <SelectValue placeholder="選択" />
                              </SelectTrigger>
                              <SelectContent className="text-xs">
                                {resultOptions.map((option) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-1 text-xs">
                            <Textarea
                              value={item.remark || ""}
                              onChange={(e) => updateInspectionRemark(item.id, e.target.value)}
                              placeholder="備考"
                              className="h-20 w-full text-xs p-0.5"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <div className="p-4">
            <Button variant="outline" onClick={handleCancel}>キャンセル</Button>
            <Button onClick={handleSaveWithValidation}>点検完了</Button>
          </div>

          {showUncheckedDialog && (
            <Dialog open>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>点検完了の確認</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  <p>
                    {uncheckedItemsDialog.length > 0 
                      ? `未確認項目が${uncheckedItemsDialog.length}件あります。確認してください。`
                      : "すべての項目が確認済みです。点検を完了しますか？"
                    }
                  </p>
                </div>
                <DialogFooter className="flex justify-between p-4">
                  <Button variant="outline" onClick={() => setShowUncheckedDialog(false)}>
                    戻る
                  </Button>
                  {uncheckedItemsDialog.length === 0 && (
                    <Button onClick={handleComplete}>
                      点検を完了する
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </Card>
      )}
    </div>
  );
}