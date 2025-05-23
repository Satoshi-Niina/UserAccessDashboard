import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLocation } from 'wouter';

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
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("items");
  const [selectedTable, setSelectedTable] = useState("manufacturers");
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [machineNumbers, setMachineNumbers] = useState<MachineNumber[]>([]);
  const [editItem, setEditItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedManufacturerState, setSelectedManufacturerState] = useState<string | undefined>(undefined);
  const [selectedModelState, setSelectedModelState] = useState<string | undefined>(undefined);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isModified, setIsModified] = useState(false); //Track modifications
  const { toast } = useToast();

  const tableOptions = [
    { value: "manufacturers", label: "製造メーカー" },
    { value: "models", label: "機種" },
    { value: "machine_numbers", label: "機械番号" }
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 製造メーカーの取得
        const manufacturersResponse = await fetch('/api/inspection/table/manufacturers');
        if (!manufacturersResponse.ok) throw new Error('製造メーカーの取得に失敗しました');
        const manufacturersData = await manufacturersResponse.json();
        setManufacturers(manufacturersData);

        // 機種の取得
        const modelsResponse = await fetch('/api/inspection/table/models');
        if (!modelsResponse.ok) throw new Error('機種の取得に失敗しました');
        const modelsData = await modelsResponse.json();
        setModels(modelsData);

        // 点検項目の取得
        const itemsResponse = await fetch('/api/inspection/table/inspection_items');
        if (!itemsResponse.ok) throw new Error('点検項目の取得に失敗しました');
        const itemsData = await itemsResponse.json();
        setItems(itemsData);

        // 機械番号の取得
        const machineNumbersResponse = await fetch('/api/inspection/table/machine_numbers');
        if (!machineNumbersResponse.ok) throw new Error('機械番号の取得に失敗しました');
        const machineNumbersData = await machineNumbersResponse.json();
        setMachineNumbers(machineNumbersData);

        // 選択されているテーブルのデータを設定
        if (selectedTable) {
          const selectedData = await fetch(`/api/inspection/table/${selectedTable}`);
          if (!selectedData.ok) throw new Error('テーブルデータの取得に失敗しました');
          const data = await selectedData.json();
          setTableData(data);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    fetchAllData();
  }, [selectedTable, toast]);

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
        case "inspection_items":
          data = items;
          break;
        case "machine_numbers":
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
    setIsModified(true); //Set modified flag on drag
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
              <Select value={selectedManufacturerState} onValueChange={setSelectedManufacturerState}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="製造メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">すべて</SelectItem>
                    {manufacturers.map(manufacturer => (
                      manufacturer.name.trim() !== '' && (
                        <SelectItem key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</SelectItem>
                      )
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={selectedModelState} onValueChange={setSelectedModelState}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">すべて</SelectItem>
                    {models
                      .filter(model => !selectedManufacturerState || selectedManufacturerState === "all" || model.manufacturer_id === selectedManufacturerState)
                      .map(model => (
                        <SelectItem key={model.id} value={model.id || 'default_value'}>
                          {model.name && typeof model.name === 'string' ? model.name.trim() : '(名称なし)'}

                        </SelectItem>
                      ))}
                  </SelectGroup>
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

                {/* 点検項目編集画面の保存・キャンセルボタン */}
                <div className="flex justify-end gap-4 mt-4">
                  <Button variant="outline" onClick={() => {
                    if (window.confirm("編集をキャンセルしますか？")) {
                      window.location.href = '/';
                    }
                  }}>
                    キャンセル
                  </Button>
                  <Button onClick={async () => {
                    try {
                      const response = await fetch('/api/inspection-items', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(items)
                      });

                      if (!response.ok) throw new Error('保存に失敗しました');

                      toast({
                        title: "成功",
                        description: "点検項目が保存されました",
                      });
                    } catch (error) {
                      toast({
                        title: "エラー",
                        description: "保存に失敗しました",
                        variant: "destructive"
                      });
                    }
                  }}>
                    保存
                  </Button>
                </div>
              </DragDropContext>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tables">
          <div className="space-y-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="テーブルを選択" />
              </SelectTrigger>
              <SelectContent>
                {tableOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Table>
              <TableHeader>
                <TableRow>
                  {selectedTable === 'manufacturers' && (
                    <>
                      <TableHead>ID</TableHead>
                      <TableHead>名前</TableHead>
                    </>
                  )}
                  {selectedTable === 'models' && (
                    <>
                      <TableHead>ID</TableHead>
                      <TableHead>名前</TableHead>
                      <TableHead>製造メーカーID</TableHead>
                    </>
                  )}
                  {selectedTable === 'inspection_items' && (
                    <>
                      <TableHead>ID</TableHead>
                      <TableHead>部位</TableHead>
                      <TableHead>装置</TableHead>
                      <TableHead>確認箇所</TableHead>
                      <TableHead>判断基準</TableHead>
                      <TableHead>確認要領</TableHead>
                    </>
                  )}
                  {selectedTable === 'machine_numbers' && (
                    <>
                      <TableHead>ID</TableHead>
                      <TableHead>番号</TableHead>
                      <TableHead>機種ID</TableHead>
                    </>
                  )}
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((item, index) => (
                  <TableRow key={item.id || index}>
                    {selectedTable === 'manufacturers' && (
                      <>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                      </>
                    )}
                    {selectedTable === 'models' && (
                      <>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.manufacturer_id}</TableCell>
                      </>
                    )}
                    {selectedTable === 'inspection_items' && (
                      <>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.equipment}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.criteria}</TableCell>
                        <TableCell>{item.method}</TableCell>
                      </>
                    )}
                    {selectedTable === 'machine_numbers' && (
                      <>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.number}</TableCell>
                        <TableCell>{item.model_id}</TableCell>
                      </>
                    )}
                    <TableCell>
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
                ))}
              </TableBody>
            </Table>

            {/* テーブル編集画面のボタン */}
            <div className="flex justify-end gap-4 mb-4">
              <Button variant="outline" onClick={() => {
                if (window.confirm("テーブル編集をキャンセルしますか？")) {
                  setActiveTab("items");
                }
              }}>
                キャンセル
              </Button>
              <Button onClick={async () => {
                try {
                  const endpoint = `/api/${selectedTable}`;
                  const response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tableData)
                  });

                  if (!response.ok) throw new Error('保存に失敗しました');

                  toast({
                    title: "成功",
                    description: "データが保存されました",
                  });
                } catch (error) {
                  toast({
                    title: "エラー",
                    description: "保存に失敗しました",
                    variant: "destructive"
                  });
                }
              }}>
                保存
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
              {selectedTable === 'manufacturers' && (
                <div>
                  <label>メーカー名</label>
                  <Input
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  />
                </div>
              )}

              {selectedTable === 'models' && (
                <>
                  <div>
                    <label>機種名</label>
                    <Input
                      value={editItem.name}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>製造メーカー</label>
                    <Select 
                      value={editItem.manufacturer_id} 
                      onValueChange={(value) => setEditItem({ ...editItem, manufacturer_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="製造メーカーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {manufacturers.map(manufacturer => (
                          <SelectItem 
                          key={manufacturer.id} 
                          value={manufacturer.id || 'no-id'}
                        >
                            {manufacturer.name || '(名称未設定)'}
                        </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {selectedTable === 'machine_numbers' && (
                <>
                  <div>
                    <label>機械番号</label>
                    <Input
                      value={editItem.number}
                      onChange={(e) => setEditItem({ ...editItem, number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>機種</label>
                    <Select 
                      value={editItem.model_id} 
                      onValueChange={(value) => setEditItem({ ...editItem, model_id: value })}
                    >
                      <SelectTrigger>
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
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={async () => {
              try {
                if (selectedTable === 'manufacturers') {
                  const response = await fetch('/api/manufacturers', {
                    method: editItem.id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editItem)
                  });
                  if (!response.ok) throw new Error('保存に失敗しました');
                } else if (selectedTable === 'models') {
                  const response = await fetch('/api/models', {
                    method: editItem.id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editItem)
                  });
                  if (!response.ok) throw new Error('保存に失敗しました');
                } else if (selectedTable === 'machine_numbers') {
                  const response = await fetch('/api/machineNumbers', {
                    method: editItem.id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editItem)
                  });
                  if (!response.ok) throw new Error('保存に失敗しました');
                }

                // テーブルデータを更新
                const updatedData = tableData.map(item => 
                  item.id === editItem.id ? editItem : item
                );
                if (!editItem.id) {
                  updatedData.push(editItem);
                }
                setTableData(updatedData);

                toast({
                  title: "成功",
                  description: "データを保存しました",
                });
                setIsEditDialogOpen(false);
              } catch (error) {
                console.error('保存エラー:', error);
                toast({
                  title: "エラー",
                  description: "保存に失敗しました",
                  variant: "destructive"
                });
              }
            }}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}