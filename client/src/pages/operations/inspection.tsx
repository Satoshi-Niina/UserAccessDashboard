import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ExitButton } from '@/components/layout/exit-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Save, FileText } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import Label from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';


interface InspectionItem {
  id: string;
  manufacturer: string;
  modelType: string;
  engineType: string;
  part: string;
  device: string;
  procedure: string;
  checkPoint: string;
  judgmentCriteria: string;
  checkMethod: string;
  measurement: string;
  graphicRecord: string;
  order: number;
  result?: string; // 点検結果
}

export default function Inspection() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('すべて');
  const [selectedModelType, setSelectedModelType] = useState<string>('すべて');
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CSVデータのパース関数
  const parseCSVData = (csv: string): InspectionItem[] => {
    console.log("CSVデータをパース中...", csv.substring(0, 100)); // 最初の100文字だけログ出力
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    // ヘッダーとフィールドのマッピング
    const headerMap: Record<string, string> = {
      '製造メーカー': 'manufacturer',
      '機種': 'modelType',
      'エンジン型式': 'engineType',
      '部位': 'part',
      '装置': 'device',
      '手順': 'procedure',
      '確認箇所': 'checkPoint',
      '判断基準': 'judgmentCriteria',
      '確認要領': 'checkMethod',
      '測定等記録': 'measurement',
      '図形記録': 'graphicRecord',
    };

    return lines.slice(1).filter(line => line.trim()).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const item: any = { id: `item-${index + 1}`, order: index + 1 };

      headers.forEach((header, i) => {
        const field = headerMap[header] || header;
        item[field] = values[i] || '';
      });

      return item as InspectionItem;
    });
  };

  // 初期データの読み込み
  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        setLoading(true);
        console.log("点検データ取得中...");
        const response = await fetch('/api/inspection-items');

        if (!response.ok) {
          throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        console.log(`APIからデータを取得しました (${text.length} バイト)`);

        if (text && text.length > 0) {
          const parsedItems = parseCSVData(text);
          console.log(`${parsedItems.length}件のアイテムをパースしました`);
          setItems(parsedItems);

          // メーカーと機種の一覧を抽出
          const uniqueManufacturers = Array.from(new Set(parsedItems.map(item => item.manufacturer))).filter(Boolean);
          const uniqueModelTypes = Array.from(new Set(parsedItems.map(item => item.modelType))).filter(Boolean);

          setManufacturers(uniqueManufacturers);
          setModelTypes(uniqueModelTypes);

          // 初期表示用にフィルタリング
          setFilteredItems(parsedItems);
        } else {
          console.error("空のレスポンスを受け取りました");
          setError("データが空です");
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
        setError(error instanceof Error ? error.message : "不明なエラーが発生しました");
        // エラー時にはデフォルトのサンプルデータを表示する
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionData();
  }, []);

  // フィルタリング
  useEffect(() => {
    if (items.length > 0) {
      let filtered = [...items];

      if (selectedManufacturer !== 'すべて') {
        filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
      }

      if (selectedModelType !== 'すべて') {
        filtered = filtered.filter(item => item.modelType === selectedModelType);
      }

      setFilteredItems(filtered);
    }
  }, [selectedManufacturer, selectedModelType, items]);

  // 点検結果の変更
  const handleResultChange = (itemId: string, result: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, result } : item
    );
    setItems(updatedItems);
    setHasChanges(true);
  };

  // 保存処理
  const saveInspection = () => {
    // 実際にはAPIでデータを保存
    toast({
      title: "保存完了",
      description: "点検結果が保存されました",
    });
    setHasChanges(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="メーカーを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="すべて">すべてのメーカー</SelectItem>
              {manufacturers.map((manufacturer) => (
                <SelectItem key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedModelType} onValueChange={setSelectedModelType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="機種を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="すべて">すべての機種</SelectItem>
              {modelTypes.map((modelType) => (
                <SelectItem key={modelType} value={modelType}>
                  {modelType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={saveInspection}
          disabled={!hasChanges}
          variant={hasChanges ? "default" : "outline"}
        >
          保存
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">データを読み込み中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">エラー: {error}</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8">該当する点検項目がありません</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>仕業点検項目</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>仕業点検項目一覧</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>製造メーカー</TableHead>
                  <TableHead>機種</TableHead>
                  <TableHead>部位</TableHead>
                  <TableHead>装置</TableHead>
                  <TableHead>確認箇所</TableHead>
                  <TableHead>判断基準</TableHead>
                  <TableHead>確認要領</TableHead>
                  <TableHead>結果</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.manufacturer}</TableCell>
                    <TableCell>{item.modelType}</TableCell>
                    <TableCell>{item.part}</TableCell>
                    <TableCell>{item.device}</TableCell>
                    <TableCell>{item.checkPoint}</TableCell>
                    <TableCell>{item.judgmentCriteria}</TableCell>
                    <TableCell>{item.checkMethod}</TableCell>
                    <TableCell>
                      <Select
                        value={item.result || '未点検'}
                        onValueChange={(value) => handleResultChange(item.id, value)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="結果" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="未点検">未点検</SelectItem>
                          <SelectItem value="良">良</SelectItem>
                          <SelectItem value="否">否</SelectItem>
                          <SelectItem value="NA">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}