
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { Plus, Edit, Trash2, Move } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// 仮のデータ
const initialItems = [
  { id: '1', name: 'エンジン始動確認', order: 1 },
  { id: '2', name: 'ブレーキ点検', order: 2 },
  { id: '3', name: 'オイル量確認', order: 3 },
  { id: '4', name: '冷却水量確認', order: 4 },
  { id: '5', name: 'タイヤ空気圧確認', order: 5 },
];

// カラム初期データ
const initialColumns = [
  { id: 'name', name: '点検項目名', required: true },
  { id: 'standard', name: '基準値', required: false },
  { id: 'unit', name: '単位', required: false },
];

export default function InspectionItems() {
  const [items, setItems] = useState(initialItems);
  const [columns, setColumns] = useState(initialColumns);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isColumnManageOpen, setIsColumnManageOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [editColumnId, setEditColumnId] = useState<string | null>(null);

  // 項目の並び替え処理
  const handleItemDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);
    
    // orderの更新
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    setItems(updatedItems);
    toast({
      title: "並び順を更新しました",
      description: "点検項目の並び順が更新されました。",
    });
  };

  // カラムの並び替え処理
  const handleColumnDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const reorderedColumns = Array.from(columns);
    const [removed] = reorderedColumns.splice(result.source.index, 1);
    reorderedColumns.splice(result.destination.index, 0, removed);
    
    setColumns(reorderedColumns);
    toast({
      title: "カラム順を更新しました",
      description: "カラムの並び順が更新されました。",
    });
  };

  // 項目の追加
  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    
    const newId = (items.length + 1).toString();
    const newItem = {
      id: newId,
      name: newItemName,
      order: items.length + 1
    };
    
    setItems([...items, newItem]);
    setNewItemName('');
    setIsAddItemOpen(false);
    
    toast({
      title: "項目を追加しました",
      description: `「${newItemName}」を追加しました。`,
    });
  };

  // 項目の編集
  const handleEditItem = () => {
    if (!currentItem || !newItemName.trim()) return;
    
    const updatedItems = items.map(item => 
      item.id === currentItem.id ? { ...item, name: newItemName } : item
    );
    
    setItems(updatedItems);
    setIsEditItemOpen(false);
    setCurrentItem(null);
    setNewItemName('');
    
    toast({
      title: "項目を更新しました",
      description: "点検項目の名前を更新しました。",
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

  // カラムの追加
  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    
    const newId = `col_${Date.now()}`;
    const newColumn = {
      id: newId,
      name: newColumnName,
      required: false
    };
    
    setColumns([...columns, newColumn]);
    setNewColumnName('');
    
    toast({
      title: "カラムを追加しました",
      description: `「${newColumnName}」カラムを追加しました。`,
    });
  };

  // カラム名の編集
  const handleEditColumn = (id: string, newName: string) => {
    const updatedColumns = columns.map(col => 
      col.id === id ? { ...col, name: newName } : col
    );
    
    setColumns(updatedColumns);
    setEditColumnId(null);
    
    toast({
      title: "カラム名を更新しました",
      description: "カラム名を更新しました。",
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">点検項目管理</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsColumnManageOpen(true)}>
            カラム管理
          </Button>
          <Button onClick={() => setIsAddItemOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 点検項目追加
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>点検項目一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleItemDragEnd}>
            <Droppable droppableId="inspection-items">
              {(provided) => (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>No.</TableHead>
                      {columns.map(col => (
                        <TableHead key={col.id}>{col.name}</TableHead>
                      ))}
                      <TableHead className="w-24">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="hover:bg-muted/50"
                          >
                            <TableCell {...provided.dragHandleProps}>
                              <Move className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell>{item.order}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            {columns.slice(1).map(col => (
                              <TableCell key={col.id}>-</TableCell>
                            ))}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setCurrentItem(item);
                                    setNewItemName(item.name);
                                    setIsEditItemOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                </Table>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* 点検項目追加ダイアログ */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>点検項目の追加</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                項目名
              </Label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddItem}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 点検項目編集ダイアログ */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>点検項目の編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                項目名
              </Label>
              <Input
                id="edit-name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEditItem}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* カラム管理ダイアログ */}
      <Dialog open={isColumnManageOpen} onOpenChange={setIsColumnManageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>カラム管理</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="新しいカラム名"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddColumn}>追加</Button>
            </div>
            
            <DragDropContext onDragEnd={handleColumnDragEnd}>
              <Droppable droppableId="columns">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {columns.map((column, index) => (
                      <Draggable
                        key={column.id}
                        draggableId={column.id}
                        index={index}
                        isDragDisabled={column.required}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center p-3 border rounded-md"
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="mr-2"
                            >
                              <Move className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            {editColumnId === column.id ? (
                              <Input
                                value={column.name}
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  setColumns(columns.map(col => 
                                    col.id === column.id ? { ...col, name: newName } : col
                                  ));
                                }}
                                className="flex-1"
                                autoFocus
                                onBlur={() => handleEditColumn(column.id, column.name)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditColumn(column.id, column.name);
                                  }
                                }}
                              />
                            ) : (
                              <span className="flex-1">{column.name}</span>
                            )}
                            
                            {column.required && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md mr-2">
                                必須
                              </span>
                            )}
                            
                            <div className="flex gap-1">
                              {!column.required && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditColumnId(column.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteColumn(column.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsColumnManageOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
