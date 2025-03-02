
// オペレーションページコンポーネント
// 業務操作の一覧と実行機能を提供
// サイドバーとメインコンテンツのレイアウトを実装
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, Plus, Edit, Trash2, MoveVertical, FileUp, FileDown, Filter } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// CSVデータの型定義
interface InspectionItem {
  id: number;
  manufacturer: string;
  modelType: string;
  engineType: string;
  part: string;
  device: string;
  procedure: string;
  checkPoint: string;
  criteria: string;
  inspectionMethod: string;
  measurement: string;
  graphicRecord: string;
}

// 仮のCSVデータ（実際の実装では、APIからデータを取得します）
const mockInspectionData: InspectionItem[] = [
  {
    id: 1,
    manufacturer: "堀川工機",
    modelType: "MC300",
    engineType: "ボルボ",
    part: "エンジン",
    device: "本体",
    procedure: "",
    checkPoint: "エンジンヘッドカバー、ターボ",
    criteria: "オイル、燃料漏れ",
    inspectionMethod: "オイル等滲み・垂れ跡が無",
    measurement: "",
    graphicRecord: "",
  },
  {
    id: 2,
    manufacturer: "",
    modelType: "",
    engineType: "",
    part: "エンジン",
    device: "本体",
    procedure: "",
    checkPoint: "排気及び吸気",
    criteria: "排気ガス色及びガス漏れ等の点検（マフラー等）",
    inspectionMethod: "ほぼ透明の薄紫",
    measurement: "",
    graphicRecord: "",
  },
  {
    id: 3,
    manufacturer: "",
    modelType: "",
    engineType: "",
    part: "エンジン",
    device: "スターター",
    procedure: "",
    checkPoint: "起動状態",
    criteria: "回転及び異音の確認",
    inspectionMethod: "イグニションスタートでスムーズに回転",
    measurement: "",
    graphicRecord: "",
  },
  // 追加のデータはCSVからインポート
];

export default function Operations() {
  const [location, setLocation] = useLocation();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const currentTab = new URLSearchParams(location.split("?")[1]).get("tab") || "inspection";
  
  // データ管理のための状態
  const [inspectionData, setInspectionData] = useState<InspectionItem[]>(mockInspectionData);
  const [selectedItem, setSelectedItem] = useState<InspectionItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [filterModelType, setFilterModelType] = useState<string>('all');
  const [filterPart, setFilterPart] = useState<string>('all');

  // フィルターされたデータ
  const filteredData = useMemo(() => {
    return inspectionData.filter(item => {
      const matchesManufacturer = filterManufacturer === 'all' || item.manufacturer === filterManufacturer;
      const matchesModelType = filterModelType === 'all' || item.modelType === filterModelType;
      const matchesPart = filterPart === 'all' || item.part === filterPart;
      return matchesManufacturer && matchesModelType && matchesPart;
    });
  }, [inspectionData, filterManufacturer, filterModelType, filterPart]);

  // ユニークな製造メーカー、機種、部位のリストを取得
  const manufacturers = [...new Set(inspectionData.map(item => item.manufacturer))].filter(Boolean);
  const modelTypes = [...new Set(inspectionData.map(item => item.modelType))].filter(Boolean);
  const parts = [...new Set(inspectionData.map(item => item.part))].filter(Boolean);

  // 項目を追加する関数
  const addInspectionItem = (item: Omit<InspectionItem, 'id'>) => {
    const newItem = {
      ...item,
      id: Math.max(0, ...inspectionData.map(i => i.id)) + 1
    };
    setInspectionData([...inspectionData, newItem]);
  };

  // 項目を更新する関数
  const updateInspectionItem = (item: InspectionItem) => {
    setInspectionData(inspectionData.map(i => i.id === item.id ? item : i));
  };

  // 項目を削除する関数
  const deleteInspectionItem = (id: number) => {
    setInspectionData(inspectionData.filter(i => i.id !== id));
  };

  // アイテムの順序を変更する関数
  const moveItem = (id: number, direction: 'up' | 'down') => {
    const index = inspectionData.findIndex(i => i.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === inspectionData.length - 1)
    ) {
      return; // 既に一番上または一番下の場合は何もしない
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newData = [...inspectionData];
    const temp = newData[index];
    newData[index] = newData[newIndex];
    newData[newIndex] = temp;
    setInspectionData(newData);
  };

  // ダイアログを開く関数
  const openAddDialog = () => {
    setSelectedItem({
      id: 0,
      manufacturer: "",
      modelType: "",
      engineType: "",
      part: "",
      device: "",
      procedure: "",
      checkPoint: "",
      criteria: "",
      inspectionMethod: "",
      measurement: "",
      graphicRecord: "",
    });
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: InspectionItem) => {
    setSelectedItem({...item});
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  // フォーム送信関数
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (dialogMode === 'add') {
      // 新しい項目を追加
      const { id, ...rest } = selectedItem;
      addInspectionItem(rest);
    } else {
      // 既存の項目を更新
      updateInspectionItem(selectedItem);
    }
    
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  // CSVデータをインポートする関数
  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      const data: InspectionItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        data.push({
          id: i,
          manufacturer: values[0] || "",
          modelType: values[1] || "",
          engineType: values[2] || "",
          part: values[3] || "",
          device: values[4] || "",
          procedure: values[5] || "",
          checkPoint: values[6] || "",
          criteria: values[7] || "",
          inspectionMethod: values[8] || "",
          measurement: values[9] || "",
          graphicRecord: values[10] || "",
        });
      }
      
      setInspectionData(data);
    };
    
    reader.readAsText(file);
  };

  // CSVデータをエクスポートする関数
  const exportToCSV = () => {
    const headers = [
      "製造メーカー", "機種", "エンジン型式", "部位", "装置", "手順", 
      "確認箇所", "判断基準", "確認要領", "測定等記録", "図形記録"
    ];
    
    const csvContent = [
      headers.join(','),
      ...inspectionData.map(item => [
        item.manufacturer,
        item.modelType,
        item.engineType,
        item.part,
        item.device,
        item.procedure,
        item.checkPoint,
        item.criteria,
        item.inspectionMethod,
        item.measurement,
        item.graphicRecord
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '仕業点検マスタ.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!location.includes("?tab=")) {
      setLocation("/operations?tab=inspection");
    }
  }, [location, setLocation]);

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300 overflow-auto`}>
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
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">仕業点検項目管理</h2>
                      <div className="flex items-center gap-2">
                        <label className="relative cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2">
                          <FileUp className="mr-2 h-4 w-4" />
                          CSVインポート
                          <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={importCSV}
                          />
                        </label>
                        <Button onClick={exportToCSV}>
                          <FileDown className="mr-2 h-4 w-4" />
                          CSVエクスポート
                        </Button>
                        <Button onClick={openAddDialog}>
                          <Plus className="mr-2 h-4 w-4" />
                          新規追加
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-3 mb-4">
                      <div>
                        <Label htmlFor="filter-manufacturer">製造メーカー</Label>
                        <Select
                          value={filterManufacturer}
                          onValueChange={setFilterManufacturer}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="メーカー選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            {manufacturers.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="filter-model">機種</Label>
                        <Select
                          value={filterModelType}
                          onValueChange={setFilterModelType}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="機種選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            {modelTypes.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="filter-part">部位</Label>
                        <Select
                          value={filterPart}
                          onValueChange={setFilterPart}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="部位選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            {parts.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[100px]">操作</TableHead>
                            <TableHead>製造メーカー</TableHead>
                            <TableHead>機種</TableHead>
                            <TableHead>エンジン型式</TableHead>
                            <TableHead>部位</TableHead>
                            <TableHead>装置</TableHead>
                            <TableHead>確認箇所</TableHead>
                            <TableHead>判断基準</TableHead>
                            <TableHead>確認要領</TableHead>
                            <TableHead>測定等記録</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={10} className="text-center py-4">
                                データがありません
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredData.map((item) => (
                              <TableRow key={item.id} className="hover:bg-muted/50">
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => moveItem(item.id, 'up')}
                                      className="h-7 w-7"
                                      title="上へ移動"
                                    >
                                      <MoveVertical className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(item)}
                                      className="h-7 w-7"
                                      title="編集"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm("本当に削除しますか？")) {
                                          deleteInspectionItem(item.id);
                                        }
                                      }}
                                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      title="削除"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>{item.manufacturer}</TableCell>
                                <TableCell>{item.modelType}</TableCell>
                                <TableCell>{item.engineType}</TableCell>
                                <TableCell>{item.part}</TableCell>
                                <TableCell>{item.device}</TableCell>
                                <TableCell>{item.checkPoint}</TableCell>
                                <TableCell>{item.criteria}</TableCell>
                                <TableCell>{item.inspectionMethod}</TableCell>
                                <TableCell>{item.measurement}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="performance">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">運用実績管理</h2>
                  <p>今後実装予定</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* 項目編集用ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? '新規点検項目追加' : '点検項目編集'}
            </DialogTitle>
            <DialogDescription>
              点検項目の詳細情報を入力してください。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-1">
                <Label htmlFor="manufacturer">製造メーカー</Label>
                <Input
                  id="manufacturer"
                  value={selectedItem?.manufacturer || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    manufacturer: e.target.value
                  })}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="modelType">機種</Label>
                <Input
                  id="modelType"
                  value={selectedItem?.modelType || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    modelType: e.target.value
                  })}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="engineType">エンジン型式</Label>
                <Input
                  id="engineType"
                  value={selectedItem?.engineType || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    engineType: e.target.value
                  })}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="part">部位</Label>
                <Input
                  id="part"
                  value={selectedItem?.part || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    part: e.target.value
                  })}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="device">装置</Label>
                <Input
                  id="device"
                  value={selectedItem?.device || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    device: e.target.value
                  })}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="procedure">手順</Label>
                <Input
                  id="procedure"
                  value={selectedItem?.procedure || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    procedure: e.target.value
                  })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="checkPoint">確認箇所</Label>
                <Input
                  id="checkPoint"
                  value={selectedItem?.checkPoint || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    checkPoint: e.target.value
                  })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="criteria">判断基準</Label>
                <Input
                  id="criteria"
                  value={selectedItem?.criteria || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    criteria: e.target.value
                  })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="inspectionMethod">確認要領</Label>
                <Input
                  id="inspectionMethod"
                  value={selectedItem?.inspectionMethod || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    inspectionMethod: e.target.value
                  })}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="measurement">測定等記録</Label>
                <Input
                  id="measurement"
                  value={selectedItem?.measurement || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    measurement: e.target.value
                  })}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="graphicRecord">図形記録</Label>
                <Input
                  id="graphicRecord"
                  value={selectedItem?.graphicRecord || ''}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem!,
                    graphicRecord: e.target.value
                  })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
