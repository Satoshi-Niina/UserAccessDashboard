
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
  itemName: string;
  part: string;
  device: string;
  checkPoint: string;
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
  part: string;
  device: string;
  checkPoint: string;
}

// 仮のサンプルデータ
const sampleStandards: MeasurementStandard[] = [
  {
    id: '1',
    itemId: '3',
    itemName: 'エンジンオイル量確認',
    part: 'エンジン',
    device: 'エンジンオイル',
    checkPoint: 'エンジンオイル',
    minValue: '75',
    maxValue: '90',
    unit: '%',
    warningThreshold: '80',
  },
  {
    id: '2',
    itemId: '21',
    itemName: 'オルタネーター確認',
    part: 'エンジン',
    device: 'オルタネーター',
    checkPoint: 'ベルトの点検（張り（テンション）、損傷）',
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
    part: 'エンジン',
    device: 'エンジンオイル',
    checkPoint: 'エンジンオイル',
  },
  {
    id: '21',
    manufacturer: '堀川工機',
    modelType: 'MC300',
    part: 'エンジン',
    device: 'オルタネーター',
    checkPoint: 'ベルトの点検（張り（テンション）、損傷）',
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
        itemName: selectedItem.checkPoint,
        part: selectedItem.part,
        device: selectedItem.device,
        checkPoint: selectedItem.checkPoint,
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
      itemName: newStandard.itemName || '',
      part: newStandard.part || '',
      device: newStandard.device || '',
      checkPoint: newStandard.checkPoint || '',
      minValue: newStandard.minValue || '',
      maxValue: newStandard.maxValue || '',
      unit: newStandard.unit || '',
      warningThreshold: newStandard.warningThreshold || '',
    };
    
    setStandards([...standards, standard]);
    setIsAddOpen(false);
    
    toast({
      title: "基準値を追加しました",
      description: `「${standard.itemName}」の基準値を追加しました。`,
    });
  };

  // 基準値の編集初期化
  const initEditStandard = (standard: MeasurementStandard) => {
    setCurrentStandard(standard);
    setNewStandard({...standard});
    setSelectedItemId(standard.itemId);
    setIsEditOpen(true);
  };

  // 基準値の編集
  const handleEditStandard = () => {
    if (!currentStandard) return;
    
    if (!newStandard.minValue || !newStandard.maxValue) {
      toast({
        title: "入力エラー",
        description: "必須項目を入力してください。",
        variant: "destructive"
      });
      return;
    }
    
    const updatedStandard: MeasurementStandard = {
      ...currentStandard,
      minValue: newStandard.minValue || '',
      maxValue: newStandard.maxValue || '',
      unit: newStandard.unit || '',
      warningThreshold: newStandard.warningThreshold || '',
    };
    
    const updatedStandards = standards.map(std => 
      std.id === currentStandard.id ? updatedStandard : std
    );
    
    setStandards(updatedStandards);
    setIsEditOpen(false);
    setCurrentStandard(null);
    
    toast({
      title: "基準値を更新しました",
      description: `「${updatedStandard.itemName}」の基準値を更新しました。`,
    });
  };

  // 基準値の削除
  const handleDeleteStandard = (id: string) => {
    const updatedStandards = standards.filter(std => std.id !== id);
    setStandards(updatedStandards);
    
    toast({
      title: "基準値を削除しました",
      description: "測定基準値を削除しました。",
    });
  };

  // CSVファイルをエクスポート
  const handleExportCSV = () => {
    // CSVデータの作成
    const headers = "項目ID,項目名,部位,装置,確認箇所,最小値,最大値,単位,警告閾値";
    const rows = standards.map(std => {
      return `${std.itemId},${std.itemName},${std.part},${std.device},${std.checkPoint},${std.minValue},${std.maxValue},${std.unit},${std.warningThreshold}`;
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">測定基準値設定</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Save className="mr-2 h-4 w-4" /> CSVエクスポート
          </Button>
          <Button onClick={initAddStandard}>
            <Plus className="mr-2 h-4 w-4" /> 基準値追加
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
                  <TableHead>ID</TableHead>
                  <TableHead>点検項目</TableHead>
                  <TableHead>部位</TableHead>
                  <TableHead>装置</TableHead>
                  <TableHead>確認箇所</TableHead>
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
                    <TableCell>{standard.itemId}</TableCell>
                    <TableCell>{standard.itemName}</TableCell>
                    <TableCell>{standard.part}</TableCell>
                    <TableCell>{standard.device}</TableCell>
                    <TableCell>{standard.checkPoint}</TableCell>
                    <TableCell>{standard.minValue}</TableCell>
                    <TableCell>{standard.maxValue}</TableCell>
                    <TableCell>{standard.unit}</TableCell>
                    <TableCell>{standard.warningThreshold || '-'}</TableCell>
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
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStandards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6">
                      データがありません
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-select" className="text-right">
                点検項目 <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedItemId} onValueChange={handleItemSelect}>
                <SelectTrigger id="item-select" className="col-span-3">
                  <SelectValue placeholder="点検項目を選択" />
                </SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.checkPoint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">部位</Label>
              <Input
                className="col-span-3"
                value={newStandard.part || ''}
                readOnly
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">装置</Label>
              <Input
                className="col-span-3"
                value={newStandard.device || ''}
                readOnly
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">確認箇所</Label>
              <Input
                className="col-span-3"
                value={newStandard.checkPoint || ''}
                readOnly
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min-value" className="text-right">
                最小値 <span className="text-destructive">*</span>
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
                最大値 <span className="text-destructive">*</span>
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">点検項目</Label>
              <Input
                className="col-span-3"
                value={newStandard.itemName || ''}
                readOnly
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">部位</Label>
              <Input
                className="col-span-3"
                value={newStandard.part || ''}
                readOnly
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">装置</Label>
              <Input
                className="col-span-3"
                value={newStandard.device || ''}
                readOnly
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">確認箇所</Label>
              <Input
                className="col-span-3"
                value={newStandard.checkPoint || ''}
                readOnly
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-min-value" className="text-right">
                最小値 <span className="text-destructive">*</span>
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
                最大値 <span className="text-destructive">*</span>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>キャンセル</Button>
            <Button onClick={handleEditStandard}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
