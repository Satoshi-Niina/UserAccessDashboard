
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Download, Upload, Plus, Trash2, Edit, Save, X } from "lucide-react";
import Papa from 'papaparse';

type InspectionItem = {
  [key: string]: string;
};

type Column = {
  id: string;
  title: string;
  visible: boolean;
};

export default function InspectionItems() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // CSVデータの読み込み
  useEffect(() => {
    setLoading(true);
    fetch('/api/inspection-items')
      .then(response => response.text())
      .then(csvData => {
        const results = Papa.parse(csvData, { header: true, skipEmptyLines: true });
        if (results.data && Array.isArray(results.data)) {
          const parsedItems = results.data as InspectionItem[];
          setItems(parsedItems);
          
          // 先頭のアイテムからカラム情報を取得
          if (parsedItems.length > 0) {
            const firstItem = parsedItems[0];
            const columnList: Column[] = Object.keys(firstItem).map(key => ({
              id: key,
              title: key,
              visible: true
            }));
            setColumns(columnList);
          }
        }
      })
      .catch(err => {
        console.error('CSV読み込みエラー:', err);
        setError('データの読み込みに失敗しました');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // フィルターとカラム表示の変更を監視して表示アイテムを更新
  useEffect(() => {
    let filtered = [...items];
    
    // フィルターの適用
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        filtered = filtered.filter(item => item[key] === value);
      }
    });
    
    setFilteredItems(filtered);
  }, [items, filters]);

  // カラムフィルター用の一意の値を取得
  const getUniqueValuesForColumn = (columnId: string) => {
    return [...new Set(items.map(item => item[columnId]))].filter(Boolean).sort();
  };

  // フィルター変更ハンドラー
  const handleFilterChange = (columnId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value
    }));
  };

  // CSVエクスポート
  const handleExportCSV = () => {
    const csv = Papa.unparse(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '仕業点検マスタ.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSVインポート
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        const parsedItems = results.data as InspectionItem[];
        setItems(parsedItems);
        
        // カラム情報を更新
        if (parsedItems.length > 0) {
          const firstItem = parsedItems[0];
          const columnList: Column[] = Object.keys(firstItem).map(key => ({
            id: key,
            title: key,
            visible: true
          }));
          setColumns(columnList);
        }
      },
      error: function(error) {
        console.error('CSVパースエラー:', error);
        setError('CSVファイルの解析に失敗しました');
      }
    });
    
    // ファイル選択をリセット
    if (event.target) {
      event.target.value = '';
    }
  };

  // 新しいレコードを追加
  const handleAddRow = () => {
    const newItem: InspectionItem = {};
    columns.forEach(column => {
      newItem[column.id] = "";
    });
    setItems(prev => [...prev, newItem]);
  };

  // 新しいカラムを追加
  const handleAddColumn = () => {
    if (!newColumnName) return;
    
    // 新しいカラムを追加
    setColumns(prev => [...prev, {
      id: newColumnName,
      title: newColumnName,
      visible: true
    }]);
    
    // 既存のアイテムに新しいカラムのフィールドを追加
    setItems(prev => prev.map(item => ({
      ...item,
      [newColumnName]: ""
    })));
    
    setNewColumnName("");
  };

  // アイテム編集の開始
  const handleEditItem = (item: InspectionItem) => {
    setEditingItem({...item});
  };

  // アイテム編集の保存
  const handleSaveItem = () => {
    if (!editingItem) return;
    
    setItems(prev => prev.map(item => {
      // 一致するアイテムを特定するための条件
      // 実際のアプリケーションでは、一意のIDフィールドを使うべき
      const isMatch = Object.keys(item).every(key => 
        key === editingColumnId ? true : item[key] === editingItem[key]
      );
      
      return isMatch ? {...editingItem} : item;
    }));
    
    setEditingItem(null);
    setEditingColumnId(null);
  };

  // アイテム編集のキャンセル
  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditingColumnId(null);
  };

  // アイテム削除のダイアログを表示
  const handleShowDeleteItem = (index: number) => {
    setItemToDelete(index);
    setIsDeleteDialogOpen(true);
  };

  // アイテム削除の実行
  const handleDeleteItem = () => {
    if (itemToDelete === null) return;
    
    setItems(prev => prev.filter((_, index) => index !== itemToDelete));
    setItemToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // カラム削除のダイアログを表示
  const handleShowDeleteColumn = (columnId: string) => {
    setColumnToDelete(columnId);
    setIsDeleteDialogOpen(true);
  };

  // カラム削除の実行
  const handleDeleteColumn = () => {
    if (!columnToDelete) return;
    
    // カラムリストから削除
    setColumns(prev => prev.filter(col => col.id !== columnToDelete));
    
    // 各アイテムからもそのカラムのフィールドを削除
    setItems(prev => prev.map(item => {
      const newItem = {...item};
      delete newItem[columnToDelete];
      return newItem;
    }));
    
    setColumnToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // 変更をサーバーに保存
  const handleSaveChanges = () => {
    const csv = Papa.unparse(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const formData = new FormData();
    formData.append('file', blob, '仕業点検マスタ.csv');
    
    fetch('/api/upload-inspection-items', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('保存に失敗しました');
        }
        return response.json();
      })
      .then(data => {
        console.log('保存成功:', data);
        alert('変更が保存されました');
      })
      .catch(err => {
        console.error('保存エラー:', err);
        setError('データの保存に失敗しました');
      });
  };

  // ドラッグ可能な行コンポーネント
  const DraggableRow = ({ index, item, children }: { index: number, item: InspectionItem, children: React.ReactNode }) => {
    const [, drag] = useDrag({
      type: 'ROW',
      item: { index }
    });

    const [, drop] = useDrop({
      accept: 'ROW',
      hover(draggedItem: { index: number }) {
        if (draggedItem.index === index) {
          return;
        }
        
        // 行の順序を入れ替え
        setItems(prev => {
          const newItems = [...prev];
          const draggedRow = newItems[draggedItem.index];
          newItems.splice(draggedItem.index, 1);
          newItems.splice(index, 0, draggedRow);
          draggedItem.index = index;
          return newItems;
        });
      }
    });

    return (
      <TableRow ref={(node) => drag(drop(node))} className="cursor-move">
        {children}
      </TableRow>
    );
  };

  // ドラッグ可能なヘッダーコンポーネント
  const DraggableHeader = ({ index, column, children }: { index: number, column: Column, children: React.ReactNode }) => {
    const [, drag] = useDrag({
      type: 'COLUMN',
      item: { index }
    });

    const [, drop] = useDrop({
      accept: 'COLUMN',
      hover(draggedItem: { index: number }) {
        if (draggedItem.index === index) {
          return;
        }
        
        // カラムの順序を入れ替え
        setColumns(prev => {
          const newColumns = [...prev];
          const draggedColumn = newColumns[draggedItem.index];
          newColumns.splice(draggedItem.index, 1);
          newColumns.splice(index, 0, draggedColumn);
          draggedItem.index = index;
          return newColumns;
        });
      }
    });

    return (
      <TableHead ref={(node) => drag(drop(node))} className="cursor-move">
        {children}
      </TableHead>
    );
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">点検項目マスタ管理</h1>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleImportCSV}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                インポート
              </Button>
              <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                エクスポート
              </Button>
              <Button onClick={handleSaveChanges} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                保存
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">フィルター</h2>
                <div className="grid grid-cols-3 gap-4">
                  {columns.slice(0, 5).map(column => (  // 最初の5カラムだけフィルター表示
                    <div key={column.id}>
                      <Select
                        value={filters[column.id] || "all"}
                        onValueChange={(value) => handleFilterChange(column.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`すべての${column.title}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{`すべての${column.title}`}</SelectItem>
                          {getUniqueValuesForColumn(column.id).map(value => (
                            <SelectItem key={value} value={value}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Input
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="新しいカラム名"
                    className="w-48 mr-2"
                  />
                  <Button onClick={handleAddColumn} size="sm" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    カラム追加
                  </Button>
                </div>
                <Button onClick={handleAddRow} size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  レコード追加
                </Button>
              </div>

              <DndProvider backend={HTML5Backend}>
                <div className="border rounded-md overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-secondary">
                      <TableRow>
                        <TableHead className="w-[100px]">操作</TableHead>
                        {columns.map((column, index) => (
                          column.visible && (
                            <DraggableHeader key={column.id} index={index} column={column}>
                              <div className="flex items-center gap-1">
                                {column.title}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleShowDeleteColumn(column.id)}
                                  className="p-1 h-6 w-6"
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </DraggableHeader>
                          )
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={columns.length + 1} className="text-center py-10">
                            データを読み込み中...
                          </TableCell>
                        </TableRow>
                      ) : filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={columns.length + 1} className="text-center py-10">
                            表示するデータがありません
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item, rowIndex) => (
                          editingItem && Object.keys(item).every(key => 
                            key === editingColumnId ? true : item[key] === editingItem[key]
                          ) ? (
                            <TableRow key={`editing-${rowIndex}`}>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveItem}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Save className="h-3 w-3 text-green-500" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    className="p-1 h-6 w-6"
                                  >
                                    <X className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                              {columns.map(column => (
                                column.visible && (
                                  <TableCell key={column.id}>
                                    <Input
                                      value={editingItem[column.id] || ""}
                                      onChange={e => setEditingItem({
                                        ...editingItem,
                                        [column.id]: e.target.value
                                      })}
                                    />
                                  </TableCell>
                                )
                              ))}
                            </TableRow>
                          ) : (
                            <DraggableRow key={rowIndex} index={rowIndex} item={item}>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditItem(item)}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Edit className="h-3 w-3 text-blue-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleShowDeleteItem(rowIndex)}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                              {columns.map(column => (
                                column.visible && (
                                  <TableCell key={column.id}>
                                    {item[column.id] || ""}
                                  </TableCell>
                                )
                              ))}
                            </DraggableRow>
                          )
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DndProvider>
            </CardContent>
          </Card>

          {/* 削除確認ダイアログ */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>削除の確認</AlertDialogTitle>
                <AlertDialogDescription>
                  {itemToDelete !== null 
                    ? "このレコードを削除しますか？この操作は元に戻せません。"
                    : columnToDelete
                      ? `「${columnToDelete}」カラムを削除しますか？この操作は元に戻せません。`
                      : "アイテムを削除しますか？この操作は元に戻せません。"
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setItemToDelete(null);
                  setColumnToDelete(null);
                }}>
                  キャンセル
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  if (itemToDelete !== null) {
                    handleDeleteItem();
                  } else if (columnToDelete) {
                    handleDeleteColumn();
                  }
                }}>
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
}
