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
  model_id: string;
}

export default function InspectionItems() {
  const [activeTab, setActiveTab] = useState("items");
  const [selectedTable, setSelectedTable] = useState("manufacturers");
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [editItem, setEditItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const { toast } = useToast();

  // データ取得
  useEffect(() => {
    fetchManufacturers();
    fetchModels();
    fetchItems();
  }, []);

  const fetchManufacturers = async () => {
    try {
      const response = await fetch('/api/inspection/table/manufacturers');
      if (!response.ok) throw new Error('製造メーカーの取得に失敗しました');
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
      if (!response.ok) throw new Error('機種の取得に失敗しました');
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
      if (!response.ok) throw new Error('点検項目の取得に失敗しました');
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

  // テーブル保存処理
  const handleSaveTable = async () => {
    try {
      let data;
      switch (selectedTable) {
        case "manufacturers":
          data = manufacturers;
          break;
        case "models":
          data = models;
          break;
        case "items":
          data = items;
          break;
        default:
          return;
      }

      const response = await fetch(`/api/inspection/table/${selectedTable}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('保存に失敗しました');

      toast({
        title: "成功",
        description: "データを保存しました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive"
      });
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    const newItems = [...items];
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(destinationIndex, 0, movedItem);

    setItems(newItems);
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">点検項目編集</TabsTrigger>
          <TabsTrigger value="tables">テーブル編集</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="製造メーカー選択" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="機種選択" />
                </SelectTrigger>
                <SelectContent>
                  {models
                    .filter(model => !selectedManufacturer || model.manufacturer_id === selectedManufacturer)
                    .map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4">
              <DragDropContext onDragEnd={onDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>部位</TableHead>
                      <TableHead>装置</TableHead>
                      <TableHead>確認箇所</TableHead>
                      <TableHead>編集</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Droppable droppableId="items">
                    {(provided) => (
                      <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                        {items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <TableCell>{item.category}</TableCell>
                                <TableCell>{item.equipment}</TableCell>
                                <TableCell>{item.item}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                      setEditItem(item);
                                      setIsEditDialogOpen(true);
                                    }}>
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    )}
                  </Droppable>
                </Table>
              </DragDropContext>
            </div>

            <div className="flex justify-between mt-4">
              <Button onClick={handleSaveTable}>
                保存して終了
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("items")}>
                キャンセル
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tables">
          <div className="space-y-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="テーブル選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturers">製造メーカー</SelectItem>
                <SelectItem value="models">機種</SelectItem>
                <SelectItem value="items">点検項目</SelectItem>
              </SelectContent>
            </Select>

            {selectedTable === "manufacturers" && (
              <div className="border rounded-lg p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>メーカー名</TableHead>
                      <TableHead>編集</TableHead>
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
            )}

            {selectedTable === "models" && (
              <div className="border rounded-lg p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>機種名</TableHead>
                      <TableHead>メーカーID</TableHead>
                      <TableHead>編集</TableHead>
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
            )}

            <div className="flex justify-between mt-4">
              <Button onClick={handleSaveTable}>
                保存して終了
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("items")}>
                キャンセル
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>項目編集</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div>
                <label>部位</label>
                <Input
                  value={editItem.category}
                  onChange={(e) => setEditItem({...editItem, category: e.target.value})}
                />
              </div>
              <div>
                <label>装置</label>
                <Input
                  value={editItem.equipment}
                  onChange={(e) => setEditItem({...editItem, equipment: e.target.value})}
                />
              </div>
              <div>
                <label>確認箇所</label>
                <Input
                  value={editItem.item}
                  onChange={(e) => setEditItem({...editItem, item: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={() => {
              const newItems = items.map(item =>
                item.id === editItem.id ? editItem : item
              );
              setItems(newItems);
              setIsEditDialogOpen(false);
            }}>
              完了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}