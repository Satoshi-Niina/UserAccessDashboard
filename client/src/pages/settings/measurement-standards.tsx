
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
  const [selectedPart, setSelectedPart] = useState<string>('すべて');
  const [activeTab, setActiveTab] = useState('all');

  // 部位のリスト（フィルター用）
  const [parts, setParts] = useState<string[]>(['すべて']);

  // 初期データの読み込み
  useEffect(() => {
    // 実際の実装ではAPI呼び出しになる
    setStandards(sampleStandards);
    setItems(sampleItems);

    // 部位のリストを作成
    const uniqueParts = Array.from(new Set(sampleItems.map(item => item.part)));
    setParts(['すべて', ...uniqueParts]);
  }, []);

  // フィルター後の基準値リスト
  const filteredStandards = standards.filter(std => {
    if (selectedPart !== 'すべて' && std.part !== selectedPart) return false;

    // タブによるフィルタリング
    if (activeTab === 'all') return true;
    if (activeTab === 'engine' && std.part === 'エンジン') return true;
    if (activeTab === 'transmission' && std.part === '動力伝達') return true;
    if (activeTab === 'brake' && (std.part === '制動装置' || std.part === '駐車ブレーキ')) return true;
    if (activeTab === 'electric' && std.part === '電気装置') return true;

    return false;
  });

  // 新規基準値の追加初期化
  const initAddStandard = () => {
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

    const csv = `${headers}\n${rows}`;

    // ダウンロード
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', '測定基準値リスト.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "エクスポート完了",
      description: "CSVファイルをエクスポートしました。",
    });
  };

  // 測定値の状態を評価する関数
  const evaluateMeasurement = (value: string, standard: MeasurementStandard) => {
    if (!value || value.trim() === '') return null;
    
    const numValue = parseFloat(value);
    const min = parseFloat(standard.minValue);
    const max = parseFloat(standard.maxValue);
    
    if (isNaN(numValue) || isNaN(min) || isNaN(max)) return null;
    
    if (numValue < min) return "減少";
    if (numValue > max) return "増加";
    return "正常";
  };

  // 測定値の状態に応じたスタイルを返す関数
  const getStatusStyle = (status: string | null) => {
    if (!status) return {};
    
    switch(status) {
      case "減少":
        return { color: 'blue', fontWeight: 'bold' };
      case "増加":
        return { color: 'red', fontWeight: 'bold' };
      case "正常":
        return { color: 'green', fontWeight: 'bold' };
      default:
        return {};
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">測定基準値設定</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Save className="mr-2 h-4 w-4" />
            CSVエクスポート
          </Button>
          <Button onClick={initAddStandard}>
            <Plus className="mr-2 h-4 w-4" />
            基準値追加
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-1/3">
              <Label htmlFor="part-filter">部位</Label>
              <Select value={selectedPart} onValueChange={setSelectedPart}>
                <SelectTrigger id="part-filter">
                  <SelectValue placeholder="部位を選択" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map(part => (
                    <SelectItem key={part} value={part}>{part}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">すべて</TabsTrigger>
          <TabsTrigger value="engine">エンジン</TabsTrigger>
          <TabsTrigger value="transmission">動力伝達</TabsTrigger>
          <TabsTrigger value="brake">制動装置</TabsTrigger>
          <TabsTrigger value="electric">電気装置</TabsTrigger>
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
                    <TableCell>{standard.warningThreshold || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
              <Label htmlFor="item" className="text-right">
                点検項目
              </Label>
              <Select 
                value={selectedItemId} 
                onValueChange={handleItemSelect}
              >
                <SelectTrigger id="item" className="col-span-3">
                  <SelectValue placeholder="点検項目を選択" />
                </SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {`${item.manufacturer} - ${item.modelType} - ${item.part} - ${item.checkPoint}`}
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
                <div className="grid grid-cols-4 mb-4">
                  <div className="text-right pr-4 text-muted-foreground text-sm">確認要領:</div>
                  <div className="col-span-3">{newStandard.method}</div>
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
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
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>キャンセル</Button>
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
              <div className="grid grid-cols-4 mb-4">
                <div className="text-right pr-4 text-muted-foreground text-sm">確認要領:</div>
                <div className="col-span-3">{currentStandard.method}</div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
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
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>キャンセル</Button>
            <Button onClick={handleUpdateStandard}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
