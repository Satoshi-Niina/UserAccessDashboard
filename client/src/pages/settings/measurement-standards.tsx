import { useState, useEffect } from "react";
import { ArrowLeft, Save, FileDown } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// 点検項目の型定義
interface InspectionItem {
  id: number;
  category: string;          // 部位
  equipment: string;         // 装置
  item: string;              // 確認箇所
  criteria: string;          // 判断基準
  method: string;            // 確認要領 (非表示)
  measurementRecord: string; // 測定基準値 (元: 測定等記録)
  diagramRecord: string;     // 図形記録 (非表示)
  manufacturer?: string;     // 製造メーカー
  model?: string;            // 機種
  engineType?: string;       // エンジン型式
  minValue?: string;         // 基準値（最小値）
  maxValue?: string;         // 基準値（最大値）
}


  export default function MeasurementStandards() {
  useEffect(() => {
    async function loadCSVs() {
      const [itemsRes, makersRes, modelsRes] = await Promise.all([
        fetch("/attached_assets/inspection/table/inspection_items.csv"),
        fetch("/attached_assets/inspection/table/manufacturers.csv"),
        fetch("/attached_assets/inspection/table/models.csv")
      ]);

      const [itemsCSV, makersCSV, modelsCSV] = await Promise.all([
        itemsRes.text(),
        makersRes.text(),
        modelsRes.text()
      ]);

      const items = Papa.parse(itemsCSV, { header: true }).data;
      setInspectionItems(items);
    }
    loadCSVs();
  }, []);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false); // 最小化状態に変更
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [availableFiles, setAvailableFiles] = useState<{name: string, modified: string}[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");
  const { toast } = useToast();

  // 基準値入力用の状態
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // ファイル一覧を取得
  useEffect(() => {
    fetch("/api/inspection-files")
      .then(response => response.json())
      .then(data => {
        // CSVファイルのみをフィルタリング
        const csvFiles = data.filter((file: {name: string}) => 
          file.name.endsWith('.csv') && file.name.includes('仕業点検マスタ')
        );
        setAvailableFiles(csvFiles);

        // デフォルトの選択ファイルを設定（最新のファイル）
        if (csvFiles.length > 0) {
          setSelectedFile(csvFiles[0].name);
        }
      })
      .catch(error => {
        console.error("ファイル一覧の取得に失敗:", error);
        toast({
          title: "エラー",
          description: "ファイル一覧の取得に失敗しました",
          variant: "destructive",
        });
      });
  }, []);

  // 選択されたファイルから点検項目を読み込む
  useEffect(() => {
    if (selectedFile) {
      setLoading(true);

      fetch(`/api/inspection-items?file=${selectedFile}`)
        .then(response => response.json())
        .then(data => {
          // データ形式の変換
          const items = data.map((item: any, index: number) => ({
            id: index + 1,
            manufacturer: item.製造メーカー || item.manufacturer || "",
            model: item.機種 || item.model || "",
            engineType: item.エンジン型式 || item.engineType || "",
            category: item.部位 || item.category || "",
            equipment: item.装置 || item.equipment || "",
            item: item.確認箇所 || item.item || "",
            criteria: item.判断基準 || item.criteria || "",
            method: item.確認要領 || item.method || "",
            measurementRecord: item.測定等記録 || item.measurementRecord || item.測定基準値 || "",
            diagramRecord: item.図形記録 || item.diagramRecord || "",
            minValue: item.最小値 || item.minValue || "",
            maxValue: item.最大値 || item.maxValue || ""
          }));

          setInspectionItems(items);
          setLoading(false);
        })
        .catch(error => {
          console.error("点検項目の取得に失敗:", error);
          toast({
            title: "エラー",
            description: "点検項目の取得に失敗しました",
            variant: "destructive",
          });
          setLoading(false);
        });
    }
  }, [selectedFile]);

  // フィルタリング処理を更新
  useEffect(() => {
    let filtered = [...inspectionItems];

    if (selectedManufacturer !== "all") {
      filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
    }
    if (selectedModel !== "all") {
      filtered = filtered.filter(item => item.model === selectedModel);
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    if (selectedEquipment !== "all") {
      filtered = filtered.filter(item => item.equipment === selectedEquipment);
    }

    setFilteredItems(filtered);
  }, [inspectionItems, selectedManufacturer, selectedModel, selectedCategory, selectedEquipment]);

  // 基準値を編集するダイアログを開く
  const openEditDialog = (item: InspectionItem) => {
    setEditingItemId(item.id);
    setMinValue(item.minValue || "");
    setMaxValue(item.maxValue || "");
    setIsEditDialogOpen(true);
  };

  // 基準値を保存する
  const saveStandardValues = async () => {
    if (editingItemId === null) return;

    const updatedItems = inspectionItems.map(item => {
      if (item.id === editingItemId) {
        return {
          ...item,
          minValue,
          maxValue
        };
      }
      return item;
    });

    try {
      const response = await fetch('/api/measurement-standards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          standard: updatedItems.find(item => item.id === editingItemId)
        }),
      });

      if (!response.ok) {
        throw new Error('基準値の保存に失敗しました');
      }

      setInspectionItems(updatedItems);
      setIsEditDialogOpen(false);

      toast({
        title: "基準値を更新しました",
        description: "項目の基準値が更新されました",
      });
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "エラー",
        description: "基準値の保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  // 基準値テーブルに保存する
  const saveToStandardsTable = () => {
    setIsSaveDialogOpen(true);
    // デフォルトのファイル名を設定
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    setSaveFileName(`測定基準値_${dateStr}.csv`);
  };

  // ファイルに保存する処理
  const saveToFile = () => {
    // 保存対象のデータを準備（基準値が入力されている項目のみ）
    const dataToSave = inspectionItems.filter(item => item.minValue || item.maxValue).map(item => ({
      manufacturer: item.manufacturer || "",
      model: item.model || "",
      engineType: item.engineType || "",
      category: item.category || "",
      equipment: item.equipment || "",
      item: item.item || "",
      criteria: item.criteria || "",
      measurementRecord: item.measurementRecord || "",
      minValue: item.minValue || "",
      maxValue: item.maxValue || ""
    }));

    if (dataToSave.length === 0) {
      toast({
        title: "保存するデータがありません",
        description: "基準値が入力されている項目がありません",
        variant: "destructive",
      });
      setIsSaveDialogOpen(false);
      return;
    }

    // APIを呼び出してデータを保存
    fetch('/api/save-inspection-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceFileName: selectedFile,
        data: dataToSave,
        fileName: saveFileName,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('データの保存に失敗しました');
        }
        return response.json();
      })
      .then(data => {
        toast({
          title: "保存完了",
          description: `基準値が ${data.fileName} に保存されました`,
        });
        setIsSaveDialogOpen(false);
      })
      .catch(error => {
        console.error('保存エラー:', error);
        toast({
          title: "保存エラー",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  // ユニークなメーカー、機種、部位、装置のリストを生成
  const uniqueManufacturers = Array.from(new Set(inspectionItems.map(item => item.manufacturer))).filter(manufacturer => manufacturer && manufacturer.trim() !== '').sort();
  const uniqueModels = Array.from(new Set(inspectionItems.map(item => item.model))).filter(model => model && model.trim() !== '').sort();
  const uniqueCategories = Array.from(new Set(inspectionItems.map(item => item.category))).filter(category => category && category.trim() !== '').sort();
  const uniqueEquipments = Array.from(new Set(inspectionItems.map(item => item.equipment))).filter(equipment => equipment && equipment.trim() !== '').sort();

  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const response = await fetch('/api/measurement-standards');
        const data = await response.json();
        if (data.standards) {
          setInspectionItems(data.standards.map((item: any, index: number) => ({
            ...item,
            id: index + 1
          })));
        }
      } catch (error) {
        console.error('基準値データ取得エラー:', error);
      }
    };

    fetchStandards();
  }, []);

  return (
    <div className={isMenuExpanded ? "" : "sidebar-collapsed"}>
      <div className="container py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">基準値設定</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
            </Button>
            <Button onClick={saveToStandardsTable}>
              <Save className="mr-2 h-4 w-4" /> 基準値保存
            </Button>
          </div>
        </div>

        {/* フィルターと設定 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>フィルターと設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
<div className="space-y-2">
  <Label htmlFor="csvImport">CSVインポート</Label>
  <div className="flex gap-2">
    <Input id="csvImport" type="file" accept=".csv" onChange={(e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === "string") {
          const parsed = Papa.parse(text, { header: true }).data;
          setInspectionItems(parsed);
        }
      };
      reader.readAsText(file);
    }} />
    <Button onClick={() => toast({ title: "インポート完了", description: "CSVを読み込みました" })}>
      インポート
    </Button>
  </div>
</div>

              {/* ファイル選択 */}


              {/* メーカー選択 */}
              <div className="space-y-2">
                <Label htmlFor="manufacturerSelect">メーカー</Label>
                <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                  <SelectTrigger id="manufacturerSelect">
                    <SelectValue placeholder="メーカーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">すべて</SelectItem>
                      {uniqueManufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer} value={manufacturer}>
                          {manufacturer}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* 機種選択 */}
              <div className="space-y-2">
                <Label htmlFor="modelSelect">機種</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="modelSelect">
                    <SelectValue placeholder="機種を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">すべて</SelectItem>
                      {uniqueModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* 部位選択 */}
              <div className="space-y-2">
                <Label htmlFor="categorySelect">部位</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="categorySelect">
                    <SelectValue placeholder="部位を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">すべて</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* 装置選択 */}
              <div className="space-y-2">
                <Label htmlFor="equipmentSelect">装置</Label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger id="equipmentSelect">
                    <SelectValue placeholder="装置を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">すべて</SelectItem>
                      {uniqueEquipments.map((equipment) => (
                        <SelectItem key={equipment} value={equipment}>
                          {equipment}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 点検項目テーブル */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div>
            <p className="mt-2">読み込み中...</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>基準値一覧 ({filteredItems.length}件)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>メーカー</TableHead>
                    <TableHead>機種</TableHead>
                    <TableHead>部位</TableHead>
                    <TableHead>装置</TableHead>
                    <TableHead>確認箇所</TableHead>
                    <TableHead>判断基準</TableHead>
                    <TableHead>測定基準値</TableHead>
                    <TableHead>最小値</TableHead>
                    <TableHead>最大値</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
                        データがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.manufacturer}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.equipment}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.criteria}</TableCell>
                        <TableCell>{item.measurementRecord}</TableCell>
                        <TableCell>{item.minValue}</TableCell>
                        <TableCell>{item.maxValue}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditDialog(item)}
                          >
                            基準値編集
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 基準値編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>基準値の編集</DialogTitle>
            <DialogDescription>
              この項目の基準値範囲を設定してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="minValue">最小値</Label>
              <Input
                id="minValue"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                placeholder="最小値を入力"
                type="number"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxValue">最大値</Label>
              <Input
                id="maxValue"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                placeholder="最大値を入力"
                type="number"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveStandardValues}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 保存ダイアログ */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>基準値テーブルの保存</DialogTitle>
            <DialogDescription>
              保存するファイル名を入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fileName">ファイル名</Label>
              <Input
                id="fileName"
                value={saveFileName}
                onChange={(e) => setSaveFileName(e.target.value)}
                placeholder="例: 測定基準値_20240101.csv"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveToFile}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}