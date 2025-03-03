
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
      '確認方法': 'checkMethod',
      '測定': 'measurement',
      '記録': 'graphicRecord',
      '順序': 'order'
    };

    // 各行をオブジェクトに変換
    const parsedItems: InspectionItem[] = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const item: Partial<InspectionItem> = { id: `item-${index}` };
      
      headers.forEach((header, i) => {
        const field = fieldMap[header];
        if (field && values[i] !== undefined) {
          if (field === 'order' && !isNaN(Number(values[i]))) {
            (item as any)[field] = Number(values[i]);
          } else {
            (item as any)[field] = values[i];
          }
        }
      });
      
      return item as InspectionItem;
    });
    
    console.log(`${parsedItems.length}件のデータをパースしました`);
    return parsedItems;
  };

  // CSVデータの取得
  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        setLoading(true);
        console.log("APIからデータを取得中...");
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
          // サンプルデータを使用
          const sampleItems: InspectionItem[] = [
            { id: "1", manufacturer: "メーカーA", modelType: "機種X", engineType: "エンジン1", part: "エンジン", device: "冷却装置", procedure: "点検手順1", checkPoint: "冷却水レベル", judgmentCriteria: "MIN以上MAX以下", checkMethod: "目視", measurement: "", graphicRecord: "", order: 1 },
            { id: "2", manufacturer: "メーカーA", modelType: "機種X", engineType: "エンジン1", part: "電気系統", device: "バッテリー", procedure: "点検手順2", checkPoint: "端子の状態", judgmentCriteria: "腐食なし", checkMethod: "目視", measurement: "", graphicRecord: "", order: 2 },
            { id: "3", manufacturer: "メーカーB", modelType: "機種Y", engineType: "エンジン2", part: "油圧系統", device: "オイルタンク", procedure: "点検手順3", checkPoint: "オイルレベル", judgmentCriteria: "規定値内", checkMethod: "目視", measurement: "", graphicRecord: "", order: 1 }
          ];
          setItems(sampleItems);
          setManufacturers(Array.from(new Set(sampleItems.map(item => item.manufacturer))));
          setModelTypes(Array.from(new Set(sampleItems.map(item => item.modelType))));
          setFilteredItems(sampleItems);
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
        setError(error instanceof Error ? error.message : "不明なエラーが発生しました");
        // エラー時にサンプルデータを表示
        const sampleItems: InspectionItem[] = [
          { id: "1", manufacturer: "メーカーA", modelType: "機種X", engineType: "エンジン1", part: "エンジン", device: "冷却装置", procedure: "点検手順1", checkPoint: "冷却水レベル", judgmentCriteria: "MIN以上MAX以下", checkMethod: "目視", measurement: "", graphicRecord: "", order: 1 },
          { id: "2", manufacturer: "メーカーA", modelType: "機種X", engineType: "エンジン1", part: "電気系統", device: "バッテリー", procedure: "点検手順2", checkPoint: "端子の状態", judgmentCriteria: "腐食なし", checkMethod: "目視", measurement: "", graphicRecord: "", order: 2 },
          { id: "3", manufacturer: "メーカーB", modelType: "機種Y", engineType: "エンジン2", part: "油圧系統", device: "オイルタンク", procedure: "点検手順3", checkPoint: "オイルレベル", judgmentCriteria: "規定値内", checkMethod: "目視", measurement: "", graphicRecord: "", order: 1 }
        ];
        setItems(sampleItems);
        setManufacturers(Array.from(new Set(sampleItems.map(item => item.manufacturer))));
        setModelTypes(Array.from(new Set(sampleItems.map(item => item.modelType))));
        setFilteredItems(sampleItems);
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
              {modelTypes.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasChanges && (
          <Button onClick={saveInspection}>保存</Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10">データを読み込み中...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableCaption>仕業点検項目リスト</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>部位</TableHead>
                <TableHead>装置</TableHead>
                <TableHead>確認箇所</TableHead>
                <TableHead>判断基準</TableHead>
                <TableHead>結果</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.part}</TableCell>
                    <TableCell>{item.device}</TableCell>
                    <TableCell>{item.checkPoint}</TableCell>
                    <TableCell>{item.judgmentCriteria}</TableCell>
                    <TableCell>
                      <Select
                        value={item.result || "未実施"}
                        onValueChange={(value) => handleResultChange(item.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="未実施">未実施</SelectItem>
                          <SelectItem value="正常">正常</SelectItem>
                          <SelectItem value="要注意">要注意</SelectItem>
                          <SelectItem value="要点検">要点検</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    表示するデータがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
