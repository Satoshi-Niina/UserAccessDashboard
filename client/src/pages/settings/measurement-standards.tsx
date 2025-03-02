
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
} from '@/components/ui';
import { Plus, Edit, Save, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// 仮のデータ
const initialItems = [
  { id: '1', name: 'エンジン始動確認', hasStandard: false },
  { id: '2', name: 'ブレーキ点検', hasStandard: false },
  { id: '3', name: 'オイル量確認', hasStandard: true, min: '50', max: '80', unit: 'ml' },
  { id: '4', name: '冷却水量確認', hasStandard: true, min: '30', max: '45', unit: 'ml' },
  { id: '5', name: 'タイヤ空気圧確認', hasStandard: true, min: '2.2', max: '2.6', unit: 'kg/cm²' },
];

export default function MeasurementStandards() {
  const [items, setItems] = useState(initialItems);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [editValues, setEditValues] = useState<{
    hasStandard: boolean;
    min: string;
    max: string;
    unit: string;
  }>({
    hasStandard: false,
    min: '',
    max: '',
    unit: '',
  });

  // 編集モーダルを開く
  const openEditModal = (item: any) => {
    setCurrentItem(item);
    setEditValues({
      hasStandard: item.hasStandard,
      min: item.min || '',
      max: item.max || '',
      unit: item.unit || '',
    });
    setIsEditModalOpen(true);
  };

  // 変更を保存
  const saveChanges = () => {
    if (!currentItem) return;

    // 基準値ありの場合は値をチェック
    if (editValues.hasStandard) {
      if (!editValues.min || !editValues.max || !editValues.unit) {
        toast({
          title: "入力エラー",
          description: "最小値、最大値、単位はすべて入力してください。",
          variant: "destructive"
        });
        return;
      }

      // 数値チェック
      if (isNaN(Number(editValues.min)) || isNaN(Number(editValues.max))) {
        toast({
          title: "入力エラー",
          description: "最小値と最大値は数値で入力してください。",
          variant: "destructive"
        });
        return;
      }

      // 最小値 <= 最大値のチェック
      if (Number(editValues.min) > Number(editValues.max)) {
        toast({
          title: "入力エラー",
          description: "最小値は最大値以下にしてください。",
          variant: "destructive"
        });
        return;
      }
    }

    // 更新処理
    const updatedItems = items.map(item => {
      if (item.id === currentItem.id) {
        if (editValues.hasStandard) {
          return {
            ...item,
            hasStandard: true,
            min: editValues.min,
            max: editValues.max,
            unit: editValues.unit,
          };
        } else {
          // 基準値なしの場合
          const { hasStandard, ...rest } = item;
          return {
            ...rest,
            id: item.id,
            name: item.name,
            hasStandard: false,
          };
        }
      }
      return item;
    });

    setItems(updatedItems);
    setIsEditModalOpen(false);
    
    toast({
      title: "基準値を更新しました",
      description: `「${currentItem.name}」の基準値を更新しました。`,
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">測定基準値設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>点検項目一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>項目名</TableHead>
                <TableHead>基準値</TableHead>
                <TableHead>単位</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {item.hasStandard ? (
                      <span>{item.min} 〜 {item.max}</span>
                    ) : (
                      <span className="text-muted-foreground italic">基準値なし</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.hasStandard ? item.unit : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(item)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> 編集
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 基準値編集ダイアログ */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>基準値の設定 - {currentItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="has-standard" className="text-right">
                基準値
              </Label>
              <Select
                value={editValues.hasStandard ? "true" : "false"}
                onValueChange={(value) => 
                  setEditValues({
                    ...editValues,
                    hasStandard: value === "true"
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="基準値の有無" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">あり</SelectItem>
                  <SelectItem value="false">なし</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editValues.hasStandard && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="min-value" className="text-right">
                    最小値
                  </Label>
                  <Input
                    id="min-value"
                    value={editValues.min}
                    onChange={(e) => 
                      setEditValues({
                        ...editValues,
                        min: e.target.value
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max-value" className="text-right">
                    最大値
                  </Label>
                  <Input
                    id="max-value"
                    value={editValues.max}
                    onChange={(e) => 
                      setEditValues({
                        ...editValues,
                        max: e.target.value
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">
                    単位
                  </Label>
                  <Input
                    id="unit"
                    value={editValues.unit}
                    onChange={(e) => 
                      setEditValues({
                        ...editValues,
                        unit: e.target.value
                      })
                    }
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={saveChanges}>
              <Save className="h-4 w-4 mr-2" /> 保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
