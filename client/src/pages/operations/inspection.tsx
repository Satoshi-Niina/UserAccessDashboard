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

export default function Inspection() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('すべて');
  const [selectedModelType, setSelectedModelType] = useState<string>('すべて');
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  // CSV データを取得する関数
  const fetchInspectionData = async () => {
    try {
      setLoading(true);
      console.log('API を呼び出し中...');
      const response = await fetch('/api/inspection-items');
      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`);
      }

      const text = await response.text();
      console.log('CSVデータ:', text.substring(0, 200) + '...');

      if (text) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const manufacturerIndex = headers.indexOf('製造メーカー');
        const modelTypeIndex = headers.indexOf('機種');
        const engineTypeIndex = headers.indexOf('エンジン型式');
        const partIndex = headers.indexOf('部位');
        const deviceIndex = headers.indexOf('装置');
        const procedureIndex = headers.indexOf('手順');
        const checkPointIndex = headers.indexOf('確認箇所');
        const judgmentIndex = headers.indexOf('判断基準');
        const checkMethodIndex = headers.indexOf('確認要領');
        const measurementIndex = headers.indexOf('測定等記録');
        const graphicRecordIndex = headers.indexOf('図形記録');

        // CSVからデータを解析
        const parsedItems: InspectionItem[] = [];
        const uniqueManufacturers = new Set<string>();
        const uniqueModelTypes = new Set<string>();

        // 各行をパース
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map(v => v.trim());

          const item: InspectionItem = {
            id: `item-${i}`,
            manufacturer: values[manufacturerIndex] || '',
            modelType: values[modelTypeIndex] || '',
            engineType: values[engineTypeIndex] || '',
            part: values[partIndex] || '',
            device: values[deviceIndex] || '',
            procedure: values[procedureIndex] || '',
            checkPoint: values[checkPointIndex] || '',
            judgmentCriteria: values[judgmentIndex] || '',
            checkMethod: values[checkMethodIndex] || '',
            measurement: values[measurementIndex] || '',
            graphicRecord: values[graphicRecordIndex] || '',
            order: i,
            result: '' // 初期状態は空
          };

          // 有効な製造メーカーと機種を収集
          if (item.manufacturer) {
            uniqueManufacturers.add(item.manufacturer);
          }
          if (item.modelType) {
            uniqueModelTypes.add(item.modelType);
          }

          parsedItems.push(item);
        }

        console.log(`パースされた項目数: ${parsedItems.length}`);

        // 状態を更新
        setItems(parsedItems);
        setFilteredItems(parsedItems);

        // メーカーと機種のリストを作成
        const manufacturersArray = Array.from(uniqueManufacturers).filter(Boolean);
        const modelTypesArray = Array.from(uniqueModelTypes).filter(Boolean);

        setManufacturers(['すべて', ...manufacturersArray]);
        setModelTypes(['すべて', ...modelTypesArray]);

        console.log(`${parsedItems.length}件の点検項目を読み込みました`);
        console.log('メーカー:', manufacturersArray);
        console.log('機種:', modelTypesArray);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      toast({
        title: "エラー",
        description: "点検項目の読み込みに失敗しました",
        variant: "destructive"
      });
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
    console.log('保存するCSVデータ:', generateCsvFromItems(items));
    toast({
      title: "保存完了",
      description: "点検結果が保存されました",
    });
    setHasChanges(false);
  };

  // CSVデータ生成関数
  const generateCsvFromItems = (items: InspectionItem[]): string => {
    const headers = [
      '製造メーカー', '機種', 'エンジン型式', '部位', '装置', '手順',
      '確認箇所', '判断基準', '確認要領', '測定等記録', '図形記録'
    ];

    const rows = items.map(item => [
      item.manufacturer,
      item.modelType,
      item.engineType,
      item.part,
      item.device,
      item.procedure,
      item.checkPoint,
      item.judgmentCriteria,
      item.checkMethod,
      item.measurement,
      item.graphicRecord
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
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
              {modelTypes.map((modelType) => (
                <SelectItem key={modelType} value={modelType}>
                  {modelType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasChanges && (
          <Button onClick={saveInspection}>
            保存
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">データを読み込み中...</span>
        </div>
      ) : filteredItems.length > 0 ? (
        <Table>
          <TableCaption>仕業点検項目一覧</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">部位</TableHead>
              <TableHead className="w-[150px]">装置</TableHead>
              <TableHead className="w-[200px]">確認箇所</TableHead>
              <TableHead className="w-[250px]">判断基準</TableHead>
              <TableHead className="w-[150px]">結果</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.part}</TableCell>
                <TableCell>{item.device}</TableCell>
                <TableCell>{item.checkPoint}</TableCell>
                <TableCell>{item.judgmentCriteria}</TableCell>
                <TableCell>
                  <Select
                    value={item.result || ''}
                    onValueChange={(value) => handleResultChange(item.id, value)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="正常">正常</SelectItem>
                      <SelectItem value="要注意">要注意</SelectItem>
                      <SelectItem value="要修理">要修理</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-10">
          {selectedManufacturer !== 'すべて' || selectedModelType !== 'すべて' ? 
            '選択された条件に一致する点検項目はありません。' : 
            '点検項目がありません。設定メニューから点検項目を追加してください。'}
        </div>
      )}
    </div>
  );
}