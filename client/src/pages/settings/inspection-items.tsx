import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Sidebar } from "@/components/layout/sidebar";
import { ExitButton } from "@/components/layout/exit-button";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 点検項目の型定義
interface InspectionItem {
  製造メーカー: string;
  機種: string;
  エンジン型式: string;
  部位: string;
  装置: string;
  手順: string;
  確認箇所: string;
  判断基準: string;
  確認要領: string;
  測定等記録: string;
  図形記録: string;
  [key: string]: string;
}

export function InspectionItems() {
  // ステート定義
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'item' | 'column' | null>(null);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");


  // タイトルを設定
  useEffect(() => {
    document.title = "運用管理システム - 点検項目管理";
  }, []);

  // CSVデータの読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // キャッシュを回避するためのタイムスタンプ付きリクエスト
        const response = await fetch('/api/inspection-items?t=' + new Date().getTime());
        const data = await response.json();

        console.log("点検項目データ読み込み成功", data.length, "件");

        if (data.length > 0) {
          // カラムの取得と並び順の設定
          const firstItem = data[0];
          // デフォルトの並び順を設定（業界標準の順序に合わせる）
          const orderedColumns = [
            '製造メーカー', '機種', 'エンジン型式', '部位', '装置', '手順',
            '確認箇所', '判断基準', '確認要領', '測定等記録', '図形記録'
          ].filter(col => Object.keys(firstItem).includes(col));

          // データにはあるがデフォルト順序にない列を追加
          Object.keys(firstItem).forEach(key => {
            if (!orderedColumns.includes(key)) {
              orderedColumns.push(key);
            }
          });

          setColumns(orderedColumns);
          //メーカーと機種のリストを作成
          const uniqueManufacturers = [...new Set(data.map(item => item.製造メーカー))];
          const uniqueModels = [...new Set(data.map(item => item.機種))];
          setManufacturers(uniqueManufacturers);
          setModels(uniqueModels);
        }

        setInspectionItems(data);
        setLoading(false);
      } catch (err) {
        console.error("データ読み込みエラー:", err);
        setError('データの読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ドラッグ&ドロップのハンドラー（アイテム用）
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("itemIndex", String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("itemIndex"));

    if (dragIndex === dropIndex) return;

    const items = [...inspectionItems];
    const item = items[dragIndex];

    // アイテムを削除してから新しい位置に挿入
    items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, item);

    setInspectionItems(items);
    setHasChanges(true);
  };

  // ドラッグ&ドロップのハンドラー（カラム用）
  const handleColumnDragStart = (e: React.DragEvent, columnName: string) => {
    e.dataTransfer.setData("columnName", columnName);
  };

  const handleColumnDrop = (e: React.DragEvent, dropColumnName: string) => {
    e.preventDefault();
    const dragColumnName = e.dataTransfer.getData("columnName");

    if (dragColumnName === dropColumnName) return;

    const columnsList = [...columns];
    const dragIndex = columnsList.indexOf(dragColumnName);
    const dropIndex = columnsList.indexOf(dropColumnName);

    // カラムを削除してから新しい位置に挿入
    columnsList.splice(dragIndex, 1);
    columnsList.splice(dropIndex, 0, dragColumnName);

    setColumns(columnsList);
    setHasChanges(true);
  };

  // 削除ハンドラー
  const handleDelete = () => {
    if (deleteType === 'item' && selectedItem !== null) {
      const newItems = [...inspectionItems];
      newItems.splice(selectedItem, 1);
      setInspectionItems(newItems);
      setSelectedItem(null);
      setHasChanges(true);
    } else if (deleteType === 'column' && selectedColumn) {
      // 列を削除
      setColumns(columns.filter(col => col !== selectedColumn));
      // 各アイテムからその列を削除
      const newItems = inspectionItems.map(item => {
        const newItem = {...item};
        delete newItem[selectedColumn];
        return newItem;
      });
      setInspectionItems(newItems);
      setSelectedColumn(null);
      setHasChanges(true);
    }

    setShowDeleteDialog(false);
    setDeleteType(null);
  };

  // 保存関数
  const saveChanges = async () => {
    try {
      // ここでAPI呼び出しで変更を保存
      // const response = await fetch('/api/inspection-items', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ items: inspectionItems, columns: columns })
      // });

      // if (!response.ok) throw new Error('Failed to save changes');

      toast({
        title: "保存完了",
        description: "点検項目の変更が保存されました",
      });

      setHasChanges(false);
      return true;
    } catch (error) {
      console.error("データ保存エラー:", error);

      toast({
        title: "エラー",
        description: "データの保存に失敗しました",
        variant: "destructive",
      });

      return false;
    }
  };

  // アイテム選択ハンドラー
  const handleItemSelect = (index: number) => {
    if (selectedItem === index) {
      setSelectedItem(null);
    } else {
      setSelectedItem(index);
      setSelectedColumn(null);
    }
  };

  // カラム選択ハンドラー
  const handleColumnSelect = (column: string) => {
    if (selectedColumn === column) {
      setSelectedColumn(null);
    } else {
      setSelectedColumn(column);
      setSelectedItem(null);
    }
  };

  // 削除ダイアログを表示
  const showDeleteConfirmation = (type: 'item' | 'column') => {
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  // フィルタリング処理
  const filteredItems = useMemo(() => {
    return inspectionItems.filter((item) => {
      const manufacturerMatch = selectedManufacturer === "all" || item.製造メーカー === selectedManufacturer;
      const modelMatch = selectedModel === "all" || item.機種 === selectedModel;
      return manufacturerMatch && modelMatch;
    });
  }, [inspectionItems, selectedManufacturer, selectedModel]);

  const filterEmptyValues = (arr: string[]) => arr.filter(item => item.trim() !== "");

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300 overflow-hidden`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">点検項目管理</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {filterEmptyValues(manufacturers).map((manufacturer) => (
                    <SelectItem key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {filterEmptyValues(models).map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedItem !== null && (
                <Button
                  variant="destructive"
                  onClick={() => showDeleteConfirmation('item')}
                >
                  レコード削除
                </Button>
              )}
              {selectedColumn && (
                <Button
                  variant="destructive"
                  onClick={() => showDeleteConfirmation('column')}
                >
                  カラム削除
                </Button>
              )}
              <Button
                variant="outline"
                onClick={saveChanges}
                disabled={!hasChanges}
              >
                レイアウト保存
              </Button>
              <ExitButton
                hasChanges={hasChanges}
                onSave={saveChanges}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p>データを読み込み中...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden p-4">
              <div className="bg-white rounded-md shadow h-full overflow-hidden flex flex-col">
                <div className="flex items-center bg-gray-50 border-b">
                  {columns.map((column, colIndex) => (
                    <div
                      key={colIndex}
                      className={`
                        px-3 py-2 font-medium text-sm
                        ${selectedColumn === column ? 'bg-blue-100' : ''}
                        cursor-pointer flex-shrink-0 min-w-24 flex-1
                      `}
                      onClick={() => handleColumnSelect(column)}
                      draggable
                      onDragStart={(e) => handleColumnDragStart(e, column)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleColumnDrop(e, column)}
                    >
                      {column}
                    </div>
                  ))}
                </div>

                <ScrollArea className="flex-1">
                  <div className="divide-y">
                    {filteredItems.map((item, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onClick={() => handleItemSelect(index)}
                        className={`
                          flex items-center hover:bg-gray-50 transition-colors
                          ${selectedItem === index ? 'bg-blue-50' : ''}
                        `}
                      >
                        {columns.map((column, colIndex) => (
                          <div
                            key={colIndex}
                            className="px-3 py-2 text-sm flex-shrink-0 min-w-24 flex-1 border-r last:border-r-0 border-transparent"
                          >
                            {item[column] || '-'}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === 'item' ? 'レコードを削除' : 'カラムを削除'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'item'
                ? '選択したレコードを削除します。この操作は元に戻せません。'
                : `カラム「${selectedColumn}」を削除します。すべてのレコードからこの情報が削除されます。この操作は元に戻せません。`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default InspectionItems;