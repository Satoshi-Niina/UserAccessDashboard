import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Papa from 'papaparse'; // Import PapaParse
import { Link, useLocation } from 'wouter';
import { Edit, Trash, Plus } from 'lucide-react';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui';


type TableType = 'manufacturers' | 'models' | 'machineNumbers';

interface TableItem {
  id?: number;
  name: string;
  code?: string;
  number?: string; // Added number property
  manufacturerId?: number;
  modelId?: number;
  modelName?: string; //Added modelName
  externalId?: string; // Added externalId property
  model_id?: string; //added model_id
}

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

const ExitButton = ({ hasChanges, onSave }: { hasChanges: boolean; onSave: () => Promise<void> }) => {
  return (
    <Button variant="default" onClick={onSave}>
      <Save className="h-4 w-4" />
      保存して終了
    </Button>
  );
};

export default function InspectionItems() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"tables" | "items">("items"); // Initialize to "items"
  const [selectedTable, setSelectedTable] = useState<TableType>('manufacturers');
  const [tableItems, setTableItems] = useState<TableItem[]>([]);
  const [newItem, setNewItem] = useState<TableItem>({ name: '', code: '', number: '' }); //Added number to newItem
  const [manufacturers, setManufacturers] = useState<TableItem[]>([]);
  const [models, setModels] = useState<TableItem[]>([]);
  const [machineNumbers, setMachineNumbers] = useState<TableItem[]>([]); // Added state for machine numbers
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null); // Added selectedModelId
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<number | null>(null); // Added selectedManufacturerId
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [_, navigate] = useLocation();
  const [hasChanges, setHasChanges] = useState(false);
  const [initialItems, setInitialItems] = useState<InspectionItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'back' | 'save' | null>(null);
  const [saveFileName, setSaveFileName] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<{name: string, modified: string}[]>([]);
  const [latestFile, setLatestFile] = useState<{name: string, modified: string} | null>(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [csvData, setCsvData] = useState<InspectionItem[]>([]);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    itemId: number | null;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
  }>({ isOpen: false, itemId: null, onConfirm: null, onCancel: null });
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state


  useEffect(() => {
    const initializeData = async () => {
      try {
        const response = await fetch('/api/inspection-files');
        if (!response.ok) {
          throw new Error('ファイル一覧の取得に失敗しました');
        }
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setSelectedFile(data[0].name);
          setAvailableFiles(data);
          fetchInspectionItems(data[0].name);
        }
      } catch (error) {
        console.error("初期データ取得エラー:", error);
        toast({
          title: "エラー",
          description: "データの取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    initializeData();
  }, []);

  const fetchInspectionItems = async (filename?: string) => {
    try {
      const fileToUse = filename || selectedFile;
      let url = '/api/inspection-items';
      if (fileToUse) {
        url = `/api/inspection-items?file=${fileToUse}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch inspection items: ${response.status} ${response.statusText}`);
      const data = await response.json();
      setInspectionItems(data);
      setInitialItems(data);
      setHasChanges(false);
      setFilteredItems(data); // Initialize filteredItems
      setLoading(false); // Set loading to false after data is fetched
    } catch (error) {
      console.error('Error fetching inspection items:', error);
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      });
      setLoading(false); // Set loading to false even if there's an error
    }
  };

  useEffect(() => {
    fetchTableData();
    fetchManufacturers();
    fetchModels();
    fetchMachineNumbers(); // Fetch machine numbers
  }, [selectedTable]);

  const fetchTableData = async () => {
    try {
      const response = await fetch(`/api/${selectedTable}`);
      const data = await response.json();
      setTableItems(data);
    } catch (error) {
      console.error('Error fetching table data:', error);
    }
  };

  const fetchManufacturers = async () => {
    try {
      const response = await fetch('/api/manufacturers');
      const data = await response.json();
      setManufacturers(data);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchMachineNumbers = async () => {
    try {
      const response = await fetch('/api/machineNumbers');
      const data = await response.json();
      setMachineNumbers(data);
    } catch (error) {
      console.error('Error fetching machine numbers:', error);
    }
  };

  const handleAddItem = async () => {
    try {
      let postData = { ...newItem };

      if (selectedTable === 'models') {
        const selectedManufacturer = manufacturers.find(m => m.name === newItem.name);
        if (selectedManufacturer) {
          postData = {
            ...postData,
            manufacturerId: selectedManufacturer.id
          };
        }
      } else if (selectedTable === 'machineNumbers') {
        const selectedModel = models.find(m => m.name === newItem.modelName);
        if (selectedModel) {
          postData = {
            ...postData,
            modelId: selectedModel.id
          };
        }
      }

      const response = await fetch(`/api/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        fetchTableData();
        setNewItem({ name: '', code: '', number: '', modelName: '' }); // Reset newItem
        toast({
          title: "追加完了",
          description: "項目を追加しました",
        });
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const response = await fetch(`/api/${selectedTable}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTableData();
        toast({
          title: "削除完了",
          description: "項目を削除しました",
        });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSearch = () => {
    const filtered = inspectionItems.filter((item: any) => {
      return (!selectedManufacturer || item.manufacturer === selectedManufacturer) &&
             (!selectedModel || item.model === selectedModel);
    });
    setFilteredItems(filtered);
  };

  const openEditDialog = (item: InspectionItem) => {
    setEditingItem({ ...item });
    setIsDialogOpen(true);
  };

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

  const handleDeleteConfirm = async (id: number) => {
    const result = await new Promise<boolean>((resolve) => {
      setDeleteConfirmState({
        isOpen: true,
        itemId: id,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

    if (result) {
      handleDelete(id);
    }
    setDeleteConfirmState({ isOpen: false, itemId: null, onConfirm: null, onCancel: null });
  };

  const handleDelete = async (itemId: number) => {
    try {
      const updatedItems = inspectionItems.filter(item => item.id !== itemId);
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

  const handleSaveToFile = async () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const defaultFileName = `点検項目マスタ_${dateStr}.csv`;
    setSaveFileName(defaultFileName);
    setIsSaveDialogOpen(true);
  };

  const handleSaveAndExit = async (table: TableType) => {
    if (hasChanges) {
      await handleSaveToFile(table);
    } else {
      navigate('/settings');
    }
  };

  const handleConfirmSave = async (table: TableType) => {
    if (!saveFileName) {
      toast({
        title: "エラー",
        description: "ファイル名を入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileName = saveFileName.endsWith('.csv') ? saveFileName : `${saveFileName}.csv`;
      let dataToSave;
      let path = 'inspection';

      if (table === 'inspectionItems') {
        dataToSave = inspectionItems.map(item => ({
          製造メーカー: item.manufacturer || '',
          機種: item.model || '',
          エンジン型式: item.engineType || '',
          部位: item.category || '',
          装置: item.equipment || '',
          確認箇所: item.item || '',
          判断基準: item.criteria || '',
          確認要領: item.method || '',
          測定等記録: item.measurementRecord || '',
          図形記録: item.diagramRecord || ''
        }));
      } else {
        dataToSave = tableItems;
        path = `inspection/table/${table}`;
      }


      const response = await fetch('/api/save-inspection-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: dataToSave,
          fileName: fileName,
          path: path
        }),
      });

      if (response.ok) {
        await fetchInspectionFiles();
        toast({
          title: "保存完了",
          description: `${fileName}に保存しました`,
        });
        setIsSaveDialogOpen(false);
        setHasChanges(false);
        await fetchInspectionFiles();

        if (pendingAction === 'back') {
          navigate('/settings');
        }
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "保存エラー",
        description: "点検項目の保存中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  const handleNavigateAway = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
      setPendingAction('back');
    } else {
      navigate('/');
    }
  };

  const handleSaveAndNavigate = async () => {
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const defaultFileName = `点検項目マスタ_${dateStr}.csv`;
      setSaveFileName(defaultFileName);
      setIsSaveDialogOpen(true);
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
    await handleSaveToFile(selectedTable);
    setPendingAction(null);
    setShowConfirmDialog(false);
    navigate('/');
  };


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

  const fetchInspectionFiles = async () => {
    try {
      const response = await fetch('/api/inspection-files');
      if (!response.ok) {
        throw new Error('ファイル一覧の取得に失敗しました');
      }
      const data = await response.json();
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

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
            setFilteredItems(Array.isArray(jsonData) ? jsonData : []);
          } catch (jsonError) {
            const results = await parseCSVData(text);
            const items = results.data.map((row: any, index: number) => ({
              ...row,
              id: row.id || index + 1,
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

    setInspectionItems([...inspectionItems, ...csvData]);
    setFilteredItems([...inspectionItems, ...csvData]);
    setCsvData([]);
    toast({
      title: "インポート完了",
      description: `${csvData.length}件のデータをインポートしました`,
    });
  };


  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    window.location.href = '/';
  };

  const handleCancelCancel = () => {
    setShowCancelDialog(false);
  };

  const handleModelSelect = (modelId: number) => {
    setSelectedModelId(modelId);
  };

  const handleAdd = async () => {
    if (selectedTable === 'machineNumbers' && (!newItem.number || !selectedModelId)) {
      toast({
        title: "エラー",
        description: "機械番号と機種を選択してください",
        variant: "destructive"
      });
      return;
    }

    try {
      const model = models.find((m) => m.id === selectedModelId);
      if(selectedTable === 'machineNumbers' && model){
        await addMachineNumber(newItem.number, selectedModelId.toString());
        setNewItem({ name: '', code: '', number: '' });
        fetchTableData();
        toast({
          title: "成功",
          description: "機械番号を追加しました"
        });
      } else if (selectedTable === 'manufacturers') {
        await addManufacturer(newItem.name);
        setNewItem({ name: '', code: '', number: '' });
        fetchTableData();
      } else if (selectedTable === 'models' && selectedManufacturerId) {
        await addModel(newItem.name, selectedManufacturerId.toString());
        setNewItem({ name: '', code: '', number: '' });
        fetchTableData();
      }
      else {
          toast({
            title: "エラー",
            description: "機種が見つかりません",
            variant: "destructive"
          });
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "エラー",
        description: "機械番号の追加に失敗しました",
        variant: "destructive"
      });
    }
  };

  const addItem = async (item: TableItem) => {
    try {
      const response = await fetch(`/api/${selectedTable}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
      if (!response.ok) {
        throw new Error(`Failed to add item: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  };

  const handleEdit = (item: TableItem) => {
    // Implement edit functionality here.  This is a placeholder.
    console.log("Edit item:", item);
    toast({title: "編集機能は未実装です。", description: "", variant: "warning"})
  };


  useEffect(() => {
    if (activeTab === "items") {
      setLoading(true);
      // 4つのテーブルから読み込み
      Promise.all([
        fetch('/api/inspection/table/manufacturers').then(res => res.json()),
        fetch('/api/inspection/table/models').then(res => res.json()),
        fetch('/api/inspection/table/machine_numbers').then(res => res.json()),
        fetch('/api/inspection/table/inspection_items').then(res => res.json())
      ])
        .then(([manufacturersData, modelsData, machineNumbersData, inspectionItemsData]) => {
          setManufacturers(manufacturersData);
          setModels(modelsData);
          setMachineNumbers(machineNumbersData); // Set machine numbers data
          setInspectionItems(inspectionItemsData);
          setFilteredItems(inspectionItemsData);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching data from tables:', error);
          toast({
            title: "エラー",
            description: "データの取得に失敗しました",
            variant: "destructive",
          });
          setLoading(false);
        });
    }
  }, [activeTab]);


  // 製造メーカー追加
  const addManufacturer = async (name: string) => {
    try {
      // 重複チェック
      const existingManufacturer = manufacturers.find(m => m.name === name);
      if (existingManufacturer) {
        toast({
          title: "注意",
          description: "この製造メーカーは既に登録されています",
          variant: "warning"
        });
        return;
      }

      const response = await fetch('/api/manufacturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (!response.ok) throw new Error('製造メーカーの追加に失敗しました');
      await fetchManufacturers();

      toast({
        title: "成功",
        description: "製造メーカーを追加しました",
      });
    } catch (error) {
      console.error('Error adding manufacturer:', error);
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 機種追加
  const addModel = async (name: string, manufacturerId: string) => {
    try {
      // 重複チェック
      const existingModel = models.find(m => m.name === name);
      if (existingModel) {
        toast({
          title: "注意",
          description: "この機種は既に登録されています",
          variant: "warning"
        });
        return;
      }

      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          manufacturerId: parseInt(manufacturerId)
        })
      });

      if (!response.ok) throw new Error('機種の追加に失敗しました');
      await fetchModels();

      toast({
        title: "成功",
        description: "機種を追加しました",
      });
    } catch (error) {
      console.error('Error adding model:', error);
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 機械番号追加
  const addMachineNumber = async (number: string, modelId: string) => {
    try {
      // 重複チェック
      const existingMachine = machineNumbers.find(m => m.number === number);
      if (existingMachine) {
        toast({
          title: "注意",
          description: "この機械番号は既に登録されています",
          variant: "warning"
        });
        return;
      }

      const response = await fetch('/api/machineNumbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number,
          modelId: parseInt(modelId)
        })
      });

      if (!response.ok) throw new Error('機械番号の追加に失敗しました');
      await fetchMachineNumbers();

      toast({
        title: "成功",
        description: "機械番号を追加しました",
      });
    } catch (error) {
      console.error('Error adding machine number:', error);
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive"
      });
    }
  };


  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">点検項目管理</CardTitle>
          <div className="flex gap-2">
            {activeTab === "tables" ? null : (
              <select
                className="border rounded p-2"
                value={selectedFile}
                onChange={(e) => {
                  const newFile = e.target.value;
                  setSelectedFile(newFile);
                  fetchInspectionItems(newFile);
                }}
                style={{ width: '200px' }}
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
            )}
            <Button variant="outline" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button onClick={() => handleSaveAndExit(selectedTable)}>保存して終了</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="tables">テーブル管理</TabsTrigger>
              <TabsTrigger value="items">点検項目</TabsTrigger>
            </TabsList>

            <TabsContent value="tables">
              <div className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div>
                    <Label>テーブル選択</Label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturers">製造メーカー</SelectItem>
                        <SelectItem value="models">機種</SelectItem>
                        <SelectItem value="machineNumbers">機械番号</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* テーブル表示 */}
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectedTable === 'manufacturers' && (
                          <>
                            <TableCell>ID</TableCell>
                            <TableCell>製造メーカー</TableCell>
                            <TableCell>操作</TableCell>
                          </>
                        )}
                        {selectedTable === 'models' && (
                          <>
                            <TableCell>機種ID</TableCell>
                            <TableCell>機種名</TableCell>
                            <TableCell>外部ID</TableCell>
                            <TableCell>操作</TableCell>
                          </>
                        )}
                        {selectedTable === 'machineNumbers' && (
                          <>
                            <TableCell>機械番号</TableCell>
                            <TableCell>機種ID</TableCell>
                            <TableCell>操作</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableItems.map((item: any) => (
                        <TableRow key={item.id || item.number}>
                          {selectedTable === 'manufacturers' && (
                            <>
                              <TableCell>{item.id}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                          {selectedTable === 'models' && (
                            <>
                              <TableCell>{item.code}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.externalId}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                          {selectedTable === 'machineNumbers' && (
                            <>
                              <TableCell>{item.number}</TableCell>
                              <TableCell>{item.modelId}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  {selectedTable === 'manufacturers' && (
                  <div className="border p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-4">新規追加</h3>
                    <div className="flex gap-4 items-end mb-4">
                      <div>
                        <Label>製造メーカー名</Label>
                        <Input
                          placeholder="製造メーカー名"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          className="w-[200px]"
                        />
                      </div>
                      <Button onClick={() => handleAdd()}>
                        <Plus className="h-4 w-4 mr-2" />
                        追加
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTable === 'models' && (
                  <div className="border p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-4">新規追加</h3>
                    <div className="flex gap-4 items-end mb-4">
                      <div>
                        <Label>機種名</Label>
                        <Input                          placeholder="機種名"                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          className="w-[200px]"
                        />
                      </div>
                      <div>
                        <Label>製造メーカー</Label>
                        <Select value={selectedManufacturerId?.toString() || ''} onValueChange={(value) => setSelectedManufacturerId(parseInt(value))}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="製造メーカーを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {manufacturers.map((manufacturer) => (
                              <SelectItem key={manufacturer.id} value={manufacturer.id?.toString()}>
                                {manufacturer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => handleAdd()}>
                        <Plus className="h-4 w-4 mr-2" />
                        追加
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTable === 'machineNumbers' && (
                  <div className="border p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-4">新規追加</h3>
                    <div className="flex gap-4 items-end mb-4">
                      <div>
                        <Label>機械番号</Label>
                        <Input
                          placeholder="機械番号"
                          value={newItem.number || ''}
                          onChange={(e) => setNewItem({ ...newItem, number: e.target.value })}
                          className="w-[200px]"
                        />
                      </div>
                      <div>
                        <Label>機種</Label>
                        <Select value={selectedModelId?.toString() || ''} onValueChange={(value) => handleModelSelect(parseInt(value, 10))}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="機種を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((model) => (
                              <SelectItem key={model.id} value={model.id?.toString()}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => handleAdd()}>
                        <Plus className="h-4 w-4 mr-2" />
                        追加
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items">
              <div className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <div className="w-64">
                    <Label>製造メーカー</Label>
                    <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        {manufacturers.map((m) => (
                          <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-64">
                    <Label>機種</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        {models?.map((m) => (
                          <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSearch}>検索</Button>
                  <div className="w-64">
                    <Label>検索</Label>
                    <Input
                      type="text"
                      placeholder="検索キーワード"
                      className="w-full"
                      onChange={(e) => {
                        const searchText = e.target.value.toLowerCase();
                        const filtered = tableItems.filter(item =>
                          item.name.toLowerCase().includes(searchText) ||
                          item.code?.toLowerCase().includes(searchText) ||
                          item.number?.toLowerCase().includes(searchText)
                        );
                        setTableItems(filtered);
                      }}
                    />
                  </div>
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

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>部位</TableCell>
                      <TableCell>装置</TableCell>
                      <TableCell>確認箇所</TableCell>
                      <TableCell>判断基準</TableCell>
                      <TableCell>確認要領</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.equipment}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.criteria}</TableCell>
                        <TableCell>{item.method}</TableCell>
                        <TableCell>
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
                              onClick={() => handleDeleteConfirm(item.id)}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>


      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>ファイルに保存</DialogTitle>
            <DialogDescription>
              保存するファイル名を入力してください
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="fileName">ファイル名</Label>
                <Input
                  id="fileName"
                  value={saveFileName}
                  onChange={(e) => setSaveFileName(e.target.value)}
                  placeholder="保存するファイル名を入力"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => {
                setIsSaveDialogOpen(false);
                setSaveFileName("");
              }}>
                キャンセル
              </Button>
              <Button type="button" onClick={handleConfirmSave}>
                保存
              </Button>
            </DialogFooter>
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
            <AlertDialogAction onClick={handleSaveAndNavigate}>
              保存して移動
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteConfirmState.isOpen} onOpenChange={() => setDeleteConfirmState({...deleteConfirmState, isOpen: false})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>項目の削除</AlertDialogTitle>
            <AlertDialogDescription>
              この項目を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={deleteConfirmState.onCancel}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={deleteConfirmState.onConfirm}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認</DialogTitle>
            <DialogDescription>
              編集を中止しますか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCancelDialog(false)}>
              現在のフォームに戻る
            </Button>
            <Button variant="destructive" onClick={() => {
              navigate('/settings');
              setShowCancelDialog(false);
            }}>
              終了してメニューに戻る
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}