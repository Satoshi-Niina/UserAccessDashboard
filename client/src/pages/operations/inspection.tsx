
import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui';
import { Loader2 } from "lucide-react";

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

interface InspectionProps {
  items?: InspectionItem[];
}

export default function Inspection({ items: propItems }: InspectionProps) {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('すべて');
  const [selectedModelType, setSelectedModelType] = useState<string>('すべて');
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CSVデータのパース関数
  const parseCSVData = (csv: string): InspectionItem[] => {
    console.log("CSVデータをパース中...");
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // ヘッダーとフィールドのマッピング
    const fieldMap: Record<string, keyof InspectionItem> = {
      '製造メーカー': 'manufacturer',
      '機種': 'modelType',
      'エンジン型式': 'engineType',
      '部位': 'part',
      '装置': 'device',
      '手順': 'procedure',
      '確認箇所': 'checkPoint',
      '判断基準': 'judgmentCriteria',
      '点検方法': 'checkMethod',
      '測定（記録）': 'measurement',
      '記録簿': 'graphicRecord'
    };

    // 各行のデータをパース
    const parsedItems: InspectionItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // カンマで分割するが、ダブルクォートで囲まれた部分は一つのフィールドとして扱う
      const row = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      const item: Partial<InspectionItem> = { id: `item-${i}`, order: i };
      
      // 各列のデータを適切なフィールドにマッピング
      headers.forEach((header, index) => {
        if (index >= row.length) return;
        
        const field = fieldMap[header];
        if (field) {
          let value = row[index];
          // ダブルクォートを削除
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          (item as any)[field] = value.trim();
        }
      });
      
      parsedItems.push(item as InspectionItem);
    }
    
    console.log(`パース完了: ${parsedItems.length}件のデータを読み込みました`);
    return parsedItems;
  };

  // 点検データを読み込む
  const fetchInspectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("点検データを取得中...");
      const response = await fetch('/api/inspection-items');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("点検データの取得に失敗:", errorText);
        setError(`データの取得に失敗しました: ${response.status} ${response.statusText}`);
        return;
      }
      
      const csvData = await response.text();
      console.log(`CSVデータ取得成功: ${csvData.length} バイト`);

      if (csvData && csvData.length > 0) {
        // CSVデータをパース
        const parsedItems = parseCSVData(csvData);
        setItems(parsedItems);
        
        // メーカーと機種のリストを作成
        const uniqueManufacturers = Array.from(new Set(parsedItems.map(item => item.manufacturer))).filter(Boolean);
        const uniqueModelTypes = Array.from(new Set(parsedItems.map(item => item.modelType))).filter(Boolean);
        
        setManufacturers(['すべて', ...uniqueManufacturers]);
        setModelTypes(['すべて', ...uniqueModelTypes]);
        setFilteredItems(parsedItems);
      } else {
        console.error("空のCSVデータを受信しました");
        setError("データが空です");
      }
    } catch (err) {
      console.error("点検データの取得中にエラーが発生しました:", err);
      setError("データの読み込み中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントのマウント時に点検データを読み込む
  useEffect(() => {
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
              <SelectValue placeholder="製造メーカー" />
            </SelectTrigger>
            <SelectContent>
              {manufacturers.map((manufacturer) => (
                <SelectItem key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedModelType} onValueChange={setSelectedModelType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="機種" />
            </SelectTrigger>
            <SelectContent>
              {modelTypes.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={saveInspection} 
          disabled={!hasChanges || loading}
          className="ml-auto"
        >
          保存
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          <span className="ml-3 text-lg text-gray-600">データを読み込み中...</span>
        </div>
      ) : error ? (
        <div className="text-center p-6 border border-red-200 bg-red-50 text-red-800 rounded-md">
          <p className="text-lg font-semibold">エラーが発生しました</p>
          <p>{error}</p>
          <Button onClick={fetchInspectionData} variant="outline" className="mt-4">
            再読み込み
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center p-6 border border-gray-200 bg-gray-50 rounded-md">
          表示するデータがありません
        </div>
      ) : (
        <Table>
          <TableCaption>点検項目 ({filteredItems.length}件)</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>製造メーカー</TableHead>
              <TableHead>機種</TableHead>
              <TableHead>エンジン型式</TableHead>
              <TableHead>部位</TableHead>
              <TableHead>装置</TableHead>
              <TableHead>確認箇所</TableHead>
              <TableHead>判断基準</TableHead>
              <TableHead>点検結果</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.manufacturer}</TableCell>
                <TableCell>{item.modelType}</TableCell>
                <TableCell>{item.engineType}</TableCell>
                <TableCell>{item.part}</TableCell>
                <TableCell>{item.device}</TableCell>
                <TableCell>{item.checkPoint}</TableCell>
                <TableCell>{item.judgmentCriteria}</TableCell>
                <TableCell>
                  <Select
                    value={item.result || ''}
                    onValueChange={(value) => handleResultChange(item.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">選択</SelectItem>
                      <SelectItem value="正常">正常</SelectItem>
                      <SelectItem value="要点検">要点検</SelectItem>
                      <SelectItem value="異常">異常</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
