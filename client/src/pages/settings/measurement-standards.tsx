
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// 測定基準値の型定義
interface MeasurementStandard {
  id: string;
  itemId: string;
  manufacturer: string;
  modelType: string;
  engineType: string;
  part: string;
  device: string;
  checkPoint: string;
  criteria: string;
  method: string;
  minValue: string;
  maxValue: string;
  unit: string;
  warningThreshold: string;
}

// 点検項目の型定義
interface InspectionItem {
  id: string;
  manufacturer: string;
  modelType: string;
  engineType: string;
  part: string;
  device: string;
  checkPoint: string;
  criteria: string;
  method: string;
}

// 仮のサンプルデータ
const sampleStandards: MeasurementStandard[] = [
  {
    id: '1',
    itemId: '3',
    manufacturer: '堀川工機',
    modelType: 'MC300',
    engineType: 'ボルボ',
    part: 'エンジン',
    device: 'エンジンオイル',
    checkPoint: 'エンジンオイル量確認',
    criteria: 'オイルゲージの範囲内であること',
    method: '目視確認',
    minValue: '75',
    maxValue: '90',
    unit: '%',
    warningThreshold: '80',
  },
  {
    id: '2',
    itemId: '21',
    manufacturer: '堀川工機',
    modelType: 'MC300',
    engineType: 'ボルボ',
    part: 'エンジン',
    device: 'オルタネーター',
    checkPoint: 'ベルトの点検（張り（テンション）、損傷）',
    criteria: '適切なテンションであること',
    method: '押して確認',
    minValue: '10',
    maxValue: '20',
    unit: 'mm',
    warningThreshold: '15',
  },
];

// 仮の点検項目データ
const sampleItems: InspectionItem[] = [
  {
    id: '3',
    manufacturer: '堀川工機',
    modelType: 'MC300',
    engineType: 'ボルボ',
    part: 'エンジン',
    device: 'エンジンオイル',
    checkPoint: 'エンジンオイル量確認',
    criteria: 'オイルゲージの範囲内であること',
    method: '目視確認',
  },
  {
    id: '21',
    manufacturer: '堀川工機',
    modelType: 'MC300',
    engineType: 'ボルボ',
    part: 'エンジン',
    device: 'オルタネーター',
    checkPoint: 'ベルトの点検（張り（テンション）、損傷）',
    criteria: '適切なテンションであること',
    method: '押して確認',
  },
];

export default function MeasurementStandards() {
  const [standards, setStandards] = useState<MeasurementStandard[]>([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentStandard, setCurrentStandard] = useState<MeasurementStandard | null>(null);
  const [newStandard, setNewStandard] = useState<Partial<MeasurementStandard>>({});
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [searchManufacturer, setSearchManufacturer] = useState<string>('');
  const [searchModel, setSearchModel] = useState<string>('');

  // 初期データのロード
  useEffect(() => {
    // 実際のアプリでは、APIからデータを取得するロジックに置き換えます
    setStandards(sampleStandards);
    setItems(sampleItems);
  }, []);

  // 検索とフィルタリング
  const filteredStandards = standards.filter(standard => {
    if (selectedTab !== 'all' && standard.part !== selectedTab) {
      return false;
    }

    if (
      searchManufacturer &&
      !standard.manufacturer.toLowerCase().includes(searchManufacturer.toLowerCase())
    ) {
      return false;
    }

    if (searchModel && !standard.modelType.toLowerCase().includes(searchModel.toLowerCase())) {
      return false;
    }

    return true;
  });

  // 新しい基準値の追加ダイアログを開く
  const openAddStandard = () => {
    setNewStandard({});
    setSelectedItemId('');
    setIsAddOpen(true);
  };

  // 点検項目の選択
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);

    const selectedItem = items.find(item => item.id === itemId);
    if (selectedItem) {
      setNewStandard({
        ...newStandard,
        itemId: selectedItem.id,
        manufacturer: selectedItem.manufacturer,
        modelType: selectedItem.modelType,
        engineType: selectedItem.engineType,
        part: selectedItem.part,
        device: selectedItem.device,
        checkPoint: selectedItem.checkPoint,
        criteria: selectedItem.criteria,
        method: selectedItem.method,
      });
    }
  };

  // 基準値の追加
  const handleAddStandard = () => {
    if (!newStandard.itemId || !newStandard.minValue || !newStandard.maxValue) {
      toast({
        title: "入力エラー",
        description: "必須項目を入力してください。",
        variant: "destructive"
      });
      return;
    }

    const newId = (Math.max(...standards.map(std => parseInt(std.id)), 0) + 1).toString();

    const standard: MeasurementStandard = {
      id: newId,
      itemId: newStandard.itemId || '',
      manufacturer: newStandard.manufacturer || '',
      modelType: newStandard.modelType || '',
      engineType: newStandard.engineType || '',
      part: newStandard.part || '',
      device: newStandard.device || '',
      checkPoint: newStandard.checkPoint || '',
      criteria: newStandard.criteria || '',
      method: newStandard.method || '',
      minValue: newStandard.minValue || '',
      maxValue: newStandard.maxValue || '',
      unit: newStandard.unit || '',
      warningThreshold: newStandard.warningThreshold || '',
    };

    setStandards([...standards, standard]);
    setIsAddOpen(false);

    toast({
      title: "基準値を追加しました",
      description: `「${standard.checkPoint}」の基準値を追加しました。`,
    });
  };

  // 基準値の編集初期化
  const initEditStandard = (standard: MeasurementStandard) => {
    setCurrentStandard(standard);
    setNewStandard({...standard});
    setSelectedItemId(standard.itemId);
    setIsEditOpen(true);
  };

  // 基準値の更新
  const handleUpdateStandard = () => {
    if (!currentStandard || !newStandard.minValue || !newStandard.maxValue) {
      toast({
        title: "入力エラー",
        description: "必須項目を入力してください。",
        variant: "destructive"
      });
      return;
    }

    const updatedStandards = standards.map(std => {
      if (std.id === currentStandard.id) {
        return {
          ...std,
          minValue: newStandard.minValue || '',
          maxValue: newStandard.maxValue || '',
          unit: newStandard.unit || '',
          warningThreshold: newStandard.warningThreshold || '',
        };
      }
      return std;
    });

    setStandards(updatedStandards);
    setIsEditOpen(false);

    toast({
      title: "基準値を更新しました",
      description: `「${currentStandard.checkPoint}」の基準値を更新しました。`,
    });
  };

  // 基準値の削除
  const handleDeleteStandard = (id: string) => {
    if (confirm('本当にこの基準値を削除しますか？')) {
      const updatedStandards = standards.filter(std => std.id !== id);
      setStandards(updatedStandards);

      toast({
        title: "基準値を削除しました",
        description: "選択した基準値を削除しました。",
      });
    }
  };

  // CSVファイルをエクスポート
  const handleExportCSV = () => {
    // CSVデータの作成
    const headers = "製造メーカー,機種,エンジン型式,部位,装置,確認箇所,判断基準,確認要領,最小値,最大値,単位,警告閾値";
    const rows = standards.map(std => {
      return `${std.manufacturer},${std.modelType},${std.engineType},${std.part},${std.device},${std.checkPoint},${std.criteria},${std.method},${std.minValue},${std.maxValue},${std.unit},${std.warningThreshold}`;
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '測定基準値.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">測定基準値設定</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            CSVエクスポート
          </Button>
          <Button onClick={openAddStandard}>
            <Plus className="h-4 w-4 mr-2" /> 新規作成
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>検索・フィルタ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Input
                id="manufacturer"
                value={searchManufacturer}
                onChange={(e) => setSearchManufacturer(e.target.value)}
                placeholder="製造メーカーで検索"
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="model">機種</Label>
              <Input
                id="model"
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                placeholder="機種で検索"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="overflow-x-auto pb-1">
          <TabsTrigger value="all">すべて</TabsTrigger>
          <TabsTrigger value="エンジン">エンジン</TabsTrigger>
          <TabsTrigger value="油圧系統">油圧系統</TabsTrigger>
          <TabsTrigger value="走行装置">走行装置</TabsTrigger>
          <TabsTrigger value="電装品">電装品</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>測定基準値一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>製造メーカー</TableHead>
                  <TableHead>機種</TableHead>
                  <TableHead>エンジン型式</TableHead>
                  <TableHead>部位</TableHead>
                  <TableHead>装置</TableHead>
                  <TableHead>確認箇所</TableHead>
                  <TableHead>判断基準</TableHead>
                  <TableHead>確認要領</TableHead>
                  <TableHead>最小値</TableHead>
                  <TableHead>最大値</TableHead>
                  <TableHead>単位</TableHead>
                  <TableHead>警告閾値</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStandards.map((standard) => (
                  <TableRow key={standard.id} className="hover:bg-muted/50">
                    <TableCell>{standard.manufacturer}</TableCell>
                    <TableCell>{standard.modelType}</TableCell>
                    <TableCell>{standard.engineType}</TableCell>
                    <TableCell>{standard.part}</TableCell>
                    <TableCell>{standard.device}</TableCell>
                    <TableCell>{standard.checkPoint}</TableCell>
                    <TableCell>{standard.criteria}</TableCell>
                    <TableCell>{standard.method}</TableCell>
                    <TableCell>{standard.minValue}</TableCell>
                    <TableCell>{standard.maxValue}</TableCell>
                    <TableCell>{standard.unit}</TableCell>
                    <TableCell>{standard.warningThreshold}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => initEditStandard(standard)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStandard(standard.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStandards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-4">
                      基準値が見つかりませんでした。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 基準値追加ダイアログ */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>測定基準値追加</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-4 items-center gap-4 mb-4">
              <Label htmlFor="item-select" className="text-right">
                点検項目 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedItemId}
                onValueChange={handleItemSelect}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="点検項目を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.checkPoint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItemId && (
              <>
                <div className="grid grid-cols-4 mb-2">
                  <div className="text-right pr-4 text-muted-foreground text-sm">製造メーカー:</div>
                  <div className="col-span-3">{newStandard.manufacturer}</div>
                </div>
                <div className="grid grid-cols-4 mb-2">
                  <div className="text-right pr-4 text-muted-foreground text-sm">機種:</div>
                  <div className="col-span-3">{newStandard.modelType}</div>
                </div>
                <div className="grid grid-cols-4 mb-2">
                  <div className="text-right pr-4 text-muted-foreground text-sm">エンジン型式:</div>
                  <div className="col-span-3">{newStandard.engineType}</div>
                </div>
                <div className="grid grid-cols-4 mb-2">
                  <div className="text-right pr-4 text-muted-foreground text-sm">部位:</div>
                  <div className="col-span-3">{newStandard.part}</div>
                </div>
                <div className="grid grid-cols-4 mb-2">
                  <div className="text-right pr-4 text-muted-foreground text-sm">装置:</div>
                  <div className="col-span-3">{newStandard.device}</div>
                </div>
                <div className="grid grid-cols-4 mb-2">
                  <div className="text-right pr-4 text-muted-foreground text-sm">確認箇所:</div>
                  <div className="col-span-3">{newStandard.checkPoint}</div>
                </div>
                <div className="grid grid-cols-4 mb-2">
                  <div className="text-right pr-4 text-muted-foreground text-sm">判断基準:</div>
                  <div className="col-span-3">{newStandard.criteria}</div>
                </div>
                <div className="grid grid-cols-4 mb-2">
                  <div className="text-right pr-4 text-muted-foreground text-sm">確認要領:</div>
                  <div className="col-span-3">{newStandard.method}</div>
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="min-value" className="text-right">
                最小値 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="min-value"
                className="col-span-3"
                value={newStandard.minValue || ''}
                onChange={(e) => setNewStandard({...newStandard, minValue: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max-value" className="text-right">
                最大値 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="max-value"
                className="col-span-3"
                value={newStandard.maxValue || ''}
                onChange={(e) => setNewStandard({...newStandard, maxValue: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">
                単位
              </Label>
              <Input
                id="unit"
                className="col-span-3"
                value={newStandard.unit || ''}
                onChange={(e) => setNewStandard({...newStandard, unit: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="warning" className="text-right">
                警告閾値
              </Label>
              <Input
                id="warning"
                className="col-span-3"
                value={newStandard.warningThreshold || ''}
                onChange={(e) => setNewStandard({...newStandard, warningThreshold: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddStandard}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 基準値編集ダイアログ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>測定基準値編集</DialogTitle>
          </DialogHeader>
          {currentStandard && (
            <div className="py-4">
              <div className="grid grid-cols-4 mb-2">
                <div className="text-right pr-4 text-muted-foreground text-sm">製造メーカー:</div>
                <div className="col-span-3">{currentStandard.manufacturer}</div>
              </div>
              <div className="grid grid-cols-4 mb-2">
                <div className="text-right pr-4 text-muted-foreground text-sm">機種:</div>
                <div className="col-span-3">{currentStandard.modelType}</div>
              </div>
              <div className="grid grid-cols-4 mb-2">
                <div className="text-right pr-4 text-muted-foreground text-sm">エンジン型式:</div>
                <div className="col-span-3">{currentStandard.engineType}</div>
              </div>
              <div className="grid grid-cols-4 mb-2">
                <div className="text-right pr-4 text-muted-foreground text-sm">部位:</div>
                <div className="col-span-3">{currentStandard.part}</div>
              </div>
              <div className="grid grid-cols-4 mb-2">
                <div className="text-right pr-4 text-muted-foreground text-sm">装置:</div>
                <div className="col-span-3">{currentStandard.device}</div>
              </div>
              <div className="grid grid-cols-4 mb-2">
                <div className="text-right pr-4 text-muted-foreground text-sm">確認箇所:</div>
                <div className="col-span-3">{currentStandard.checkPoint}</div>
              </div>
              <div className="grid grid-cols-4 mb-2">
                <div className="text-right pr-4 text-muted-foreground text-sm">判断基準:</div>
                <div className="col-span-3">{currentStandard.criteria}</div>
              </div>
              <div className="grid grid-cols-4 mb-2">
                <div className="text-right pr-4 text-muted-foreground text-sm">確認要領:</div>
                <div className="col-span-3">{currentStandard.method}</div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4 mt-4">
                <Label htmlFor="edit-min-value" className="text-right">
                  最小値 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-min-value"
                  className="col-span-3"
                  value={newStandard.minValue || ''}
                  onChange={(e) => setNewStandard({...newStandard, minValue: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-max-value" className="text-right">
                  最大値 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-max-value"
                  className="col-span-3"
                  value={newStandard.maxValue || ''}
                  onChange={(e) => setNewStandard({...newStandard, maxValue: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unit" className="text-right">
                  単位
                </Label>
                <Input
                  id="edit-unit"
                  className="col-span-3"
                  value={newStandard.unit || ''}
                  onChange={(e) => setNewStandard({...newStandard, unit: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-warning" className="text-right">
                  警告閾値
                </Label>
                <Input
                  id="edit-warning"
                  className="col-span-3"
                  value={newStandard.warningThreshold || ''}
                  onChange={(e) => setNewStandard({...newStandard, warningThreshold: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateStandard}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
