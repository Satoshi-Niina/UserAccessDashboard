import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Edit, Trash, Plus } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui';
import Papa from 'papaparse'; // Import PapaParse


interface InspectionItem {
  id: number;
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
  measurementRecord?: string;
  diagramRecord?: string;
  manufacturer?: string;
  model?: string;
  engineType?: string;
  comment?: string;
  [key: string]: any; //Keep dynamic fields
}

const ExitButton = ({ hasChanges, onSave, redirectTo }: { hasChanges: boolean; onSave: () => Promise<void>; redirectTo: string }) => {
  const handleClick = async () => {
    if (hasChanges) {
      if (window.confirm("変更を保存しますか？")) {
        await onSave();
      }
    }
    window.location.href = redirectTo;
  };

  return (
    <Button variant="default" onClick={handleClick}>
      <Save className="h-4 w-4" />
      保存して終了
    </Button>
  );
};

export default function InspectionItems() {
  const { toast } = useToast();
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);

  // レコード数を表示する
  useEffect(() => {
    if (inspectionItems.length > 0) {
      toast({
        title: "データ読み込み完了",
        description: `${inspectionItems.length}件のデータを読み込みました`,
      });
    }
  }, [inspectionItems]);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = inspectionItems.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.manufacturer?.toLowerCase().includes(searchLower) ||
      item.model?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.equipment?.toLowerCase().includes(searchLower) ||
      item.item?.toLowerCase().includes(searchLower)
    );
  });
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [_, navigate] = useLocation();
  const [hasChanges, setHasChanges] = useState(false);
  const [initialItems, setInitialItems] = useState<InspectionItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'back' | 'save' | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletedRecords, setDeletedRecords] = useState<number[]>([]);
  const [csvData, setCsvData] = useState<InspectionItem[]>([]);
  const [availableFiles, setAvailableFiles] = useState<{name: string, modified: string}[]>([]);
  const [latestFile, setLatestFile] = useState<{name: string, modified: string} | null>(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(""); // Add state for selected file

  useEffect(() => {
    fetchInspectionFiles();
  }, []);

  // データの取得
  useEffect(() => {
    fetchInspectionItems();
    fetchInspectionFiles();
  }, []);

  const fetchInspectionItems = async () => {
    try {
      let url = '/api/inspection-items';
      if (selectedFile) {
        url = `/api/inspection-items?file=${selectedFile}`; // Adjust API endpoint as needed
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch inspection items: ${response.status} ${response.statusText}`);
      const data = await response.json();
      setInspectionItems(data);
      setInitialItems(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching inspection items:', error);
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      });
    }
  };

  // 編集ダイアログを開く
  const openEditDialog = (item: InspectionItem) => {
    setEditingItem({ ...item });
    setIsDialogOpen(true);
  };

  // 編集内容を保存
  const handleSave = async () => {
    if (!editingItem) return;

    try {
      const updatedItems = inspectionItems.map(item =>
        item.id === editingItem.id ? editingItem : item
      );

      const response = await fetch('/api/inspection-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems)
      });

      if (!response.ok) throw new Error('Failed to save changes');

      setInspectionItems(updatedItems);
      setHasChanges(true);
      setIsDialogOpen(false);

      toast({
        title: "保存完了",
        description: "変更内容を保存しました"
      });
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive"
      });
    }
  };

  // 項目の削除
  const handleDelete = async (itemId: number) => {
    if (!confirm('この項目を削除してもよろしいですか？')) {
      return;
    }

    try {
      const updatedItems = inspectionItems.filter(item => item.id !== itemId);
      setDeletedRecords(prev => [...prev, itemId]);
      const response = await fetch('/api/inspection-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItems),
      });

      if (!response.ok) throw new Error('Failed to delete item');

      setInspectionItems(updatedItems);
      setHasChanges(true);
      toast({
        title: "成功",
        description: "項目が削除されました",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "エラー",
        description: "削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  // ファイルに保存
  const handleSaveToFile = async () => {
    if (!saveFileName) {
      toast({
        title: "エラー",
        description: "ファイル名を入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/save-inspection-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: inspectionItems,
          fileName: saveFileName,
        }),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      setIsSaveDialogOpen(false);
      toast({
        title: "成功",
        description: "ファイルが保存されました",
      });
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      });
    }
  };
    // 画面を離れる前の確認
  const handleNavigateAway = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
      setPendingAction('back');
    } else {
      navigate('/');
    }
  };

  // 変更を保存して戻る
  const handleSaveAndNavigate = async () => {
    try {
      setIsSaveDialogOpen(true);
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const defaultFileName = `点検項目マスタ_${dateStr}.csv`;
      setSaveFileName(defaultFileName);
    } catch (error) {
      console.error('保存ダイアログエラー:', error);
      toast({
        title: "エラー",
        description: "保存ダイアログの表示に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleSaveConfirm = async () => {
      await handleSaveToFile();
      setPendingAction(null);
      setShowConfirmDialog(false);
      navigate('/');

  };


  // 確認ダイアログの処理
  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);
    if (pendingAction === 'back') {
      navigate('/');
    }
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // CSVファイル情報を取得
  const fetchInspectionFiles = async () => {
    try {
      const response = await fetch('/api/inspection-files');
      if (!response.ok) {
        throw new Error('ファイル一覧の取得に失敗しました');
      }
      const data = await response.json();
      console.log('取得したファイル一覧:', data);
      if (data.files && Array.isArray(data.files)) {
        const fileList = data.files.map(file => ({
          name: file.name,
          modified: new Date(file.modified).toLocaleString()
        }));
        setAvailableFiles(fileList);
        if (fileList.length > 0) {
          setLatestFile(fileList[0]);
          setSelectedFile(fileList[0].name);
          fetchInspectionItems();
        }
      }
    } catch (error) {
      console.error("ファイル一覧取得エラー:", error);
      toast({
        title: "エラー",
        description: "ファイル一覧の取得に失敗しました",
        variant: "destructive",
      });
    }
  };
  const handleSaveAndExit = async () => {
    if (hasChanges) {
        setIsSaveDialogOpen(true);
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const baseName = latestFile?.name.replace(/\.csv$/i, '') || '点検項目マスタ'; // 最新ファイル名を使用
        setSaveFileName(`${baseName}_${dateStr}.csv`);
    } else {
      navigate('/settings');
    }
  };

  const handleSaveDialog = () => {
    setIsSaveDialogOpen(true);
    setSaveFileName(`inspection_items_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Added function to parse CSV data asynchronously
  const parseCSVData = async (csvText: string) => {
    return new Promise<{ data: any[]; meta: any; errors: any[] }>((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results),
        error: (error) => reject(error)
      });
    });
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      //This part remains largely the same, but simplified for brevity.  Error handling and JSON parsing are maintained.
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          try {
            const jsonData = JSON.parse(text);
            setInspectionItems(Array.isArray(jsonData) ? jsonData : []);
            setInitialItems(Array.isArray(jsonData) ? jsonData : []);
          } catch (jsonError) {
            const results = await parseCSVData(text);
            const items = results.data.map((row: any, index: number) => ({
              ...row,
              id: row.id || index + 1, //Assign ID if not present
            }));
            setCsvData(items);
            toast({
              title: "CSV読み込み完了",
              description: `${items.length}件のデータを読み込みました`,
            });
          }
        } catch (error) {
          console.error("CSVの解析エラー:", error);
          toast({
            title: "エラー",
            description: "CSVファイルの解析に失敗しました",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const importCSVData = () => {
    if (csvData.length === 0) {
      toast({
        title: "エラー",
        description: "インポートするデータがありません",
        variant: "destructive",
      });
      return;
    }

    // 既存データとマージ (Simplified - assumes no ID conflicts)
    setInspectionItems([...inspectionItems, ...csvData]);
    setCsvData([]);
    toast({
      title: "インポート完了",
      description: `${csvData.length}件のデータをインポートしました`,
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">点検項目編集</CardTitle>
            <div className="flex gap-2">
              <select
                className="border rounded p-2"
                value={selectedFile}
                onChange={(e) => {
                  setSelectedFile(e.target.value);
                  fetchInspectionItems();
                }}
              >
                <option value="">ファイルを選択してください</option>
                {availableFiles.length > 0 ? (
                  availableFiles.map((file) => (
                    <option key={file.name} value={file.name}>
                      {file.name} ({new Date(file.modified).toLocaleString('ja-JP')})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>利用可能なファイルがありません</option>
                )}
              </select>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                キャンセル
              </Button>
              <ExitButton
                hasChanges={hasChanges}
                onSave={handleSaveAndExit}
                redirectTo="/settings"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border p-4 rounded-md space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              {latestFile && <p>最新のファイル: {latestFile.name} ({latestFile.modified})</p>}
              <div className="flex-1 min-w-[300px]">
                <label htmlFor="csv-file" className="mb-2 block">CSVファイルインポート</label>
                <div className="flex gap-2">
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                  />
                  <Button
                    onClick={importCSVData}
                  >
                    インポート
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border p-4 rounded-md space-y-4">
            <div className="overflow-x-auto">
              <Table className="min-w-[1500px] border-collapse"> {/*Reduced width for better responsiveness*/}
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="w-[120px] py-2 border border-gray-200">製造メーカー</TableHead>
                    <TableHead className="w-[120px] py-2 border border-gray-200">機種</TableHead>
                    <TableHead className="w-[120px] py-2 border border-gray-200">部位</TableHead>
                    <TableHead className="w-[20ch] py-2 border border-gray-200">装置</TableHead>
                    <TableHead className="w-[200px] py-2 border border-gray-200">点検項目</TableHead>
                    <TableHead className="w-[450px] py-2 border border-gray-200">点検方法</TableHead>
                    <TableHead className="w-[300px] py-2 border border-gray-200">判定基準</TableHead>
                    <TableHead className="w-[150px] py-2 border border-gray-200">測定等記録</TableHead>
                    <TableHead className="w-[150px] py-2 border border-gray-200">図形記録</TableHead>
                    <TableHead className="w-[80px] sticky right-0 bg-background py-2 border border-gray-200">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectionItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-gray-200">
                      <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">{item.manufacturer || ''}</TableCell>
                      <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">{item.model || ''}</TableCell>
                      <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">{item.category}</TableCell>
                      <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">{item.equipment}</TableCell>
                      <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">{item.item}</TableCell>
                      <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">{item.method}</TableCell>
                      <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">{item.criteria}</TableCell>
                      <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">{item.measurementRecord || ''}</TableCell>
                      <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">{item.diagramRecord || ''}</TableCell>
                      <TableCell className="sticky right-0 bg-background py-2 border border-gray-200">
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ファイルに保存</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ファイル名
              </label>
              <Input
                value={saveFileName}
                onChange={(e) => setSaveFileName(e.target.value)}
                placeholder="例: inspection_items.csv"
              />
            </div>
            <Button onClick={handleSaveToFile}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>点検項目の編集</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  カテゴリ
                </label>
                <Input
                  value={editingItem.category}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, category: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  装置
                </label>
                <Input
                  value={editingItem.equipment}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, equipment: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  項目
                </label>
                <Input
                  value={editingItem.item}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, item: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  判断基準
                </label>
                <Input
                  value={editingItem.criteria}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, criteria: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleSave}>保存</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
        {/* 変更確認ダイアログ */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>変更が保存されていません</AlertDialogTitle>
              <AlertDialogDescription>
                変更内容を保存せずに移動しますか？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelAction}>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAction}>
                保存せずに移動
              </AlertDialogAction>
              <Button onClick={handleSaveAndNavigate}>
                保存する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </DndProvider>
  );
}