
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

  // フィルタリングの適用
  useEffect(() => {
    let filtered = inspectionItems;
    
    // メーカー、機種、部位、装置でフィルタリング
    filtered = filtered.filter(
      (item) => 
        (!selectedManufacturer || selectedManufacturer === "all" || item.manufacturer === selectedManufacturer) && 
        (!selectedModel || selectedModel === "all" || item.model === selectedModel) &&
        (!selectedCategory || selectedCategory === "all" || item.category === selectedCategory) &&
        (!selectedEquipment || selectedEquipment === "all" || item.equipment === selectedEquipment)
    );
    
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
  const saveStandardValues = () => {
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

    setInspectionItems(updatedItems);
    setIsEditDialogOpen(false);
    
    toast({
      title: "基準値を更新しました",
      description: "項目の基準値が更新されました",
    });
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
              {/* ファイル選択 */}
              <div className="space-y-2">
                <Label htmlFor="fileSelect">ファイル選択</Label>
                <Select value={selectedFile} onValueChange={setSelectedFile}>
                  <SelectTrigger id="fileSelect">
                    <SelectValue placeholder="ファイルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availableFiles.map((file) => (
                        <SelectItem key={file.name} value={file.name}>
                          {file.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

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
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Papa from "papaparse";

interface MeasurementStandard {
  id: number;
  manufacturer: string;
  model: string;
  engineType?: string;
  category: string;
  equipment: string;
  item: string;
  minValue: number;
  maxValue: number;
}

export default function MeasurementStandardsPage() {
  const [, navigate] = useLocation();
  const [standards, setStandards] = useState<MeasurementStandard[]>([]);
  const [filteredStandards, setFilteredStandards] = useState<MeasurementStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStandard, setCurrentStandard] = useState<MeasurementStandard | null>(null);
  const [newStandard, setNewStandard] = useState({
    manufacturer: "",
    model: "",
    engineType: "",
    category: "",
    equipment: "",
    item: "",
    minValue: 0,
    maxValue: 0
  });
  const [searchFilter, setSearchFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  // 測定基準値データの読み込み
  useEffect(() => {
    const fetchMeasurementStandards = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/files/測定基準値_20250313.csv');
        
        if (!response.ok) {
          throw new Error('測定基準値の取得に失敗しました');
        }
        
        const csvText = await response.text();
        
        // CSVデータをパース
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const parsedData = results.data.filter((item: any) => 
              item.manufacturer || item['製造メーカー']
            ).map((item: any, index: number) => {
              // フィールド名のマッピング
              const standard: MeasurementStandard = {
                id: index + 1,
                manufacturer: item.manufacturer || item['製造メーカー'] || '',
                model: item.model || item['機種'] || '',
                engineType: item.engineType || item['エンジン型式'] || '',
                category: item.category || item['部位'] || '',
                equipment: item.equipment || item['装置'] || '',
                item: item.item || item['確認箇所'] || '',
                minValue: parseFloat(item.minValue) || 0,
                maxValue: parseFloat(item.maxValue) || 0
              };
              return standard;
            });
            
            setStandards(parsedData);
            setFilteredStandards(parsedData);
            setLoading(false);
          },
          error: (error) => {
            console.error('CSV解析エラー:', error);
            toast({
              title: "エラー",
              description: "データの解析に失敗しました",
              variant: "destructive",
            });
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        toast({
          title: "エラー",
          description: "データの取得に失敗しました",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchMeasurementStandards();
  }, []);

  // フィルタリング
  useEffect(() => {
    let filtered = [...standards];
    
    if (searchFilter) {
      const lowerSearch = searchFilter.toLowerCase();
      filtered = filtered.filter(standard => 
        standard.manufacturer.toLowerCase().includes(lowerSearch) ||
        standard.model.toLowerCase().includes(lowerSearch) ||
        standard.category.toLowerCase().includes(lowerSearch) ||
        standard.equipment.toLowerCase().includes(lowerSearch) ||
        standard.item.toLowerCase().includes(lowerSearch)
      );
    }
    
    if (manufacturerFilter !== "all") {
      filtered = filtered.filter(standard => standard.manufacturer === manufacturerFilter);
    }
    
    if (modelFilter !== "all") {
      filtered = filtered.filter(standard => standard.model === modelFilter);
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(standard => standard.category === categoryFilter);
    }
    
    setFilteredStandards(filtered);
  }, [standards, searchFilter, manufacturerFilter, modelFilter, categoryFilter]);

  // 新しい測定基準値の追加
  const handleAddStandard = () => {
    setIsEditMode(false);
    setCurrentStandard(null);
    setNewStandard({
      manufacturer: "",
      model: "",
      engineType: "",
      category: "",
      equipment: "",
      item: "",
      minValue: 0,
      maxValue: 0
    });
    setIsDialogOpen(true);
  };

  // 測定基準値の編集
  const handleEditStandard = (standard: MeasurementStandard) => {
    setIsEditMode(true);
    setCurrentStandard(standard);
    setNewStandard({
      manufacturer: standard.manufacturer,
      model: standard.model,
      engineType: standard.engineType || "",
      category: standard.category,
      equipment: standard.equipment,
      item: standard.item,
      minValue: standard.minValue,
      maxValue: standard.maxValue
    });
    setIsDialogOpen(true);
  };

  // 測定基準値の保存
  const handleSaveStandard = () => {
    if (!newStandard.manufacturer || !newStandard.model || 
        !newStandard.category || !newStandard.equipment || !newStandard.item) {
      toast({
        title: "エラー",
        description: "必須項目を入力してください",
        variant: "destructive",
      });
      return;
    }
    
    if (newStandard.minValue > newStandard.maxValue) {
      toast({
        title: "エラー",
        description: "最小値は最大値以下にしてください",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditMode && currentStandard) {
      // 編集モード
      const updatedStandards = standards.map(standard => 
        standard.id === currentStandard.id ? 
          { ...standard, 
            manufacturer: newStandard.manufacturer,
            model: newStandard.model,
            engineType: newStandard.engineType,
            category: newStandard.category,
            equipment: newStandard.equipment,
            item: newStandard.item,
            minValue: newStandard.minValue,
            maxValue: newStandard.maxValue
          } : 
          standard
      );
      setStandards(updatedStandards);
    } else {
      // 追加モード
      const maxId = standards.reduce((max, standard) => Math.max(max, standard.id), 0);
      const newId = maxId + 1;
      
      setStandards([
        ...standards,
        {
          id: newId,
          manufacturer: newStandard.manufacturer,
          model: newStandard.model,
          engineType: newStandard.engineType,
          category: newStandard.category,
          equipment: newStandard.equipment,
          item: newStandard.item,
          minValue: newStandard.minValue,
          maxValue: newStandard.maxValue
        }
      ]);
    }
    
    setIsDialogOpen(false);
    
    toast({
      title: isEditMode ? "更新完了" : "追加完了",
      description: `測定基準値を${isEditMode ? '更新' : '追加'}しました`,
    });
  };

  // 測定基準値の削除
  const handleDeleteStandard = (id: number) => {
    if (confirm("この測定基準値を削除してもよろしいですか？")) {
      const updatedStandards = standards.filter(standard => standard.id !== id);
      setStandards(updatedStandards);
      
      toast({
        title: "削除完了",
        description: "測定基準値を削除しました",
      });
    }
  };

  // CSVとして保存
  const handleSaveToCSV = async () => {
    try {
      // 測定基準値をCSV形式に変換
      const csvData = standards.map(standard => ({
        '製造メーカー': standard.manufacturer,
        '機種': standard.model,
        'エンジン型式': standard.engineType || '',
        '部位': standard.category,
        '装置': standard.equipment,
        '確認箇所': standard.item,
        'minValue': standard.minValue,
        'maxValue': standard.maxValue
      }));
      
      // CSVにヘッダー行を追加
      const csv = Papa.unparse(csvData);
      
      // ファイル名を生成
      const timestamp = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15);
      const fileName = `測定基準値_${timestamp}.csv`;
      
      // APIを呼び出してCSVを保存
      const formData = new FormData();
      const blob = new Blob([csv], { type: 'text/csv' });
      formData.append('file', blob, fileName);
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('ファイルの保存に失敗しました');
      }
      
      toast({
        title: "保存完了",
        description: `測定基準値を ${fileName} として保存しました`,
      });
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "エラー",
        description: "ファイルの保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">測定基準値設定</h1>
        <p>データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">測定基準値設定</h1>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          戻る
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>測定基準値の管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">検索</Label>
              <Input
                id="search"
                placeholder="検索..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <select
                id="manufacturer"
                className="w-full p-2 border rounded"
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                {[...new Set(standards.map(item => item.manufacturer))].map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="model">機種</Label>
              <select
                id="model"
                className="w-full p-2 border rounded"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                {[...new Set(standards.map(item => item.model))].map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="category">部位</Label>
              <select
                id="category"
                className="w-full p-2 border rounded"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                {[...new Set(standards.map(item => item.category))].map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button onClick={handleAddStandard}>
              新規追加
            </Button>
            <Button variant="outline" onClick={handleSaveToCSV}>
              CSVに保存
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableCaption>測定基準値一覧 (全 {filteredStandards.length} 件)</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">製造メーカー</TableHead>
                  <TableHead className="w-[100px]">機種</TableHead>
                  <TableHead className="w-[120px]">部位</TableHead>
                  <TableHead className="w-[120px]">装置</TableHead>
                  <TableHead className="w-[150px]">確認箇所</TableHead>
                  <TableHead className="w-[80px]">最小値</TableHead>
                  <TableHead className="w-[80px]">最大値</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStandards.map(standard => (
                  <TableRow key={standard.id}>
                    <TableCell>{standard.manufacturer}</TableCell>
                    <TableCell>{standard.model}</TableCell>
                    <TableCell>{standard.category}</TableCell>
                    <TableCell>{standard.equipment}</TableCell>
                    <TableCell>{standard.item}</TableCell>
                    <TableCell>{standard.minValue}</TableCell>
                    <TableCell>{standard.maxValue}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditStandard(standard)}
                        >
                          編集
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteStandard(standard.id)}
                        >
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* 測定基準値の追加・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "測定基準値の編集" : "新規測定基準値の追加"}
            </DialogTitle>
            <DialogDescription>
              測定基準値の詳細情報を入力してください
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">製造メーカー</Label>
                <Input
                  id="manufacturer"
                  value={newStandard.manufacturer}
                  onChange={(e) => setNewStandard({...newStandard, manufacturer: e.target.value})}
                  placeholder="例: 堀川工機"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">機種</Label>
                <Input
                  id="model"
                  value={newStandard.model}
                  onChange={(e) => setNewStandard({...newStandard, model: e.target.value})}
                  placeholder="例: MC300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="engineType">エンジン型式</Label>
              <Input
                id="engineType"
                value={newStandard.engineType}
                onChange={(e) => setNewStandard({...newStandard, engineType: e.target.value})}
                placeholder="例: ボルボ"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">部位</Label>
                <Input
                  id="category"
                  value={newStandard.category}
                  onChange={(e) => setNewStandard({...newStandard, category: e.target.value})}
                  placeholder="例: 制動装置"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="equipment">装置</Label>
                <Input
                  id="equipment"
                  value={newStandard.equipment}
                  onChange={(e) => setNewStandard({...newStandard, equipment: e.target.value})}
                  placeholder="例: ブレーキシリンダー"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item">確認箇所</Label>
              <Input
                id="item"
                value={newStandard.item}
                onChange={(e) => setNewStandard({...newStandard, item: e.target.value})}
                placeholder="例: ブレーキシリンダー"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minValue">最小値</Label>
                <Input
                  id="minValue"
                  type="number"
                  value={newStandard.minValue}
                  onChange={(e) => setNewStandard({...newStandard, minValue: parseFloat(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxValue">最大値</Label>
                <Input
                  id="maxValue"
                  type="number"
                  value={newStandard.maxValue}
                  onChange={(e) => setNewStandard({...newStandard, maxValue: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveStandard}>
              {isEditMode ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
