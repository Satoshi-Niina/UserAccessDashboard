
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Manufacturer {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
}

interface InspectionItem {
  id: string;
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
}

export default function InspectionItems() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const { toast } = useToast();

  // 製造メーカーの読み込み
  useEffect(() => {
    fetch('/api/inspection/table/manufacturers')
      .then(res => res.json())
      .then(data => setManufacturers(data))
      .catch(() => {
        toast({
          title: "エラー",
          description: "製造メーカーの読み込みに失敗しました",
          variant: "destructive",
        });
      });
  }, []);

  // 機種の読み込み
  useEffect(() => {
    if (selectedManufacturer) {
      fetch('/api/inspection/table/models')
        .then(res => res.json())
        .then(data => {
          const filteredModels = data.filter((model: any) => 
            model.manufacturer_id === selectedManufacturer
          );
          setModels(filteredModels);
        })
        .catch(() => {
          toast({
            title: "エラー",
            description: "機種の読み込みに失敗しました",
            variant: "destructive",
          });
        });
    } else {
      setModels([]);
    }
  }, [selectedManufacturer]);

  // 点検項目の読み込み
  useEffect(() => {
    if (selectedManufacturer && selectedModel) {
      fetch('/api/inspection/table/inspection_items')
        .then(res => res.json())
        .then(data => {
          const filteredItems = data.filter((item: any) =>
            item.manufacturer_id === selectedManufacturer &&
            item.model_id === selectedModel
          );
          setItems(filteredItems);
        })
        .catch(() => {
          toast({
            title: "エラー",
            description: "点検項目の読み込みに失敗しました",
            variant: "destructive",
          });
        });
    }
  }, [selectedManufacturer, selectedModel]);

  const handleEdit = (item: InspectionItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSelectedItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await fetch('/api/inspection/table/inspection_items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(items),
      });
      toast({
        title: "成功",
        description: "データを保存しました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "データの保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const csvContent = convertToCSV(items);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '点検項目一覧.csv';
    link.click();
  };

  const convertToCSV = (items: InspectionItem[]) => {
    const header = ['部位', '装置', '確認箇所', '判断基準', '確認要領'];
    const rows = items.map(item => [
      item.category,
      item.equipment,
      item.item,
      item.criteria,
      item.method
    ]);
    return [header, ...rows].map(row => row.join(',')).join('\n');
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">点検項目編集</h1>
      
      <div className="flex gap-4 mb-6">
        <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="製造メーカーを選択" />
          </SelectTrigger>
          <SelectContent>
            {manufacturers.map(manufacturer => (
              <SelectItem key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="機種を選択" />
          </SelectTrigger>
          <SelectContent>
            {models.map(model => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between mb-4">
        <Button onClick={() => handleEdit({ id: '', category: '', equipment: '', item: '', criteria: '', method: '' })}>
          <PlusIcon className="h-4 w-4 mr-2" />
          新規追加
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">エクスポート(CSV)</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>部位</TableHead>
            <TableHead>装置</TableHead>
            <TableHead>確認箇所</TableHead>
            <TableHead>判断基準</TableHead>
            <TableHead>確認要領</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.equipment}</TableCell>
              <TableCell>{item.item}</TableCell>
              <TableCell>{item.criteria}</TableCell>
              <TableCell>{item.method}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? '点検項目の編集' : '新規点検項目の追加'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category">部位</label>
              <Input
                id="category"
                value={editingItem?.category || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev!, category: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="equipment">装置</label>
              <Input
                id="equipment"
                value={editingItem?.equipment || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev!, equipment: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="item">確認箇所</label>
              <Input
                id="item"
                value={editingItem?.item || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev!, item: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="criteria">判断基準</label>
              <Input
                id="criteria"
                value={editingItem?.criteria || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev!, criteria: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="method">確認要領</label>
              <Input
                id="method"
                value={editingItem?.method || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev!, method: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={() => {
              if (editingItem?.id) {
                setItems(items.map(item => 
                  item.id === editingItem.id ? editingItem : item
                ));
              } else {
                setItems([...items, { ...editingItem!, id: String(Date.now()) }]);
              }
              setIsEditDialogOpen(false);
            }}>
              {editingItem?.id ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>点検項目の削除</AlertDialogTitle>
            <AlertDialogDescription>
              この点検項目を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setItems(items.filter(item => item.id !== selectedItemId));
              setIsDeleteDialogOpen(false);
            }}>
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
