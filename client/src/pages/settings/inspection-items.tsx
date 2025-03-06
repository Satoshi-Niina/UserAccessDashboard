import React, { useState, useEffect } from 'react';
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
} from '@/components/ui';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 点検項目の型定義
interface InspectionItem {
  id: number;
  manufacturer: string;
  model: string;
  category: string;
  item: string;
  method: string;
  criteria: string;
  measurementRecord?: string; // Optional measurement record
  diagramRecord?: string;     // Optional diagram record
}

// 仮のサンプルデータ（メーカーと機種）
const sampleManufacturers = ["日立", "三菱", "東芝", "富士電機", "明電舎"];
const sampleModels = ["HM-100", "HM-200", "MT-300", "TB-150", "FJ-400", "MD-500"];

// 仮の点検項目データ
const sampleInspectionItems: InspectionItem[] = [
  {
    id: 1,
    manufacturer: "日立",
    model: "HM-100",
    category: "エンジン",
    item: "エンジンオイル確認",
    method: "目視確認",
    criteria: "規定値（L〜H）の間にあること",
  },
  {
    id: 2,
    manufacturer: "日立",
    model: "HM-100",
    category: "ブレーキ",
    item: "ブレーキパッド確認",
    method: "厚み測定",
    criteria: "5mm以上あること",
  },
  {
    id: 3,
    manufacturer: "三菱",
    model: "MT-300",
    category: "油圧",
    item: "作動油量確認",
    method: "目視確認",
    criteria: "タンクのレベルゲージで適正範囲内",
  },
];

export default function InspectionItems() {
  // 状態管理
  const [manufacturer, setManufacturer] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState<InspectionItem | null>(null);
  const [newItem, setNewItem] = useState({
    category: "",
    item: "",
    method: "",
    criteria: "",
    measurementRecord: "", // Added fields for optional records
    diagramRecord: ""
  });

  // CSVデータ読み込み用の状態
  const [csvData, setCsvData] = useState<InspectionItem[]>([]);
  const [filterManufacturer, setFilterManufacturer] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");
  const [availableFiles, setAvailableFiles] = useState<{name: string, modified: string}[]>([]);
  const [currentFileName, setCurrentFileName] = useState("仕業点検マスタ.csv");

  const { toast } = useToast();

  // 利用可能なCSVファイル一覧を取得
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        const response = await fetch('/api/inspection-files');
        const data = await response.json();

        if (data.files && Array.isArray(data.files)) {
          const fileList = data.files.map(file => ({
            name: file.name,
            modified: new Date(file.modified).toLocaleString()
          }));

          setAvailableFiles(fileList);

          // 初期ファイルが存在するか確認
          if (!fileList.some(f => f.name === "仕業点検マスタ.csv")) {
            if (fileList.length > 0) {
              setCurrentFileName(fileList[0].name);
            }
          }
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
      try {
        const response = await fetch(`/api/inspection-items?file=${currentFileName}&t=${new Date().getTime()}`);

        if (!response.ok) {
          throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim() === '') {
          throw new Error('データが空です');
        }

        // CSVパース処理
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');

        // CSVから点検項目データを変換
        const items: InspectionItem[] = [];
        let nextId = 1;

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',');
          const item: any = {};

          for (let j = 0; j < headers.length; j++) {
            item[headers[j].trim()] = values[j]?.trim() || '';
          }

          // CSVのデータ構造を点検項目の構造に変換
          const inspectionItem: InspectionItem = {
            id: nextId++,
            manufacturer: item['製造メーカー'] || '',
            model: item['機種'] || '',
            category: item['部位'] || '',
            item: item['確認箇所'] || '',
            method: item['確認要領'] || '',
            criteria: item['判断基準'] || '',
            measurementRecord: item['測定等記録'] || '', // Added fields
            diagramRecord: item['図形記録'] || ''      // Added fields
          };

          items.push(inspectionItem);
        }

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
        // エラー時はサンプルデータを表示
        setInspectionItems(sampleInspectionItems);
      }
    };

    fetchInspectionData();
  }, [currentFileName, toast]);

  // メーカーと機種でフィルタリング
  useEffect(() => {
    if (manufacturer && model) {
      const filtered = inspectionItems.filter(
        (item) => 
          item.manufacturer === manufacturer && 
          item.model === model
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  }, [manufacturer, model, inspectionItems]);

  // フィルター用の機種リスト
  const getFilteredModels = () => {
    const uniqueModels = [...new Set(
      inspectionItems
        .filter(item => !filterManufacturer || filterManufacturer === "all" || item.manufacturer === filterManufacturer)
        .map(item => item.model)
    )];
    return uniqueModels;
  };

  // 点検項目の追加ダイアログを開く
  const openAddDialog = () => {
    setIsEditMode(false);
    setCurrentItem(null);
    setNewItem({
      category: "",
      item: "",
      method: "",
      criteria: "",
      measurementRecord: "", // Added fields
      diagramRecord: ""      // Added fields
    });
    setIsDialogOpen(true);
  };

  // 点検項目の編集ダイアログを開く
  const openEditDialog = (item: InspectionItem) => {
    setIsEditMode(true);
    setCurrentItem(item);
    setNewItem({
      category: item.category,
      item: item.item,
      method: item.method,
      criteria: item.criteria,
      measurementRecord: item.measurementRecord || "", // Added fields
      diagramRecord: item.diagramRecord || ""       // Added fields
    });
    setIsDialogOpen(true);
  };

  // 点検項目を追加または更新する
  const addInspectionItem = () => {
    if (
      !manufacturer ||
      !model ||
      !newItem.category ||
      !newItem.item ||
      !newItem.method ||
      !newItem.criteria
    ) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
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
              item: newItem.item || "",
              method: newItem.method || "",
              criteria: newItem.criteria || "",
              measurementRecord: newItem.measurementRecord || "", // Added fields
              diagramRecord: newItem.diagramRecord || ""       // Added fields
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
        item: newItem.item || "",
        method: newItem.method || "",
        criteria: newItem.criteria || "",
        measurementRecord: newItem.measurementRecord || "", // Added fields
        diagramRecord: newItem.diagramRecord || ""       // Added fields
      };
      setInspectionItems([...inspectionItems, newInspectionItem]);
      toast({
        title: "追加完了",
        description: "新しい点検項目を追加しました",
      });
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

  // 変更を保存する
  const saveChanges = async () => {
    try {
      // 現在の点検項目データをCSV形式に変換
      const headers = ['製造メーカー', '機種', '部位', '確認箇所', '確認要領', '判断基準', '測定等記録', '図形記録']; // Added columns
      const csvRows = [headers.join(',')];

      inspectionItems.forEach(item => {
        const row = [
          item.manufacturer,
          item.model,
          item.category,
          item.item,
          item.method,
          item.criteria,
          item.measurementRecord,  // Added columns
          item.diagramRecord       // Added columns
        ].map(val => `${val}`).join(',');
        csvRows.push(row);
      });

      const csvContent = csvRows.join('\n');

      // 保存するファイル名
      const saveFileName = `仕業点検_${new Date().toISOString().slice(0, 10)}.csv`;

      // APIを呼び出して変更を保存する処理
      const response = await fetch('/api/save-inspection-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: saveFileName,
          content: csvContent
        }),
      });

      if (!response.ok) {
        throw new Error(`保存に失敗しました: ${response.status} ${response.statusText}`);
      }

      // ファイル一覧を更新
      const filesResponse = await fetch('/api/inspection-files');
      const data = await filesResponse.json();
      if (data.files && Array.isArray(data.files)) {
        const fileList = data.files.map(file => ({
          name: file.name,
          modified: new Date(file.modified).toLocaleString()
        }));
        setAvailableFiles(fileList);
        setCurrentFileName(saveFileName);
      }

      toast({
        title: "保存完了",
        description: `変更内容を ${saveFileName} に保存しました`,
      });
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "保存エラー",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  // CSVファイルを読み込む関数
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',');

          console.log("CSVデータの最初の行:", lines[0]);
          console.log("データのキー:", headers);

          // CSVから点検項目データを変換
          const items: InspectionItem[] = [];
          let nextId = inspectionItems.length > 0
            ? Math.max(...inspectionItems.map(item => item.id)) + 1
            : 1;

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',');
            const item: any = {};

            for (let j = 0; j < headers.length; j++) {
              item[headers[j]] = values[j];
            }

            // CSVのデータ構造を点検項目の構造に変換
            const inspectionItem: InspectionItem = {
              id: nextId++,
              manufacturer: item['製造メーカー'] || '',
              model: item['機種'] || '',
              category: item['部位'] || '',
              item: item['確認箇所'] || '',
              method: item['確認要領'] || '',
              criteria: item['判断基準'] || '',
              measurementRecord: item['測定等記録'] || '', // Added fields
              diagramRecord: item['図形記録'] || ''      // Added fields
            };

            items.push(inspectionItem);
          }

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">点検項目マスタ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ファイル選択とフィルター */}
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

            {/* 新規CSVファイル選択 */}
            <div className="flex-1 min-w-[300px]">
              <Label htmlFor="csv-file" className="mb-2 block">新規CSVファイル</Label>
              <div className="flex gap-2">
                <Input 
                  id="csv-file"
                  type="file" 
                  accept=".csv" 
                  onChange={handleCSVUpload} 
                />
                <Button 
                  onClick={importCSVData} 
                  disabled={csvData.length === 0}
                  size="sm"
                >
                  インポート
                </Button>
              </div>
            </div>

            {/* メーカーフィルター */}
            <div className="w-[200px]">
              <Label htmlFor="filter-manufacturer" className="mb-2 block">メーカー選択</Label>
              <Select
                value={filterManufacturer}
                onValueChange={(value) => {
                  setFilterManufacturer(value);
                  setFilterModel("all");
                }}
              >
                <SelectTrigger id="filter-manufacturer">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {[...new Set(inspectionItems.map(item => item.manufacturer))]
                    .filter(mfr => mfr && mfr.trim() !== "")
                    .map(mfr => (
                      <SelectItem key={mfr} value={mfr}>
                        {mfr}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 機種フィルター */}
            <div className="w-[200px]">
              <Label htmlFor="filter-model" className="mb-2 block">機種</Label>
              <Select
                value={filterModel}
                onValueChange={setFilterModel}
                disabled={!filterManufacturer}
              >
                <SelectTrigger id="filter-model">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {getFilteredModels().map(mdl => (
                    <SelectItem key={mdl} value={mdl}>
                      {mdl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">メーカー</Label>
              <Select
                value={manufacturer}
                onValueChange={(value) => {
                  setManufacturer(value);
                  setModel("");
                }}
              >
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {sampleManufacturers
                    .filter((mfr) => mfr && mfr.trim() !== "")
                    .map((mfr) => (
                      <SelectItem key={mfr} value={mfr}>
                        {mfr}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">機種</Label>
              <Select
                value={model}
                onValueChange={setModel}
                disabled={!manufacturer}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  {sampleModels
                    .filter((mdl) => mdl && mdl.trim() !== "")
                    .map((mdl) => (
                      <SelectItem key={mdl} value={mdl}>
                        {mdl}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 点検項目一覧と操作ボタン */}
          {manufacturer && model ? (
            <>
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
                    新規追加
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={saveChanges}
                    className="gap-1"
                  >
                    <Save className="h-4 w-4" />
                    レイアウト保存
                  </Button>
                </div>
              </div>

              {/* 点検項目テーブル */}
              {filteredItems.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>カテゴリ</TableHead>
                        <TableHead>点検項目</TableHead>
                        <TableHead>点検方法</TableHead>
                        <TableHead>判定基準</TableHead>
                        <TableHead>測定等記録</TableHead>
                        <TableHead>図形記録</TableHead>
                        <TableHead className="w-[100px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.item}</TableCell>
                          <TableCell>{item.method}</TableCell>
                          <TableCell>{item.criteria}</TableCell>
                          <TableCell>{item.measurementRecord}</TableCell>
                          <TableCell>{item.diagramRecord}</TableCell>
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
                                onClick={() => deleteInspectionItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
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
            </>
          ) : (
            <div className="flex justify-center items-center p-12 border rounded-md">
              <p className="text-muted-foreground">
                メーカーと機種を選択して点検項目を表示します。
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
              <Label htmlFor="category">カテゴリ</Label>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={addInspectionItem}>
              {isEditMode ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}