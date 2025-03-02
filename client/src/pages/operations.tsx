import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast"; // Corrected import path
import { ListChecks, Edit, Trash2, Plus, Save, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// CSVのデータモデル
interface InspectionItem {
  id: string;
  manufacturer: string;
  modelType: string;
  engineType: string;
  part: string;
  device: string;
  procedure: string;
  checkPoint: string;
  judgmentCriteria: string;
  checkMethod: string;
  measurement: string;
  graphicRecord: string;
  order?: number;
}

// カラム定義
interface Column {
  id: string;
  name: string;
  required: boolean;
}

// 初期カラム定義
const initialColumns: Column[] = [
  { id: "manufacturer", name: "製造メーカー", required: true },
  { id: "modelType", name: "機種", required: true },
  { id: "engineType", name: "エンジン型式", required: false },
  { id: "part", name: "部位", required: true },
  { id: "device", name: "装置", required: true },
  { id: "procedure", name: "手順", required: false },
  { id: "checkPoint", name: "確認箇所", required: true },
  { id: "judgmentCriteria", name: "判断基準", required: true },
  { id: "checkMethod", name: "確認要領", required: false },
  { id: "measurement", name: "測定等記録", required: false },
  { id: "graphicRecord", name: "図形記録", required: false },
];

// CSVの項目を処理して表示用のアイテムに変換する関数
const parseCSVData = (csvText: string): InspectionItem[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map((line, index) => {
    const values = line.split(',');

    return {
      id: (index + 1).toString(),
      manufacturer: values[0] || '',
      modelType: values[1] || '',
      engineType: values[2] || '',
      part: values[3] || '',
      device: values[4] || '',
      procedure: values[5] || '',
      checkPoint: values[6] || '',
      judgmentCriteria: values[7] || '',
      checkMethod: values[8] || '',
      measurement: values[9] || '',
      graphicRecord: values[10] || '',
      order: index + 1
    };
  });
};

// サンプルCSVデータの読み込み（実際には外部ファイルから取得する）
const loadSampleData = async (): Promise<InspectionItem[]> => {
  // 実際の実装では、APIからCSVデータを取得する
  try {
    const response = await fetch("/attached_assets/仕業点検マスタ.csv");
    const csvText = await response.text();
    return parseCSVData(csvText);
  } catch (error) {
    console.error("CSVデータの読み込みに失敗しました:", error);
    return [];
  }
};

export default function Operations() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [filterManufacturer, setFilterManufacturer] = useState<string>("all");
  const [filterModelType, setFilterModelType] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<InspectionItem>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editColumnId, setEditColumnId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);

  // CSVデータの読み込み
  useEffect(() => {
    const fetchData = async () => {
      const data = await loadSampleData();
      setItems(data);

      // フィルター用の製造メーカーと機種のリストを作成
      const uniqueManufacturers = Array.from(new Set(data.map(item => item.manufacturer))).filter(Boolean);
      const uniqueModelTypes = Array.from(new Set(data.map(item => item.modelType))).filter(Boolean);

      setManufacturers(uniqueManufacturers);
      setModelTypes(uniqueModelTypes);
    };

    fetchData();
  }, []);

  // フィルター適用後のアイテム
  const filteredItems = items.filter(item => {
    const matchManufacturer = filterManufacturer === "all" || item.manufacturer === filterManufacturer;
    const matchModelType = filterModelType === "all" || item.modelType === filterModelType;
    return matchManufacturer && matchModelType;
  });

  // 項目の追加
  const handleAddItem = () => {
    const newId = (Math.max(0, ...items.map(item => parseInt(item.id))) + 1).toString();
    const newItemWithId = { ...newItem, id: newId, order: items.length + 1 };

    setItems([...items, newItemWithId as InspectionItem]);
    setNewItem({});
    setIsAddDialogOpen(false);

    toast({
      title: "項目を追加しました",
      description: "新しい点検項目を追加しました。",
    });
  };

  // 項目の編集
  const handleEditItem = (item: InspectionItem) => {
    setEditingItem(item);
  };

  // 編集の保存
  const handleSaveEdit = () => {
    if (!editingItem) return;

    const updatedItems = items.map(item => 
      item.id === editingItem.id ? editingItem : item
    );

    setItems(updatedItems);
    setEditingItem(null);

    toast({
      title: "変更を保存しました",
      description: "点検項目の変更を保存しました。",
    });
  };

  // 項目の削除
  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);

    toast({
      title: "項目を削除しました",
      description: "点検項目を削除しました。",
    });
  };

  // ドラッグ&ドロップの処理
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(filteredItems);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    // 順序を更新
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    // 元のアイテムリストと合わせて更新
    const newItems = items.map(item => {
      const updatedItem = updatedItems.find(updated => updated.id === item.id);
      return updatedItem || item;
    });

    setItems(newItems);

    toast({
      title: "項目を並べ替えました",
      description: "点検項目の順序を変更しました。",
    });
  };

  // カラムの追加
  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const columnId = newColumnName.toLowerCase().replace(/\s+/g, '_');

    if (columns.some(col => col.id === columnId)) {
      toast({
        title: "エラー",
        description: "同じIDのカラムが既に存在します。",
        variant: "destructive"
      });
      return;
    }

    const newColumn = {
      id: columnId,
      name: newColumnName,
      required: false
    };

    setColumns([...columns, newColumn]);
    setNewColumnName('');
    setIsAddColumnDialogOpen(false);

    toast({
      title: "カラムを追加しました",
      description: `「${newColumnName}」カラムを追加しました。`,
    });
  };

  // カラム名の編集
  const handleEditColumn = () => {
    if (!editColumnId || !newColumnName.trim()) return;

    const updatedColumns = columns.map(col => 
      col.id === editColumnId ? { ...col, name: newColumnName } : col
    );

    setColumns(updatedColumns);
    setEditColumnId(null);
    setNewColumnName('');

    toast({
      title: "カラム名を更新しました",
      description: `カラム名を「${newColumnName}」に更新しました。`,
    });
  };

  // カラムの削除
  const handleDeleteColumn = (id: string) => {
    // 必須カラムは削除不可
    const columnToDelete = columns.find(col => col.id === id);
    if (columnToDelete?.required) {
      toast({
        title: "削除できません",
        description: "必須カラムは削除できません。",
        variant: "destructive"
      });
      return;
    }

    const updatedColumns = columns.filter(col => col.id !== id);
    setColumns(updatedColumns);

    toast({
      title: "カラムを削除しました",
      description: "カラムを削除しました。",
    });
  };

  // CSVとしてエクスポート
  const exportToCSV = () => {
    const headers = columns.map(col => col.name).join(',');
    const rows = items.map(item => {
      return columns.map(col => item[col.id as keyof InspectionItem] || '').join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '仕業点検マスタ.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "エクスポート完了",
      description: "CSVファイルをエクスポートしました。",
    });
  };

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">運用管理</h1>
            </div>

            <TabsContent value="operations" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-2xl font-bold">
                    <ListChecks className="inline-block mr-2" />
                    仕業点検マスタ
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddColumnDialogOpen(true)}
                      size="sm"
                    >
                      カラム追加
                    </Button>
                    <Button
                      variant="outline"
                      onClick={exportToCSV}
                      size="sm"
                    >
                      CSVエクスポート
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* フィルター */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="w-52">
                        <Label>製造メーカー</Label>
                        <Select
                          value={filterManufacturer}
                          onValueChange={setFilterManufacturer}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="メーカー選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            {manufacturers.map((manufacturer) => (
                              <SelectItem key={manufacturer} value={manufacturer}>
                                {manufacturer}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-52">
                        <Label>機種</Label>
                        <Select
                          value={filterModelType}
                          onValueChange={setFilterModelType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="機種選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            {modelTypes.map((modelType) => (
                              <SelectItem key={modelType} value={modelType}>
                                {modelType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button 
                          variant="default" 
                          className="ml-2"
                          onClick={() => setIsAddDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-1" /> 新規項目
                        </Button>
                      </div>
                    </div>

                    {/* データテーブル */}
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="inspection-items">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="border rounded-md"
                          >
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-10"></TableHead>
                                  {columns.map((column) => (
                                    <TableHead key={column.id} className="min-w-32">
                                      <div className="flex items-center gap-2">
                                        <span>{column.name}</span>
                                        <div className="flex space-x-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => {
                                              setEditColumnId(column.id);
                                              setNewColumnName(column.name);
                                            }}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => handleDeleteColumn(column.id)}
                                            disabled={column.required}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </TableHead>
                                  ))}
                                  <TableHead className="w-28">操作</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredItems.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={columns.length + 2} className="text-center py-8">
                                      データがありません。新しい項目を追加してください。
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredItems.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                      {(provided) => (
                                        <TableRow
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                        >
                                          <TableCell className="text-center">
                                            {index + 1}
                                          </TableCell>
                                          {columns.map((column) => (
                                            <TableCell key={`${item.id}-${column.id}`}>
                                              {editingItem && editingItem.id === item.id ? (
                                                <Input
                                                  value={editingItem[column.id as keyof InspectionItem] as string || ''}
                                                  onChange={(e) => 
                                                    setEditingItem({
                                                      ...editingItem,
                                                      [column.id]: e.target.value
                                                    })
                                                  }
                                                />
                                              ) : (
                                                item[column.id as keyof InspectionItem] || ''
                                              )}
                                            </TableCell>
                                          ))}
                                          <TableCell>
                                            <div className="flex space-x-1">
                                              {editingItem && editingItem.id === item.id ? (
                                                <>
                                                  <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    onClick={handleSaveEdit}
                                                  >
                                                    <Save className="h-4 w-4" />
                                                  </Button>
                                                  <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    onClick={() => setEditingItem(null)}
                                                  >
                                                    <X className="h-4 w-4" />
                                                  </Button>
                                                </>
                                              ) : (
                                                <>
                                                  <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    onClick={() => handleEditItem(item)}
                                                  >
                                                    <Edit className="h-4 w-4" />
                                                  </Button>
                                                  <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteItem(item.id)}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </main>
      </div>

      {/* 新規項目追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>新規点検項目の追加</DialogTitle>
            <DialogDescription>
              新しい点検項目の詳細を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns.map((column) => (
              <div key={column.id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={column.id} className="text-right">
                  {column.name} {column.required && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id={column.id}
                  value={newItem[column.id as keyof InspectionItem] as string || ''}
                  onChange={(e) => 
                    setNewItem({ ...newItem, [column.id]: e.target.value })
                  }
                  className="col-span-3"
                  required={column.required}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" onClick={handleAddItem}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* カラム名編集ダイアログ */}
      <Dialog open={!!editColumnId} onOpenChange={(open) => !open && setEditColumnId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>カラム名の編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="column-name" className="text-right">
                カラム名
              </Label>
              <Input
                id="column-name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditColumnId(null)}>
              キャンセル
            </Button>
            <Button type="submit" onClick={handleEditColumn}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* カラム追加ダイアログ */}
      <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新規カラムの追加</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-column-name" className="text-right">
                カラム名
              </Label>
              <Input
                id="new-column-name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddColumnDialogOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" onClick={handleAddColumn}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}