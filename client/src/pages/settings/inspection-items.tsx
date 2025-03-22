import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/use-toast";
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

interface MachineNumber {
  id: string;
  number: string;
  model_id: string;
}

export default function InspectionItems() {
  const [activeTab, setActiveTab] = useState("items");
  const [selectedTable, setSelectedTable] = useState("manufacturers");
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [machineNumbers, setMachineNumbers] = useState<MachineNumber[]>([]);
  const [editItem, setEditItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchManufacturers();
    fetchModels();
    fetchItems();
    fetchMachineNumbers();
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
      const response = await fetch('/api/inspection/table/items');
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

  const fetchMachineNumbers = async () => {
    try {
      const response = await fetch('/api/inspection/table/machine-numbers');
      if (!response.ok) throw new Error('機械番号の取得に失敗しました');
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

  const handleEdit = (item: any) => {
    setEditItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/inspection/table/machine-numbers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('削除に失敗しました');
      setMachineNumbers(machineNumbers.filter(machine => machine.id !== id));
      toast({ title: '成功', description: '機械番号を削除しました' });
    } catch (error) {
      toast({ title: 'エラー', description: '機械番号の削除に失敗しました', variant: 'destructive' });
    }
  };

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
        case "machineNumbers":
          data = machineNumbers;
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
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };


  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">点検項目編集</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="items">点検項目編集</TabsTrigger>
          <TabsTrigger value="tables">テーブル編集</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="space-y-4">
            <div className="flex gap-4 mb-4">
              <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="製造メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map(manufacturer => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  {models
                    .filter(model => !selectedManufacturer || model.manufacturer_id === selectedManufacturer)
                    .map(model => (
                      <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4">
              <DragDropContext onDragEnd={onDragEnd}>
                <Table className="border-collapse border border-gray-200">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border border-gray-200">部位</TableHead>
                      <TableHead className="border border-gray-200">装置</TableHead>
                      <TableHead className="border border-gray-200">確認箇所</TableHead>
                      <TableHead className="border border-gray-200">判断基準</TableHead>
                      <TableHead className="border border-gray-200">確認要領</TableHead>
                      <TableHead className="border border-gray-200">編集</TableHead>
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
                                <TableCell className="border border-gray-200">{item.category}</TableCell>
                                <TableCell className="border border-gray-200">{item.equipment}</TableCell>
                                <TableCell className="border border-gray-200">{item.item}</TableCell>
                                <TableCell className="border border-gray-200">{item.criteria}</TableCell>
                                <TableCell className="border border-gray-200">{item.method}</TableCell>
                                <TableCell className="border border-gray-200">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(item)}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(item.id)}
                                    >
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
                <SelectValue placeholder="テーブルを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturers">製造メーカー</SelectItem>
                <SelectItem value="models">機種</SelectItem>
                <SelectItem value="machine_numbers">機械番号</SelectItem>
              </SelectContent>
            </Select>

            {/* テーブル編集用のコンポーネントをここに実装 */}
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
              {editItem.number ? ( 
                <>
                  <div>
                    <label>機械番号</label>
                    <Input value={editItem.number} onChange={(e) => setEditItem({ ...editItem, number: e.target.value })} />
                  </div>
                  <div>
                    <label>機種ID</label>
                    <Input value={editItem.model_id} onChange={(e) => setEditItem({ ...editItem, model_id: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label>部位</label>
                    <Input
                      value={editItem.category}
                      onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>装置</label>
                    <Input
                      value={editItem.equipment}
                      onChange={(e) => setEditItem({ ...editItem, equipment: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>確認箇所</label>
                    <Input
                      value={editItem.item}
                      onChange={(e) => setEditItem({ ...editItem, item: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>判断基準</label>
                    <Input
                      value={editItem.criteria}
                      onChange={(e) => setEditItem({ ...editItem, criteria: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>確認要領</label>
                    <Input
                      value={editItem.method}
                      onChange={(e) => setEditItem({ ...editItem, method: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={() => {
              if (editItem.number) { 
                const newMachineNumbers = editItem.id
                  ? machineNumbers.map(machine => machine.id === editItem.id ? editItem : machine)
                  : [...machineNumbers, { ...editItem, id: (machineNumbers.length + 1).toString() }];
                setMachineNumbers(newMachineNumbers);
              } else { 
                const newItems = items.map(item =>
                  item.id === editItem.id ? editItem : item
                );
                setItems(newItems);
              }
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