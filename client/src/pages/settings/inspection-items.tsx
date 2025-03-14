import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui';
import { Plus, Edit, Trash2, Save, ArrowLeft, Check, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDrag, useDrop } from 'react-dnd';
import Papa from 'papaparse'; // Import PapaParse


// インスペクション項目の型定義（動的フィールドをサポート）
interface InspectionItem {
  id: number;
  manufacturer: string;
  model: string;
  engineType?: string;  // オプショナル
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
  measurementRecord: string;
  diagramRecord: string;
  [key: string]: any;  // 動的なプロパティに対応
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
  // 状態管理
  const [manufacturer, setManufacturer] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("");
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState<InspectionItem | null>(null);
  const [newItem, setNewItem] = useState({
    category: "",
    equipment: "",
    item: "",
    method: "",
    criteria: "",
    measurementRecord: "",
    diagramRecord: ""
  });

  // CSVデータ読み込み用の状態
  const [csvData, setCsvData] = useState<InspectionItem[]>([]);
  const [availableFiles, setAvailableFiles] = useState<{name: string, modified: string}[]>([]);
  const [currentFileName, setCurrentFileName] = useState("測定基準値_20250313.csv");

  // 変更追跡と確認ダイアログ用の状態
  const [hasChanges, setHasChanges] = useState(false);
  const [initialItems, setInitialItems] = useState<InspectionItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'back' | 'save' | null>(null);
  const [_, navigate] = useLocation();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");
  const [loading, setLoading] = useState(false); // ローディング状態を追加
  const [isNewItemRegistered, setIsNewItemRegistered] = useState(false); // 新規登録状態を追加

  const { toast } = useToast();

  // 変更を追跡する
  useEffect(() => {
    // 初期データ読み込み後に初期状態を保存
    if (inspectionItems.length > 0 && initialItems.length === 0) {
      setInitialItems(JSON.parse(JSON.stringify(inspectionItems)));
      setHasChanges(false);
    } else if (initialItems.length > 0) {
      // データに変更があるかチェック
      const currentData = JSON.stringify(inspectionItems);
      const initialData = JSON.stringify(initialItems);
      setHasChanges(currentData !== initialData);
    }
  }, [inspectionItems, initialItems]);

  // 利用可能なCSVファイル一覧を取得
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        const response = await fetch('/api/inspection-files');
        const data = await response.json();
        setAvailableFiles(data);
        if (data.length > 0) {
          setCurrentFileName(data[0].name);
        }
      } catch (err) {
        console.error("ファイル一覧取得エラー:", err);
        toast({
          title: "エラー",
          description: "ファイル一覧の取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchAvailableFiles();
  }, [toast]);

  // 選択されたファイルから点検項目を読み込む
  useEffect(() => {
    const fetchInspectionData = async () => {
      if (!currentFileName) return;

      try {
        const response = await fetch(`/api/inspection-items?file=${currentFileName}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const items = await response.json();

        if (Array.isArray(items)) {
          setInspectionItems(items);
          toast({
            title: "データ読み込み完了",
            description: `${items.length}件の点検項目を読み込みました`,
          });
        }
      } catch (err) {
        console.error("データ読み込みエラー:", err);
        toast({
          title: "エラー",
          description: "点検項目の読み込みに失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchInspectionData();
  }, [currentFileName, toast]);

  // 利用可能なファイル一覧を取得
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        const response = await fetch('/api/inspection-files');
        const data = await response.json();
        const fileList = Array.isArray(data) ? data.map(file => ({
          name: file.name,
          modified: new Date(file.modified).toLocaleString()
        })) : [];
        setAvailableFiles(fileList);

        // 最新のファイルを設定
        if (fileList.length > 0) {
          setCurrentFileName(fileList[0].name);
        }
      } catch (err) {
        console.error("ファイル一覧取得エラー:", err);
        toast({
          title: "エラー",
          description: "ファイル一覧の取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchAvailableFiles();
  }, []);

  // CSVデータ読み込み
  useEffect(() => {
    const fetchInspectionData = async () => {
      // 変更があればリセット
      setInitialItems([]);
      try {
        const response = await fetch(`/api/inspection-items?file=${currentFileName}&t=${new Date().getTime()}`);

        if (!response.ok) {
          throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim() === '') {
          throw new Error('データが空です');
        }

        // CSVパース処理 - 柔軟に対応するため、ヘッダーマッピングを動的に行う
        const results = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          // エラーを許容する
          error: (error) => {
            console.error("CSV解析エラー:", error);
          }
        });

        if (results.errors && results.errors.length > 0) {
          console.log("CSVパースエラー:", results.errors);
          // エラーを表示するが、処理は続行する
          toast({
            title: "CSVパース警告",
            description: "一部のデータが正しく読み込めない可能性があります",
            variant: "warning",
          });
        }

        // ヘッダーの確認とマッピング
        const headers = results.meta.fields || [];
        console.log("CSVヘッダー:", headers);
        console.log("予想されるヘッダー数:", headers.length);

        // ヘッダーマッピングを動的に構築
        const headerMapping: Record<string, string> = {
          // 日本語ヘッダー -> アプリケーションのプロパティ名
          '製造メーカー': 'manufacturer',
          '機種': 'model',
          'エンジン型式': 'engineType',
          '部位': 'category',
          '装置': 'equipment',
          '確認箇所': 'item',
          '判断基準': 'criteria',
          '確認要領': 'method',
          '測定等記録': 'measurementRecord',
          '図形記録': 'diagramRecord',
          // 追加可能なフィールド
          '時期': 'season',
          '備考': 'remarks',
          'メモ': 'notes'
        };

        // データをアプリケーションの形式に変換（柔軟なマッピング）
        const items = results.data.map((row: any, index: number) => {
          const item: Record<string, any> = { id: index + 1 };

          // すべてのヘッダーに対して処理
          Object.keys(row).forEach(header => {
            // マッピングされたプロパティ名があればそれを使用、なければヘッダー名をそのまま使用
            const propName = headerMapping[header] || header;
            item[propName] = row[header] || '';
          });

          // 必須フィールドが存在しない場合は空文字で初期化
          const requiredFields = ['manufacturer', 'model', 'category', 'equipment', 'item', 'criteria', 'method', 'measurementRecord', 'diagramRecord'];
          requiredFields.forEach(field => {
            if (item[field] === undefined) {
              item[field] = '';
            }
          });

          return item as InspectionItem;
        });

        setInspectionItems(items);

        toast({
          title: "データ読み込み完了",
          description: `${items.length}件の点検項目を読み込みました`,
          duration: 3000,
        });
      } catch (err) {
        console.error("データ読み込みエラー:", err);
        toast({
          title: "エラー",
          description: `データの読み込みに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`,
          variant: "destructive",
        });
        // エラー時は空の配列を表示
        setInspectionItems([]);
      }
    };

    fetchInspectionData();
  }, [currentFileName, toast]);

  // 検索状態を保持する
  const [searchQuery, setSearchQuery] = useState<string>("");

  // メーカーと機種と部位でフィルタリング
  useEffect(() => {
    let filtered = inspectionItems;

    // 検索クエリがある場合
    if (searchQuery) {
      filtered = filtered.filter(item => 
        (item.manufacturer && item.manufacturer.toLowerCase().includes(searchQuery)) ||
        (item.model && item.model.toLowerCase().includes(searchQuery)) ||
        (item.category && item.category.toLowerCase().includes(searchQuery)) ||
        (item.item && item.item.toLowerCase().includes(searchQuery)) ||
        (item.method && item.method.toLowerCase().includes(searchQuery)) ||
        (item.criteria && item.criteria.toLowerCase().includes(searchQuery)) ||
        (item.measurementRecord && item.measurementRecord.toLowerCase().includes(searchQuery)) ||
        (item.diagramRecord && item.diagramRecord.toLowerCase().includes(searchQuery))
      );
    }

    // メーカー、機種、部位、装置でフィルタリング
    filtered = filtered.filter(
      (item) => 
        (!manufacturer || manufacturer === "all" || item.manufacturer === manufacturer) && 
        (!model || model === "all" || item.model === model) &&
        (!categoryFilter || categoryFilter === "all" || item.category === categoryFilter) &&
        (!equipmentFilter || equipmentFilter === "all" || item.equipment === equipmentFilter)
    );

    setFilteredItems(filtered);
  }, [manufacturer, model, categoryFilter, equipmentFilter, inspectionItems, searchQuery]);

  // 点検項目の追加ダイアログを開く
  const openAddDialog = () => {
    setIsEditMode(false);
    setCurrentItem(null);
    setNewItem({
      category: "",
      item: "",
      method: "",
      criteria: "",
      measurementRecord: "",
      diagramRecord: ""
    });
    setIsDialogOpen(true);
  };

  // 項目追加ダイアログを開く
  const openAddItemDialog = () => {
    setIsEditMode(false);
    setCurrentItem(null);
    // 将来的に項目追加用の専用ダイアログを表示する場合は
    // ここでそのダイアログを開く処理を実装する
    setIsDialogOpen(true);
  };

  // 点検項目の編集ダイアログを開く
  const openEditDialog = (item: InspectionItem) => {
    setIsEditMode(true);
    setCurrentItem(item);
    setNewItem({
      category: item.category,
      equipment: item.equipment || "",
      item: item.item,
      method: item.method,
      criteria: item.criteria,
      measurementRecord: item.measurementRecord || "",
      diagramRecord: item.diagramRecord || ""
    });
    setIsDialogOpen(true);
  };

  // 点検項目を追加または更新する
  const addInspectionItem = () => {
    if (
      (!isEditMode && (!manufacturer || !model)) ||
      !newItem.category ||
      !newItem.item ||
      !newItem.method ||
      !newItem.criteria
    ) {
      toast({
        title: "入力エラー",
        description: "すべての必須項目を入力してください",
        variant: "destructive",
      });
      return;
    }

    if (isEditMode && currentItem) {
      // 既存項目の編集
      const updatedItems = inspectionItems.map((item) =>
        item.id === currentItem.id
          ? {
              ...item,
              category: newItem.category || "",
              equipment: newItem.equipment || "",
              item: newItem.item || "",
              method: newItem.method || "",
              criteria: newItem.criteria || "",
              measurementRecord: newItem.measurementRecord || "",
              diagramRecord: newItem.diagramRecord || ""
            }
          : item
      );
      setInspectionItems(updatedItems);
      toast({
        title: "更新完了",
        description: "点検項目を更新しました",
      });
    } else {
      // 新規項目の追加
      const newId =
        inspectionItems.length > 0
          ? Math.max(...inspectionItems.map((item) => item.id)) + 1
          : 1;
      const newInspectionItem: InspectionItem = {
        id: newId,
        manufacturer,
        model,
        category: newItem.category || "",
        equipment: newItem.equipment || "",
        item: newItem.item || "",
        method: newItem.method || "",
        criteria: newItem.criteria || "",
        measurementRecord: newItem.measurementRecord || "",
        diagramRecord: newItem.diagramRecord || ""
      };
      handleAddNewItem(newInspectionItem); // 新しい関数を呼び出す
    }

    setIsDialogOpen(false);
  };

  // 点検項目を削除する
  const deleteInspectionItem = (id: number) => {
    if (window.confirm("この点検項目を削除してもよろしいですか？")) {
      const updatedItems = inspectionItems.filter((item) => item.id !== id);
      setInspectionItems(updatedItems);
      toast({
        title: "削除完了",
        description: "点検項目を削除しました",
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
    if (!isNewItemRegistered && !hasChanges) {
      navigate('/settings');
      return;
    }

    setIsSaveDialogOpen(true);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const baseName = currentFileName.replace(/\.csv$/i, '') || '点検項目マスタ';
    setSaveFileName(`${baseName}_${dateStr}.csv`);
  };

  const handleAddNewItem = async (item: InspectionItem) => {
    try {
      setInspectionItems([...inspectionItems, item]);
      setIsNewItemRegistered(true);
      toast({
        title: "登録完了",
        description: "新規項目を登録しました",
      });
    } catch (error) {
      console.error('新規登録エラー:', error);
      toast({
        title: "エラー",
        description: "登録に失敗しました",
        variant: "destructive",
      });
    }
  };

  // ファイル保存ダイアログを閉じる
  const closeSaveDialog = () => {
    setIsSaveDialogOpen(false);
    setPendingAction(null);
  };

  const fetchInspectionFiles = async () => {
    try {
      const response = await fetch('/api/inspection-files');
      const data = await response.json();
      if (data.files && Array.isArray(data.files)) {
        const fileList = data.files.map(file => ({
          name: file.name,
          modified: new Date(file.modified).toLocaleString()
        }));
        setAvailableFiles(fileList);
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

  // 変更を保存する
  const saveChanges = async (newFileName?: string) => {
    try {
      // 保存するフィールドを決定（動的に変更可能）
      // 基本フィールドを定義
      const baseFields = [
        { header: '製造メーカー', key: 'manufacturer' },
        { header: '機種', key: 'model' },
        { header: 'エンジン型式', key: 'engineType' },
        { header: '部位', key: 'category' },
        { header: '装置', key: 'equipment' },
        { header: '確認箇所', key: 'item' },
        { header: '判断基準', key: 'criteria' },
        { header: '確認要領', key: 'method' },
        { header: '測定等記録', key: 'measurementRecord' },
        { header: '図形記録', key: 'diagramRecord' }
      ];

      // 追加フィールドがあれば動的に追加（例：サンプルデータから追加フィールドを検出）
      const additionalFields: Array<{ header: string, key: string }> = [];

      // 最初の項目で利用可能なフィールドを確認
      if (inspectionItems.length > 0) {
        const firstItem = inspectionItems[0];
        Object.keys(firstItem).forEach(key => {
          // 基本フィールド以外で、idでもなければ追加フィールドとして扱う
          const isBaseField = baseFields.some(field => field.key === key);
          if (!isBaseField && key !== 'id') {
            // キーをヘッダー名に変換（camelCase -> 日本語など）
            let header = key;
            if (key === 'season') header = '時期';
            if (key === 'remarks') header = '備考';
            if (key === 'notes') header = 'メモ';

            additionalFields.push({ header, key });
          }
        });
      }

      // 全フィールドを結合
      const allFields = [...baseFields, ...additionalFields];

      // ヘッダー行を作成
      const csvHeaders = allFields.map(field => field.header);
      const csvRows = [csvHeaders.join(',')];

      // データ行を追加
      inspectionItems.forEach(item => {
        // 各フィールドの値を取得
        const values = allFields.map(field => {
          // key が 'engineType' で、値が undefined または空文字の場合は空欄を返す
          if (field.key === 'engineType' && (!item[field.key] || item[field.key] === '')) {
            return '';
          }
          // その他のフィールドは値をそのまま返す（ただし undefined の場合は空文字を返す）
          return item[field.key] !== undefined ? item[field.key] : '';
        });

        // カンマを含む値は引用符で囲む処理を追加
        const escapedValues = values.map(val => {
          // 値にカンマ、改行、引用符が含まれる場合
          if (typeof val === 'string' && (val.includes(',') || val.includes('\n') || val.includes('"'))) {
            // 引用符をエスケープして引用符で囲む
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });

        csvRows.push(escapedValues.join(','));
      });

      const csvContent = csvRows.join('\n');

      // 保存するファイル名
      const fileName = newFileName || (currentFileName.startsWith("仕業点検_") ? currentFileName : `仕業点検_${new Date().toISOString().slice(0, 10)}.csv`);

      // APIを呼び出して変更を保存する処理
      const response = await fetch('/api/save-inspection-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: fileName,
          content: csvContent
        }),
      });

      if (!response.ok) {
        throw new Error(`保存に失敗しました: ${response.status} ${response.statusText}`);
      }

      // ファイル一覧を更新
      await fetchInspectionFiles();

      toast({
        title: "保存完了",
        description: `変更内容を ${fileName} に保存しました`,
      });

      // 初期状態を更新
      setInitialItems(JSON.parse(JSON.stringify(inspectionItems)));
      setHasChanges(false);
      setIsNewItemRegistered(false); // 新規登録フラグをリセット

      // 保存して戻る場合は画面遷移
      if (pendingAction === 'save') {
        navigate('/');
      }

      setIsSaveDialogOpen(false); // ダイアログを閉じる
      return true;
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "保存エラー",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      });
      return false;
    }
  };

  // 確認ダイアログの処理
  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);

    if (pendingAction === 'save') {
      // 保存ダイアログは別で開くので、ここでは何もしない
    } else if (pendingAction === 'back') {
      navigate('/');
    }

    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // CSVファイルを読み込む関数
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          // CSVデータを解析
          const results = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            // エラーを許容する
            error: (error) => {
              console.error("CSV解析エラー:", error);
            }
          });

          if (results.errors && results.errors.length > 0) {
            console.log("CSVパースエラー:", results.errors);
            // エラーを表示するが、処理は続行する
            toast({
              title: "CSVパース警告",
              description: "一部のデータが正しく読み込めない可能性があります",
              variant: "warning",
            });
          }

          // ヘッダーの確認とマッピング
          const headers = results.meta.fields || [];
          console.log("CSVヘッダー:", headers);
          console.log("予想されるヘッダー数:", headers.length);


          // ヘッダーマッピングを動的に構築
          const headerMapping: Record<string, string> = {
            // 日本語ヘッダー -> アプリケーションのプロパティ名
            '製造メーカー': 'manufacturer',
            '機種': 'model',
            'エンジン型式': 'engineType',
            '部位': 'category',
            '装置': 'equipment',
            '確認箇所': 'item',
            '判断基準': 'criteria',
            '確認要領': 'method',
            '測定等記録': 'measurementRecord',
            '図形記録': 'diagramRecord',
            // IDフィールドのマッピング
            'id': 'id',
            // 追加可能なフィールド
            '時期': 'season',
            '備考': 'remarks',
            'メモ': 'notes'
          };

          // 逆マッピング（英語 -> 日本語）も作成
          const reverseMapping: Record<string, string> = {};
          Object.entries(headerMapping).forEach(([jpField, enField]) => {
            reverseMapping[enField] = jpField;
          });

          // データをアプリケーションの形式に変換（柔軟なマッピング）
          const items = results.data.map((row: any, index: number) => {
            const item: Record<string, any> = {};

            // ID設定（存在しない場合は自動採番）
            if (row.id) {
              item.id = Number(row.id);
            } else if (row.ID) {
              item.id = Number(row.ID);
            } else {
              item.id = index + 1;
            }

            // すべてのヘッダーに対して処理
            Object.keys(row).forEach(header => {
              // 1. そのまま英語のプロパティ名として存在する場合
              if (Object.values(headerMapping).includes(header)) {
                item[header] = row[header] || '';
              }
              // 2. 日本語ヘッダーのマッピングを使用
              else {
                const propName = headerMapping[header] || header;
                item[propName] = row[header] || '';
              }
            });

            // 必要なフィールドの存在確認（データの補完）
            ['manufacturer', 'model', 'category', 'equipment', 'item', 'criteria', 'method'].forEach(field => {
              if (!item[field]) {
                // 必須フィールドが存在しない場合は空文字を設定
                item[field] = '';
              }
            });場合は空文字で初期化
            const requiredFields = ['manufacturer', 'model', 'category', 'equipment', 'item', 'criteria', 'method', 'measurementRecord', 'diagramRecord'];
            requiredFields.forEach(field => {
              if (item[field] === undefined) {
                item[field] = '';
              }
            });

            return item as InspectionItem;
          });

          setCsvData(items);
          toast({
            title: "CSV読み込み完了",
            description: `${items.length}件のデータを読み込みました`,
          });
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

  // CSVから読み込んだデータをインポートする
  const importCSVData = () => {
    if (csvData.length === 0) {
      toast({
        title: "エラー",
        description: "インポートするデータがありません",
        variant: "destructive",
      });
      return;
    }

    // 既存データとマージ
    const mergedData = [...inspectionItems];
    let addedCount = 0;

    csvData.forEach(newItem => {
      const exists = mergedData.some(item => 
        item.manufacturer === newItem.manufacturer &&
        item.model === newItem.model &&
        item.category === newItem.category &&
        item.item === newItem.item
      );

      if (!exists) {
        mergedData.push(newItem);
        addedCount++;
      }
    });

    setInspectionItems(mergedData);
    setCsvData([]);

    toast({
      title: "インポート完了",
      description: `${addedCount}件のデータをインポートしました`,
    });
  };

  // 行の移動処理
  const moveRow = (dragIndex, hoverIndex) => {
    const newItems = Array.from(inspectionItems);
    const [removed] = newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, removed);
    setInspectionItems(newItems);
  };

  // ドラッグ可能な行コンポーネント
  const DraggableTableRow = ({ item, index, openEditDialog, deleteInspectionItem }) => {
    const ref = useRef(null);

    const [{ isDragging }, drag] = useDrag({
      type: 'TABLE_ROW',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'TABLE_ROW',
      hover(draggedItem, monitor) {
        if (!ref.current) {
          return;
        }

        const dragIndex = draggedItem.index;
        const hoverIndex = index;

        // 自分自身にドロップしようとしている場合は何もしない
        if (dragIndex === hoverIndex) {
          return;
        }

        // 行の位置を決定
        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        // ドラッグしている行が上から下へ移動する場合
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }

        // ドラッグしている行が下から上へ移動する場合
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }

        // 実際に行を移動する
        moveRow(dragIndex, hoverIndex);

        // ドラッグしているアイテムのインデックスを更新
        draggedItem.index = hoverIndex;
      },
    });

    // ドラッグ中のスタイルを適用
    const opacity = isDragging ? 0.5 : 1;

    // 参照を組み合わせる
    drag(drop(ref));

    return (
      <TableRow
        ref={ref}
        key={item.id}
        className="border-b border-gray-200"
        style={{ opacity, cursor: 'move' }}
      >
        <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm" title={item.manufacturer}>{item.manufacturer}</TableCell>
        <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm" title={item.model}>{item.model}</TableCell>
        <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm">
          <div className="flex items-center">
            <GripVertical className="h-4 w-4 mr-2 cursor-grab" />
            {item.category}
          </div>
        </TableCell>
        <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm" title={item.equipment}>{item.equipment}</TableCell>
        <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm" title={item.item}>{item.item}</TableCell>
        <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm" title={item.method} style={{ maxWidth: '450px' }}>{item.method}</TableCell>
        <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm" title={item.criteria} style={{ maxWidth: '300px' }}>{item.criteria}</TableCell>
        <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm" title={item.measurementRecord}>{item.measurementRecord}</TableCell>
        <TableCell className="whitespace-normal py-2 break-words border border-gray-200 text-sm" title={item.diagramRecord}>{item.diagramRecord}</TableCell>
        <TableCell className="sticky right-0 bg-background py-2 border border-gray-200">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditDialog(item)}
            >
              <Edit className="h-4 w-4" />
            </Button            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteInspectionItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // 編集用ダイアログの状態
  const [editItem, setEditItem] = useState<InspectionItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen]= useState(false);
  const [dynamicFields, setDynamicFields] = useState<Array<{ key: string, label: string, value: string }>>([]);
  const [editComment, setEditComment] = useState(""); // 追加：コメント状態

  // 点検項目の編集
  const handleEditDialog = (item: InspectionItem) => {
    // 基本フィールド以外の動的フィールドを検出
    const baseFields = ['id', 'manufacturer', 'model', 'category', 'equipment', 'item', 'criteria', 'method', 'measurementRecord', 'diagramRecord'];
    const extraFields: Array<{ key: string, label: string, value: string }> = [];

    Object.entries(item).forEach(([key, value]) => {
      if (!baseFields.includes(key) && key !== 'engineType') {
        // キーをラベルに変換（camelCase -> 日本語など）
        let label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (key === 'season') label = '時期';
        if (key === 'remarks') label = '備考';
        if (key === 'notes') label = 'メモ';

        extraFields.push({ key, label, value: value as string });
      }
    });

    setDynamicFields(extraFields);
    setEditItem({ ...item });
    setEditComment(""); // コメントをクリア
    setIsEditDialogOpen(true);
  };

  // 動的フィールドの値を更新
  const updateDynamicField = (index: number, value: string) => {
    const updatedFields = [...dynamicFields];
    updatedFields[index].value = value;
    setDynamicFields(updatedFields);
  };

  // 新しいフィールドを追加
  const addNewField = () => {
    // フィールド名のプリセット
    const presets = [
      { key: 'season', label: '時期' },
      { key: 'remarks', label: '備考' },
      { key: 'notes', label: 'メモ' },
      { key: 'frequency', label: '頻度' },
      { key: 'priority', label: '優先度' }
];

    // すでに使用されていないプリセットを探す
    const unusedPreset= presets.find(preset => 
      !dynamicFields.some(field => field.key === preset.key)
    );

    if (unusedPreset) {
      setDynamicFields([...dynamicFields, { ...unusedPreset, value: '' }]);
    } else {
      // すべてのプリセットが使用済みの場合はカスタムフィールド
      const customField = { 
        key: `customField${dynamicFields.length + 1}`, 
        label: `カスタムフィールド${dynamicFields.length + 1}`, 
        value: '' 
      };
      setDynamicFields([...dynamicFields, customField]);
    }
  };

  // 点検項目の編集を保存
  const handleSaveEdit = () => {
    if (!editItem) return;

    // 動的フィールドの値をeditItemに追加
    const updatedEditItem = { ...editItem };
    dynamicFields.forEach(field => {
      updatedEditItem[field.key] = field.value;
    });

    const updatedItems = inspectionItems.map(item => 
      item.id === updatedEditItem.id ? updatedEditItem : item
    );

    setInspectionItems(updatedItems);
    setIsEditDialogOpen(false);
    // コメントがある場合は表示、なければ基本メッセージ
    const description = editComment 
      ? `点検項目を更新しました: ${editComment}`
      : "点検項目を更新しました";
    toast({
      title: "更新完了",
      description: description,
    });
  };

  // 保存処理を実行
  const saveData = async () => {
    if (!saveFileName.trim()) {
      toast({
        title: "エラー",
        description: "ファイル名を入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/save-inspection-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: inspectionItems,
          fileName: saveFileName,
          sourceFileName: currentFileName  // 元のファイル名を追加
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "保存完了",
          description: `データを${result.fileName}に保存しました`,
        });
        setHasChanges(false);
        setIsSaveDialogOpen(false);
        setPendingAction(null);
        // ファイル一覧を更新
        fetchInspectionFiles();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "保存に失敗しました");
      }
    } catch (error) {
      console.error("データ保存エラー:", error);
      toast({
        title: "エラー",
        description: `データの保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 変更を保存して終了
  const handleSaveAndExit = async () => {
    if (hasChanges) {
      // 変更がある場合、保存ダイアログを開く
      setIsSaveDialogOpen(true);
      // デフォルトのファイル名設定（現在のファイル名に日付を追加）
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const baseName = currentFileName.replace(/\.csv$/i, '');
      setSaveFileName(`${baseName}_${dateStr}.csv`);
    } else {
      navigate('/settings');
    }
  };


  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">点検項目マスタ</CardTitle>
          <div className="flex gap-2">
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
        {/* ファイル選択とインポート（統合） */}
        <div className="border p-4 rounded-md space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* 保存済みCSVファイル選択 */}
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="saved-csv-file" className="mb-2 block">保存済みCSVファイル</Label>
              <Select
                value={currentFileName}
                onValueChange={setCurrentFileName}
              >
                <SelectTrigger id="saved-csv-file">
                  <SelectValue placeholder="ファイルを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableFiles.map(file => (
                    <SelectItem key={file.name} value={file.name}>
                      {file.name} ({file.modified})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 新規CSVファイル選択とインポートボタン */}
            <div className="flex-1 min-w-[300px]">
              <Label htmlFor="csv-file" className="mb-2 block">CSVファイルインポート</Label>
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

          {csvData.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {csvData.length}件のデータが読み込まれています。「インポート」ボタンを押してインポートしてください。
            </p>
          )}
        </div>

        {/* 点検項目のメインエリア */}
        <div className="border p-4 rounded-md space-y-4">
          {/* 検索フィールド追加 */}
          <div className="mb-4">
            <Label htmlFor="search">検索</Label>
            <Input
              id="search"
              placeholder="キーワードで検索（部位、点検項目、点検方法、判定基準など）"
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">メーカー</Label>
              <Select
                value={manufacturer}
                onValueChange={(value) => {
                  setManufacturer(value);
                  if (value === "all") {
                    // すべてを選択した場合は関連フィルターもリセット
                    setModel("");
                    setCategoryFilter("");
                    setEquipmentFilter("");
                  } else {
                    // 特定のメーカーを選択した場合は機種のみリセット
                    setModel("");
                  }
                }}
              >
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {[...new Set(inspectionItems.map(item => item.manufacturer))]
                    .filter((mfr) => mfr && mfr.trim() !== "")
                    .map((mfr) => (
                      <SelectItem key={mfr} value={mfr}>
                        {mfr || "未設定"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">機種</Label>
              <Select
                value={model}
                onValueChange={(value) => {
                  setModel(value);
                  if (value === "all") {
                    // すべてを選択した場合は後続フィルターをリセット
                    setCategoryFilter("");
                    setEquipmentFilter("");
                  }
                }}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {[...new Set(inspectionItems
                    .filter(item => !manufacturer || manufacturer === "all" || item.manufacturer === manufacturer)
                    .map(item => item.model))]
                    .filter((mdl) => mdl && mdl.trim() !== "")
                    .map((mdl) => (
                      <SelectItem key={mdl} value={mdl}>
                        {mdl || "未設定"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">部位</Label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  if (value === "all") {
                    // すべてを選択した場合は装置フィルターをリセット
                    setEquipmentFilter("");
                  }
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="部位を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {[...new Set(inspectionItems
                    .filter(item =>
                      (!manufacturer || manufacturer === "all" || item.manufacturer === manufacturer) &&
                      (!model || model === "all" || item.model === model)
                    )
                    .map(item => item.category))]
                    .filter((cat) => cat && cat.trim() !== "")
                    .map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat || "未設定"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">装置</Label>
              <Select
                value={equipmentFilter}
                onValueChange={(value) => {
                  setEquipmentFilter(value);
                }}
              >
                <SelectTrigger id="equipment">
                  <SelectValue placeholder="装置を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {[...new Set(inspectionItems
                    .filter(item =>
                      (!manufacturer || manufacturer === "all" || item.manufacturer === manufacturer) &&
                      (!model || model === "all" || item.model === model) &&
                      (!categoryFilter || categoryFilter === "all" || item.category === categoryFilter)
                    )
                    .map(item => item.equipment))]
                    .filter((equip) => equip && equip.trim() !== "")
                    .map((equip) => (
                      <SelectItem key={equip} value={equip}>
                        {equip || "未設定"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 点検項目一覧と操作ボタン */}
          <div className="flex justify-between items-center mt-4">
            <h3 className="text-lg font-semibold">
              点検項目一覧 ({filteredItems.length}件)
            </h3>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openAddDialog}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                レコード追加
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openAddItemDialog}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                項目追加
              </Button>
            </div>
          </div>

          {/* 点検項目テーブル */}
          {filteredItems.length > 0 ? (
            <div className="border rounded-md overflow-x-auto" style={{ maxWidth: '100%', overflowY: 'auto', maxHeight: '65vh' }}>
              <Table className="min-w-[2000px] border-collapse">
                <TableHeader><TableRow className="border-b border-gray-200">
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
                  {filteredItems.map((item, index) => (
                    <DraggableTableRow
                      item={item}
                      index={index}
                      key={item.id}
                      openEditDialog={openEditDialog}
                      deleteInspectionItem={deleteInspectionItem}
                      moveRow={moveRow}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center items-center p-12 border rounded-md">
              <p className="text-muted-foreground">
                選択したメーカーと機種の点検項目がありません。
                <br />
                「新規追加」から点検項目を登録してください。
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* 点検項目追加・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "点検項目を編集" : "点検項目を追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">部位</Label>
              <Input
                id="category"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
                placeholder="例: エンジン、油圧系統など"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment">装置</Label>
              <Input
                id="equipment"
                value={newItem.equipment}
                onChange={(e) =>
                  setNewItem({ ...newItem, equipment: e.target.value })
                }
                placeholder="例: 本体、スターターなど"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item">点検項目</Label>
              <Input
                id="item"
                value={newItem.item}
                onChange={(e) =>
                  setNewItem({ ...newItem, item: e.target.value })
                }
                placeholder="例: エンジンオイル量、ブレーキパッド摩耗など"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">点検方法</Label>
              <Input
                id="method"
                value={newItem.method}
                onChange={(e) =>
                  setNewItem({ ...newItem, method: e.target.value })
                }
                placeholder="例: 目視確認、測定など"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria">判定基準</Label>
              <Input
                id="criteria"
                value={newItem.criteria}
                onChange={(e) =>
                  setNewItem({ ...newItem, criteria: e.target.value })
                }
                placeholder="例: ○○mm以上あること、××の範囲内など"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measurementRecord">測定等記録</Label>
              <Input
                id="measurementRecord"
                value={newItem.measurementRecord}
                onChange={(e) =>
                  setNewItem({ ...newItem, measurementRecord: e.target.value })
                }
                placeholder="測定値などを記録"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagramRecord">図形記録</Label>
              <Input
                id="diagramRecord"
                value={newItem.diagramRecord}
                onChange={(e) =>
                  setNewItem({ ...newItem, diagramRecord: e.target.value })
                }
                placeholder="図形に関する記録"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              {isEditMode ? "編集完了" : "キャンセル"}
            </Button>
            <Button type="button" onClick={addInspectionItem}>
              {isEditMode ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ファイル保存ダイアログ */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>変更を保存</DialogTitle>
            <DialogDescription>
              変更内容を保存するためのファイル名を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fileName">ファイル名</Label>
              <Input
                id="fileName"
                value={saveFileName}
                onChange={(e) => setSaveFileName(e.target.value)}
                placeholder="例: 仕業点検マスタ_20240101.csv"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={saveData}>
              保存
            </Button>
          </DialogFooter>
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
            <Button onClick={() => {
              setShowConfirmDialog(false);
              setIsSaveDialogOpen(true);
              // デフォルトのファイル名設定
              const now = new Date();
              const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
              const baseName = currentFileName.replace(/\.csv$/i, '');
              setSaveFileName(`${baseName}_${dateStr}.csv`);
            }}>
              保存する
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* 点検項目編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>点検項目の編集</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="manufacturer" className="text-right">
                  製造メーカー
                </Label>
                <Input
                  id="manufacturer"
                  value={editItem.manufacturer}
                  onChange={(e) => setEditItem({ ...editItem, manufacturer: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  機種
                </Label>
                <Input
                  id="model"
                  value={editItem.model}
                  onChange={(e) => setEditItem({ ...editItem, model: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="engineType" className="text-right">
                  エンジン型式
                </Label>
                <Input
                  id="engineType"
                  value={editItem.engineType || ''}
                  onChange={(e) => setEditItem({ ...editItem, engineType: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  部位
                </Label>
                <Input
                  id="category"
                  value={editItem.category}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="equipment" className="text-right">
                  装置
                </Label>
                <Input
                  id="equipment"
                  value={editItem.equipment}
                  onChange={(e) => setEditItem({ ...editItem, equipment: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item" className="text-right">
                  確認箇所
                </Label>
                <Input
                  id="item"
                  value={editItem.item}
                  onChange={(e) => setEditItem({ ...editItem, item: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="criteria" className="text-right">
                  判断基準
                </Label>
                <Input
                  id="criteria"
                  value={editItem.criteria}
                  onChange={(e) => setEditItem({ ...editItem, criteria: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="method" className="text-right">
                  確認要領
                </Label>
                <Input
                  id="method"
                  value={editItem.method}
                  onChange={(e) => setEditItem({ ...editItem, method: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="measurementRecord" className="text-right">
                  測定等記録
                </Label>
                <Input
                  id="measurementRecord"
                  value={editItem.measurementRecord}
                  onChange={(e) => setEditItem({ ...editItem, measurementRecord: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="diagramRecord" className="text-right">
                  図形記録
                </Label>
                <Input
                  id="diagramRecord"
                  value={editItem.diagramRecord}
                  onChange={(e) => setEditItem({ ...editItem, diagramRecord: e.target.value })}
                  className="col-span-3"
                />
              </div>

              {/* 動的フィールド */}
              {dynamicFields.map((field, index) => (
                <div key={field.key} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={field.key} className="text-right">
                    {field.label}
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id={field.key}
                      value={field.value}
                      onChange={(e) => updateDynamicField(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const newFields = [...dynamicFields];
                        newFields.splice(index, 1);
                        setDynamicFields(newFields);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6L18 18"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}

              {/* フィールド追加ボタン */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={addNewField}
                  className="flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M12 5V19"></path>
                    <path d="M5 12H19"></path>
                  </svg>
                  フィールド追加
                </Button>
              </div>
              <div className="grid grid-cols-4 items-center gap-4 mt-4">
                <Label htmlFor="editComment" className="text-right">
                  コメント・メモ
                </Label>
                <textarea
                  id="editComment"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="col-span-3 min-h-[80px] p-2 rounded-md border border-input bg-background text-sm resize-vertical"
                  placeholder="編集に関するコメントやメモを入力してください"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
    </DndProvider>
  );
}