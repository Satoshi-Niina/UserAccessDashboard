
// 点検項目編集ページ
// 点検項目の追加・編集・削除・並べ替え機能を提供
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clipboard, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { useState, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type InspectionItem = {
  id: number;
  name: string;
  order: number;
  columns: Column[];
};

type Column = {
  id: number;
  name: string;
  order: number;
};

// サンプルデータ（実際にはAPIから取得）
const initialItems: InspectionItem[] = [
  {
    id: 1,
    name: "車両本体点検",
    order: 1,
    columns: [
      { id: 1, name: "外観", order: 1 },
      { id: 2, name: "エンジン", order: 2 },
      { id: 3, name: "ブレーキ", order: 3 }
    ]
  },
  {
    id: 2,
    name: "安全装置点検",
    order: 2,
    columns: [
      { id: 4, name: "ライト", order: 1 },
      { id: 5, name: "警告装置", order: 2 }
    ]
  }
];

// ドラッグ可能な項目コンポーネント
const DraggableItem = ({ item, index, moveItem }: { item: InspectionItem, index: number, moveItem: (dragIndex: number, hoverIndex: number) => void }) => {
  const ref = useRef<HTMLTableRowElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: () => ({ index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'ITEM',
    hover: (draggedItem: { index: number }, monitor) => {
      if (!ref.current) return;
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      
      moveItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  return (
    <TableRow 
      ref={ref} 
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
    >
      <TableCell>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </TableCell>
      <TableCell>{item.name}</TableCell>
      <TableCell>{item.columns.length}</TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            編集
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-1" />
            削除
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// ドラッグ可能なカラムコンポーネント
const DraggableColumn = ({ column, index, moveColumn }: { column: Column, index: number, moveColumn: (dragIndex: number, hoverIndex: number) => void }) => {
  const ref = useRef<HTMLTableRowElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'COLUMN',
    item: () => ({ index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'COLUMN',
    hover: (draggedItem: { index: number }, monitor) => {
      if (!ref.current) return;
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      
      moveColumn(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  return (
    <TableRow 
      ref={ref} 
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
    >
      <TableCell>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </TableCell>
      <TableCell>{column.name}</TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            編集
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-1" />
            削除
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function InspectionItems() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [items, setItems] = useState<InspectionItem[]>(initialItems);
  const [selectedItem, setSelectedItem] = useState<InspectionItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);

  // 項目の並べ替え処理
  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const dragItem = items[dragIndex];
    const newItems = [...items];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    
    // 順序を更新
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));
    
    setItems(updatedItems);
  };

  // カラムの並べ替え処理
  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    if (!selectedItem) return;
    
    const dragColumn = selectedItem.columns[dragIndex];
    const newColumns = [...selectedItem.columns];
    newColumns.splice(dragIndex, 1);
    newColumns.splice(hoverIndex, 0, dragColumn);
    
    // 順序を更新
    const updatedColumns = newColumns.map((column, idx) => ({
      ...column,
      order: idx + 1
    }));
    
    const updatedItem = {
      ...selectedItem,
      columns: updatedColumns
    };
    
    setSelectedItem(updatedItem);
    setItems(items.map(item => 
      item.id === selectedItem.id ? updatedItem : item
    ));
  };

  // 新しい項目を追加
  const addNewItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: InspectionItem = {
      id: Math.max(0, ...items.map(i => i.id)) + 1,
      name: newItemName,
      order: items.length + 1,
      columns: []
    };
    
    setItems([...items, newItem]);
    setNewItemName("");
    setIsAddItemDialogOpen(false);
  };

  // 新しいカラムを追加
  const addNewColumn = () => {
    if (!selectedItem || !newColumnName.trim()) return;
    
    const newColumn: Column = {
      id: Math.max(0, ...selectedItem.columns.map(c => c.id)) + 1,
      name: newColumnName,
      order: selectedItem.columns.length + 1
    };
    
    const updatedItem = {
      ...selectedItem,
      columns: [...selectedItem.columns, newColumn]
    };
    
    setSelectedItem(updatedItem);
    setItems(items.map(item => 
      item.id === selectedItem.id ? updatedItem : item
    ));
    
    setNewColumnName("");
    setIsAddColumnDialogOpen(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen">
        <Sidebar onExpandChange={setIsMenuExpanded} />
        <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
          <main className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">点検項目編集</h1>
              <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    新規項目追加
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新規点検項目の追加</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="name" className="text-right">
                        項目名
                      </label>
                      <Input
                        id="name"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addNewItem}>追加</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 点検項目リスト */}
              <Card>
                <CardHeader>
                  <CardTitle>点検項目一覧</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead>項目名</TableHead>
                        <TableHead>カラム数</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <DraggableItem 
                          key={item.id}
                          item={item}
                          index={index}
                          moveItem={moveItem}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* 選択した項目のカラム一覧 */}
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle>
                    {selectedItem ? `「${selectedItem.name}」のカラム` : "カラム管理"}
                  </CardTitle>
                  {selectedItem && (
                    <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          新規カラム追加
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>新規カラムの追加</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="columnName" className="text-right">
                              カラム名
                            </label>
                            <Input
                              id="columnName"
                              value={newColumnName}
                              onChange={(e) => setNewColumnName(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={addNewColumn}>追加</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedItem ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead></TableHead>
                          <TableHead>カラム名</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedItem.columns.map((column, index) => (
                          <DraggableColumn
                            key={column.id}
                            column={column}
                            index={index}
                            moveColumn={moveColumn}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <Clipboard className="h-10 w-10 text-muted-foreground mb-4" />
                      <p>左の項目リストから項目を選択してください</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </DndProvider>
  );
}
