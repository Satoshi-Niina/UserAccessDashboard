
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem,
  SelectGroup 
} from "@/components/ui/select";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { useLocation } from "wouter";

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
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    const fetchInspectionFiles = async () => {
      try {
        const response = await fetch('/api/inspection-files');
        const files = await response.json();
        
        // CSVファイルだけをフィルタリング
        const csvFiles = files.filter(file => file.name.endsWith('.csv'));
        setAvailableFiles(csvFiles);
        
        if (csvFiles.length > 0) {
          setSelectedFile(csvFiles[0].name);
        }
      } catch (error) {
        console.error('ファイル一覧取得エラー:', error);
        toast({
          title: "エラー",
          description: "ファイル一覧の取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchInspectionFiles();
  }, [toast]);

  useEffect(() => {
    const fetchInspectionItems = async () => {
      if (!selectedFile) return;

      setLoading(true);
      try {
        const url = selectedFile 
          ? `/api/inspection-items?file=${encodeURIComponent(selectedFile)}` 
          : '/api/inspection-items?useLatest=true';

        const response = await fetch(url);
        const data = await response.json();

        const items = data.map((item, index) => ({
          id: index + 1,
          category: item.部位 || item.category || '',
          equipment: item.装置 || item.equipment || '',
          item: item.確認箇所 || item.item || '',
          criteria: item.判断基準 || item.criteria || '',
          method: item.確認要領 || item.method || '',
          measurementRecord: item.測定等記録 || item.measurementRecord || '',
          diagramRecord: item.図形記録 || item.diagramRecord || '',
          manufacturer: item.製造メーカー || item.manufacturer || '',
          model: item.機種 || item.model || '',
          engineType: item.エンジン型式 || item.engineType || ''
        }));

        setInspectionItems(items);
        setFilteredItems(items);
        setLoading(false);
      } catch (error) {
        console.error('点検項目取得エラー:', error);
        toast({
          title: "エラー",
          description: "点検項目の取得に失敗しました",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, [selectedFile, toast]);

  // 装置・部位・メーカー・機種でフィルタリング
  useEffect(() => {
    let filtered = inspectionItems;

    if (selectedEquipment && selectedEquipment !== "all") {
      filtered = filtered.filter(item => item.equipment === selectedEquipment);
    }

    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedManufacturer && selectedManufacturer !== "all") {
      filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
    }

    if (selectedModel && selectedModel !== "all") {
      filtered = filtered.filter(item => item.model === selectedModel);
    }

    setFilteredItems(filtered);
  }, [selectedEquipment, selectedCategory, selectedManufacturer, selectedModel, inspectionItems]);

  // 装置リストの作成（重複なし）
  const uniqueEquipments = Array.from(new Set(inspectionItems.map(item => item.equipment))).filter(equipment => equipment && equipment.trim() !== '').sort();

  // 部位リストの作成（重複なし）
  const uniqueCategories = Array.from(new Set(inspectionItems.map(item => item.category))).filter(category => category && category.trim() !== '').sort();

  // メーカーリストの作成（重複なし）
  const uniqueManufacturers = Array.from(new Set(inspectionItems.map(item => item.manufacturer))).filter(manufacturer => manufacturer && manufacturer.trim() !== '').sort();

  // 機種リストの作成（重複なし）
  const uniqueModels = Array.from(new Set(inspectionItems.map(item => item.model))).filter(model => model && model.trim() !== '').sort();

  return (
    <SidebarProvider isExpanded={isMenuExpanded} setIsExpanded={setIsMenuExpanded}>
      <div className="container py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">基準値設定</h1>
          <Button
            variant="outline"
            onClick={() => navigate("/settings")}
            className="flex items-center gap-1"
          >
            <ChevronLeftIcon /> 戻る
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="file-select">基準値ファイル選択</Label>
                <Select
                  value={selectedFile}
                  onValueChange={setSelectedFile}
                >
                  <SelectTrigger id="file-select">
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

              <div className="space-y-2">
                <Label htmlFor="manufacturer-select">製造メーカー</Label>
                <Select
                  value={selectedManufacturer}
                  onValueChange={setSelectedManufacturer}
                >
                  <SelectTrigger id="manufacturer-select">
                    <SelectValue placeholder="メーカーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">すべて表示</SelectItem>
                      {uniqueManufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer} value={manufacturer}>
                          {manufacturer}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-select">機種</Label>
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                >
                  <SelectTrigger id="model-select">
                    <SelectValue placeholder="機種を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">すべて表示</SelectItem>
                      {uniqueModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment-select">装置</Label>
                <Select
                  value={selectedEquipment}
                  onValueChange={setSelectedEquipment}
                >
                  <SelectTrigger id="equipment-select">
                    <SelectValue placeholder="装置を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">すべて表示</SelectItem>
                      {uniqueEquipments.map((equipment) => (
                        <SelectItem key={equipment} value={equipment}>
                          {equipment}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-select">部位</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger id="category-select">
                    <SelectValue placeholder="部位を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">すべて表示</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p>データを読み込み中...</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>部位</TableHead>
                    <TableHead>装置</TableHead>
                    <TableHead>メーカー</TableHead>
                    <TableHead>機種</TableHead>
                    <TableHead>確認箇所</TableHead>
                    <TableHead>判断基準</TableHead>
                    <TableHead>測定基準値</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.equipment}</TableCell>
                        <TableCell>{item.manufacturer}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.criteria}</TableCell>
                        <TableCell>{item.measurementRecord}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        表示するデータがありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarProvider>
  );
}
