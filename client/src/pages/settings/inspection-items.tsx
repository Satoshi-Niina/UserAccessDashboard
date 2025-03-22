import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InspectionItem {
  id: string;
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
}

interface Manufacturer {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  manufacturer_id: string;
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

  useEffect(() => {
    if (selectedManufacturer) {
      fetch('/api/inspection/table/models')
        .then(res => res.json())
        .then(data => {
          const filteredModels = data.filter((model: Model) => 
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

  useEffect(() => {
    if (selectedManufacturer && selectedModel) {
      fetch(`/api/inspection/table/inspection_items?manufacturer_id=${selectedManufacturer}&model_id=${selectedModel}`)
        .then(res => res.json())
        .then(data => setItems(data))
        .catch(() => {
          toast({
            title: "エラー",
            description: "点検項目の読み込みに失敗しました",
            variant: "destructive",
          });
        });
    } else {
      setItems([]);
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

  const handleConfirmDelete = () => {
    setItems(items.filter(item => item.id !== selectedItemId));
    setIsDeleteDialogOpen(false);
    toast({
      title: "削除完了",
      description: "項目が削除されました",
    });
  };

  const handleSaveEdit = (updatedItem: InspectionItem) => {
    setItems(items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setIsEditDialogOpen(false);
    toast({
      title: "更新完了",
      description: "項目が更新されました",
    });
  };

  const handleAddRecord = () => {
    const newItem: InspectionItem = {
      id: Date.now().toString(),
      category: "",
      equipment: "",
      item: "",
      criteria: "",
      method: "",
    };
    setEditingItem(newItem);
    setIsEditDialogOpen(true);
  };

  const handleExport = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(items, null, 2)], {type: 'text/json'});
    element.href = URL.createObjectURL(file);
    element.download = "inspection_items.json";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">点検項目編集</h1>
        <div className="flex gap-4">
          <Button onClick={() => window.location.href = "/dashboard"}>
            キャンセル
          </Button>
          <Button onClick={handleExport}>
            エクスポート
          </Button>
          <Button variant="default" onClick={handleSaveEdit}>
            編集完了保存
          </Button>
        </div>
      </div>

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

      <div className="flex justify-end mb-4">
        <Button onClick={handleAddRecord}>
          <PlusIcon className="h-4 w-4 mr-2" />
          レコード追加
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>部位</TableHead>
            <TableHead>装置</TableHead>
            <TableHead>確認箇所</TableHead>
            <TableHead>判断基準</TableHead>
            <TableHead>確認要領</TableHead>
            <TableHead className="text-right">編集</TableHead>
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
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? '項目の編集' : '新規項目の追加'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="部位"
              value={editingItem?.category || ''}
              onChange={(e) => setEditingItem(prev => ({ ...prev!, category: e.target.value }))}
            />
            <Input
              placeholder="装置"
              value={editingItem?.equipment || ''}
              onChange={(e) => setEditingItem(prev => ({ ...prev!, equipment: e.target.value }))}
            />
            <Input
              placeholder="確認箇所"
              value={editingItem?.item || ''}
              onChange={(e) => setEditingItem(prev => ({ ...prev!, item: e.target.value }))}
            />
            <Input
              placeholder="判断基準"
              value={editingItem?.criteria || ''}
              onChange={(e) => setEditingItem(prev => ({ ...prev!, criteria: e.target.value }))}
            />
            <Input
              placeholder="確認要領"
              value={editingItem?.method || ''}
              onChange={(e) => setEditingItem(prev => ({ ...prev!, method: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={() => handleSaveEdit(editingItem!)}>
              完了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              この項目を削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}