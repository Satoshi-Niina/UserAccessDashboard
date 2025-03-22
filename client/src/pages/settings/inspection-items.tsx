import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Manufacturer {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  manufacturer_id: string;
}

interface InspectionItem {
  id: string;
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
  model_id: string; // Added model_id to InspectionItem
}

interface MachineNumber {
  number: string;
  model_id: string;
}

export default function InspectionItems() {
  // State management
  const [activeTab, setActiveTab] = useState("items");
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [machineNumbers, setMachineNumbers] = useState<MachineNumber[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const { toast } = useToast();
  const [insertPosition, setInsertPosition] = useState<{index: number, position: 'above' | 'below'} | null>(null);


  // Data fetching
  useEffect(() => {
    fetchManufacturers();
    fetchModels();
    fetchItems();
    fetchMachineNumbers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      const response = await fetch('/api/inspection/table/manufacturers');
      const data = await response.json();
      setManufacturers(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: "製造メーカーの読み込みに失敗しました",
        variant: "destructive"
      });
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/inspection/table/models');
      const data = await response.json();
      setModels(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: "機種の読み込みに失敗しました",
        variant: "destructive"
      });
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/inspection/table/inspection_items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: "点検項目の読み込みに失敗しました",
        variant: "destructive"
      });
    }
  };

  const fetchMachineNumbers = async () => {
    try {
      const response = await fetch('/api/inspection/table/machine_numbers');
      const data = await response.json();
      setMachineNumbers(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: "機械番号の読み込みに失敗しました",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  };

  const handleManufacturerChange = (value: string) => {
    setSelectedManufacturer(value);
    setSelectedModel("");
  };


  const handleAddRecord = (index: number | null = null, position: 'above' | 'below' | null = null) => {
    const newItem: InspectionItem = {
      id: Date.now().toString(),
      category: "",
      equipment: "",
      item: "",
      criteria: "",
      method: "",
      model_id: selectedModel // Assign selected model_id to new item
    };

    const newItems = [...items];
    if (index !== null && position !== null) {
      const insertIndex = position === 'above' ? index : index + 1;
      newItems.splice(insertIndex, 0, newItem);
    } else {
      newItems.push(newItem);
    }
    setItems(newItems);
    setEditingItem(newItem);
    setIsEditDialogOpen(true);
  };

  const handleCancel = () => {
    window.history.back();
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

  const handleConfirmDelete = () => {
    setItems(items.filter(item => item.id !== selectedItemId));
    setIsDeleteDialogOpen(false);
    toast({
      title: "削除完了",
      description: "項目が削除されました",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">点検項目編集</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="items">項目一覧編集</TabsTrigger>
          <TabsTrigger value="tables">テーブル編集</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="mb-6 flex gap-4 items-center">
            <Select value={selectedManufacturer} onValueChange={handleManufacturerChange}>
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

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="border border-gray-200">部位</TableHead>
                        <TableHead className="border border-gray-200">装置</TableHead>
                        <TableHead className="border border-gray-200">確認箇所</TableHead>
                        <TableHead className="border border-gray-200">判断基準</TableHead>
                        <TableHead className="border border-gray-200">確認要領</TableHead>
                        <TableHead className="border border-gray-200 w-24">編集</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="border-b border-gray-200"
                            >
                              <TableCell className="border border-gray-200">{item.category}</TableCell>
                              <TableCell className="border border-gray-200">{item.equipment}</TableCell>
                              <TableCell className="border border-gray-200">{item.item}</TableCell>
                              <TableCell className="border border-gray-200">{item.criteria}</TableCell>
                              <TableCell className="border border-gray-200">{item.method}</TableCell>
                              <TableCell className="border border-gray-200">
                                <div className="flex gap-2">
                                  <button onClick={() => handleAddRecord(index, 'above')}>↑</button>
                                  <button onClick={() => handleAddRecord(index, 'below')}>↓</button>
                                  <PencilIcon className="w-5 h-5 cursor-pointer" onClick={() => {
                                    setEditingItem(item);
                                    setIsEditDialogOpen(true);
                                  }} />
                                  <TrashIcon className="w-5 h-5 cursor-pointer text-red-500" onClick={() => {
                                    setSelectedItemId(item.id);
                                    setIsDeleteDialogOpen(true);
                                  }} />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div className="flex justify-end mt-4">
            <Button onClick={() => handleAddRecord()}>レコード追加</Button>
          </div>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>項目編集</DialogTitle>
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
                <AlertDialogAction onClick={handleConfirmDelete}>削除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="tables">
          <div className="space-y-8">
            {/* 製造メーカーテーブル */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">製造メーカー</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>メーカー名</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manufacturers.map((manufacturer) => (
                    <TableRow key={manufacturer.id}>
                      <TableCell>{manufacturer.id}</TableCell>
                      <TableCell>{manufacturer.name}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 機種テーブル */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">機種</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>機種名</TableHead>
                    <TableHead>メーカーID</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>{model.id}</TableCell>
                      <TableCell>{model.name}</TableCell>
                      <TableCell>{model.manufacturer_id}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 点検項目テーブル */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">点検項目</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>部位</TableHead>
                    <TableHead>装置</TableHead>
                    <TableHead>確認箇所</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.equipment}</TableCell>
                      <TableCell>{item.item}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 機械番号テーブル */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">機械番号</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>機械番号</TableHead>
                    <TableHead>機種ID</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machineNumbers.map((machine) => (
                    <TableRow key={machine.number}>
                      <TableCell>{machine.number}</TableCell>
                      <TableCell>{machine.model_id}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}