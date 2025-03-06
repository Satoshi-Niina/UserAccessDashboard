import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Papa from 'papaparse';

interface InspectionItem {
  [key: string]: string;
}

export default function InspectionItems() {
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("all");
  const [availableFiles, setAvailableFiles] = useState<{name: string, modified: string}[]>([]);
  const [currentFileName, setCurrentFileName] = useState("仕業点検マスタ.csv");
  const { toast } = useToast();

  // タイトルを設定
  useEffect(() => {
    document.title = "運用管理システム - 点検項目管理";
  }, []);

  // 利用可能なCSVファイル一覧を取得
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        const response = await fetch('/api/inspection-files');
        const data = await response.json();

        if (data.files && Array.isArray(data.files)) {
          setAvailableFiles(data.files.map(file => ({
            name: file.name,
            modified: new Date(file.modified).toLocaleString()
          })));

          // 仕業点検マスタ.csvがない場合は、利用可能な最初のファイルを選択
          if (data.files.length > 0 && !data.files.some(f => f.name === "仕業点検マスタ.csv")) {
            setCurrentFileName(data.files[0].name);
          }
        }
      } catch (err) {
        console.error("ファイル一覧取得エラー:", err);
      }
    };

    fetchAvailableFiles();
  }, []);

  // CSVデータの読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // キャッシュを回避するためのタイムスタンプ付きリクエスト
        const response = await fetch(`/api/inspection-items?file=${currentFileName}&t=${new Date().getTime()}`);

        if (!response.ok) {
          throw new Error(`サーバーエラー: ${response.status}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim() === '') {
          throw new Error('データが空です');
        }

        console.log("CSVデータの最初の行:", csvText.split('\n')[0]);

        // CSVデータのパース
        const { data, errors } = Papa.parse<InspectionItem>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim()
        });

        if (errors.length > 0) {
          console.error("CSVパースエラー:", errors);
          throw new Error(`CSVパースエラー: ${errors[0].message}`);
        }

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

          // メーカーと機種のリストを作成（空文字を除外）
          const uniqueManufacturers = [...new Set(data.map(item => item['製造メーカー'] || ''))]
            .filter(Boolean)
            .sort();

          const uniqueModels = [...new Set(data.map(item => item['機種'] || ''))]
            .filter(Boolean)
            .sort();

          setManufacturers(uniqueManufacturers);
          setModels(uniqueModels);

          toast({
            title: "データ読み込み完了",
            description: `${data.length}件の点検項目を読み込みました`,
            duration: 3000,
          });
        }

        setInspectionItems(data);
        setLoading(false);
      } catch (err) {
        console.error("データ読み込みエラー:", err);
        setError(`データの読み込みに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
        setLoading(false);

        toast({
          variant: "destructive",
          title: "エラー",
          description: `データの読み込みに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`,
          duration: 5000,
        });
      }
    };

    fetchData();
  }, [currentFileName, toast]);

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

  const handleColumnDrop = (e: React.DragEvent, targetColumnName: string) => {
    e.preventDefault();
    const sourceColumnName = e.dataTransfer.getData("columnName");

    if (sourceColumnName === targetColumnName) return;

    const columnsCopy = [...columns];
    const sourceIndex = columnsCopy.indexOf(sourceColumnName);
    const targetIndex = columnsCopy.indexOf(targetColumnName);

    if (sourceIndex === -1 || targetIndex === -1) return;

    // 列の順序を入れ替え
    columnsCopy.splice(sourceIndex, 1);
    columnsCopy.splice(targetIndex, 0, sourceColumnName);

    setColumns(columnsCopy);
  };

  // アイテムの編集ハンドラー
  const handleItemChange = (index: number, columnName: string, value: string) => {
    const updatedItems = [...inspectionItems];
    updatedItems[index] = { ...updatedItems[index], [columnName]: value };
    setInspectionItems(updatedItems);
    setHasChanges(true);
  };

  // 新しいアイテムの追加
  const handleAddItem = () => {
    // 空のアイテムを作成
    const newItem: InspectionItem = {};
    columns.forEach(col => {
      newItem[col] = '';
    });

    // メーカーと機種が選択されている場合はデフォルト値を設定
    if (selectedManufacturer && selectedManufacturer !== "all") {
      newItem['製造メーカー'] = selectedManufacturer;
    }

    setInspectionItems([...inspectionItems, newItem]);
    setHasChanges(true);
  };

  // アイテムの削除
  const handleDeleteItem = (index: number) => {
    const updatedItems = [...inspectionItems];
    updatedItems.splice(index, 1);
    setInspectionItems(updatedItems);
    setHasChanges(true);
  };

  // フィルター適用済みのアイテム
  const filteredItems = inspectionItems.filter(item => {
    if (selectedManufacturer === "all") return true;
    return item['製造メーカー'] === selectedManufacturer;
  });

  // データの保存
  const handleSaveData = async () => {
    try {
      setLoading(true);

      // 保存するファイル名（現在のファイル名または新しいファイル名）
      const saveFileName = `仕業点検_編集済_${new Date().toISOString().slice(0, 10)}.csv`;

      // サーバーにデータを保存
      const response = await fetch('/api/save-inspection-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: inspectionItems,
          fileName: saveFileName
        }),
      });

      if (!response.ok) {
        throw new Error('データの保存に失敗しました');
      }

      const result = await response.json();

      // 保存したファイルを現在のファイルとして設定
      setCurrentFileName(result.fileName);

      // 利用可能なファイル一覧を更新
      const filesResponse = await fetch('/api/inspection-files');
      const filesData = await filesResponse.json();

      if (filesData.files && Array.isArray(filesData.files)) {
        setAvailableFiles(filesData.files.map(file => ({
          name: file.name,
          modified: new Date(file.modified).toLocaleString()
        })));
      }

      setHasChanges(false);

      toast({
        title: "保存完了",
        description: `${inspectionItems.length}件のデータを ${result.fileName} に保存しました`,
        duration: 3000,
      });

      setLoading(false);
    } catch (err) {
      console.error("データ保存エラー:", err);

      toast({
        variant: "destructive",
        title: "保存エラー",
        description: err instanceof Error ? err.message : "データの保存中にエラーが発生しました",
        duration: 5000,
      });

      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>点検項目管理</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="edit">
            <TabsList className="mb-4">
              <TabsTrigger value="edit">編集</TabsTrigger>
              <TabsTrigger value="upload">アップロード</TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              <div className="mb-4 space-y-4">
                <div className="flex gap-4 mb-4">
                  <div className="w-1/3">
                    <Label htmlFor="file-select">ファイル選択</Label>
                    <select 
                      id="file-select"
                      className="w-full p-2 border rounded"
                      value={currentFileName}
                      onChange={(e) => setCurrentFileName(e.target.value)}
                    >
                      {availableFiles.map(file => (
                        <option key={file.name} value={file.name}>
                          {file.name} ({file.modified})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-1/3">
                    <Label htmlFor="manufacturer-filter">メーカーで絞り込み</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="メーカーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて表示</SelectItem>
                        {manufacturers
                          .filter(manufacturer => manufacturer && manufacturer.trim() !== "")
                          .map((manufacturer) => (
                            <SelectItem key={manufacturer} value={manufacturer}>
                              {manufacturer}
                            </SelectItem>
                          ))}
                        {manufacturers.some(manufacturer => !manufacturer || manufacturer.trim() === "") && (
                          <SelectItem key="未設定" value="未設定">
                            未設定
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end space-x-2">
                    <Button
                      onClick={handleAddItem}
                      disabled={loading}
                    >
                      新規追加
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSaveData}
                      disabled={loading || !hasChanges}
                    >
                      変更を保存
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 bg-gray-100 text-left text-xs text-gray-600 uppercase">操作</th>
                          {columns.map(column => (
                            <th
                              key={column}
                              className="px-4 py-2 bg-gray-100 text-left text-xs text-gray-600 uppercase cursor-move"
                              draggable
                              onDragStart={(e) => handleColumnDragStart(e, column)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleColumnDrop(e, column)}
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50"
                            draggable
                            onDragStart={(e) => handleDragStart(e, inspectionItems.indexOf(item))}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, inspectionItems.indexOf(item))}
                          >
                            <td className="border px-4 py-2">
                              <button
                                onClick={() => handleDeleteItem(inspectionItems.indexOf(item))}
                                className="text-red-500 hover:text-red-700"
                              >
                                削除
                              </button>
                            </td>
                            {columns.map(column => (
                              <td key={`${index}-${column}`} className="border px-4 py-2">
                                <input
                                  type="text"
                                  value={item[column] || ''}
                                  onChange={(e) => handleItemChange(inspectionItems.indexOf(item), column, e.target.value)}
                                  className="w-full p-1 border rounded"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
                  <p className="font-bold">CSVファイルのアップロード</p>
                  <p>点検項目データのCSVファイルをアップロードできます。</p>
                  <p>ヘッダー行に以下の列が必要です: 製造メーカー,機種,エンジン型式,部位,装置,手順,確認箇所,判断基準,確認要領,測定等記録,図形記録</p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;

                    if (!fileInput.files || fileInput.files.length === 0) {
                      toast({
                        variant: "destructive",
                        title: "エラー",
                        description: "ファイルが選択されていません",
                        duration: 3000,
                      });
                      return;
                    }

                    const file = fileInput.files[0];
                    if (!file.name.endsWith('.csv')) {
                      toast({
                        variant: "destructive",
                        title: "エラー",
                        description: "CSVファイルを選択してください",
                        duration: 3000,
                      });
                      return;
                    }

                    try {
                      setLoading(true);
                      const fileName = formData.get('fileName') as string || file.name;

                      formData.append('file', file);

                      const response = await fetch(`/api/upload-inspection-items?fileName=${encodeURIComponent(fileName)}`, {
                        method: 'POST',
                        body: formData,
                      });

                      if (!response.ok) {
                        throw new Error('アップロードに失敗しました');
                      }

                      const result = await response.json();

                      toast({
                        title: "アップロード完了",
                        description: `${result.fileName} を保存しました (${result.size} バイト)`,
                        duration: 3000,
                      });

                      // 現在のファイル名をアップロードしたファイルに設定
                      setCurrentFileName(result.fileName);

                      // 利用可能なファイル一覧を更新
                      const filesResponse = await fetch('/api/inspection-files');
                      const filesData = await filesResponse.json();

                      if (filesData.files && Array.isArray(filesData.files)) {
                        setAvailableFiles(filesData.files.map(file => ({
                          name: file.name,
                          modified: new Date(file.modified).toLocaleString()
                        })));
                      }

                      // フォームをリセット
                      e.currentTarget.reset();

                      setLoading(false);
                    } catch (err) {
                      console.error("アップロードエラー:", err);

                      toast({
                        variant: "destructive",
                        title: "アップロードエラー",
                        description: err instanceof Error ? err.message : "ファイルのアップロード中にエラーが発生しました",
                        duration: 5000,
                      });

                      setLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="file">CSVファイル</Label>
                    <Input id="file" name="file" type="file" accept=".csv" required />
                  </div>

                  <div>
                    <Label htmlFor="fileName">保存ファイル名（オプション）</Label>
                    <Input 
                      id="fileName" 
                      name="fileName" 
                      type="text" 
                      placeholder="例: 仕業点検マスタ.csv" 
                    />
                    <p className="text-sm text-gray-500 mt-1">指定しない場合はアップロードファイル名が使用されます</p>
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "アップロード中..." : "アップロード"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

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
                  {filterEmptyValues(manufacturers)
                    .filter(manufacturer => manufacturer && manufacturer.trim() !== '')
                    .map((manufacturer) => (
                      <SelectItem key={manufacturer} value={manufacturer || "unknown"}>
                        {manufacturer || "未設定"}
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
                  {filterEmptyValues(models)
                    .filter(model => model && model.trim() !== '')
                    .map((model) => (
                      <SelectItem key={model} value={model || "unknown"}>
                        {model || "未設定"}
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