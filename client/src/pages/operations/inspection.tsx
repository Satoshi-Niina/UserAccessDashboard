
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

// 点検項目の型定義
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
  const [manufacturers, setManufacturers] = useState<string[]>(['すべて']);
  const [modelTypes, setModelTypes] = useState<string[]>(['すべて']);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('すべて');
  const [selectedModelType, setSelectedModelType] = useState<string>('すべて');
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // データを取得する
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/inspection-items');
        if (!response.ok) {
          throw new Error(`APIエラー: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('取得したCSVデータのサンプル:', text.substring(0, 200));

        if (!text || text.trim() === '') {
          toast({
            title: "エラー",
            description: "データが空です",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const lines = text.split('\n');
        console.log(`CSVデータ: 総行数=${lines.length}`);

        if (lines.length < 2) {
          toast({
            title: "警告",
            description: "データが不足しています",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // CSVデータをパース
        const parsedItems: InspectionItem[] = [];
        const manufacturerSet = new Set<string>();
        const modelTypeSet = new Set<string>();

        // ヘッダー行をスキップして2行目から処理
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i] || !lines[i].trim()) continue; // 空行はスキップ

          const values = lines[i].split(',');
          if (values.length < 8) {
            console.log(`スキップされた行 ${i}: 列数不足`, values);
            continue; // 最低限の列数がない行はスキップ
          }

          const manufacturer = values[0]?.trim() || '';
          const modelType = values[1]?.trim() || '';

          // 製造メーカーと機種をセットに追加（重複排除）
          if (manufacturer) manufacturerSet.add(manufacturer);
          if (modelType) modelTypeSet.add(modelType);

          // 項目の作成
          const item: InspectionItem = {
            id: `item-${i}`,
            manufacturer: manufacturer,
            modelType: modelType,
            engineType: values[2]?.trim() || '',
            part: values[3]?.trim() || '',
            device: values[4]?.trim() || '',
            procedure: values[5]?.trim() || '',
            checkPoint: values[6]?.trim() || '',
            judgmentCriteria: values[7]?.trim() || '',
            checkMethod: values[8]?.trim() || '',
            measurement: values[9]?.trim() || '',
            graphicRecord: values[10]?.trim() || '',
            order: i
          };

          parsedItems.push(item);
        }

        // メーカーと機種の選択肢を設定
        const manufacturerArray = Array.from(manufacturerSet).filter(Boolean);
        const modelTypeArray = Array.from(modelTypeSet).filter(Boolean);

        console.log(`検出されたメーカー (${manufacturerArray.length}): ${manufacturerArray.join(', ')}`);
        console.log(`検出された機種 (${modelTypeArray.length}): ${modelTypeArray.join(', ')}`);
        console.log(`パースされた点検項目: ${parsedItems.length}件`);

        setItems(parsedItems);
        setFilteredItems(parsedItems);
        setManufacturers(['すべて', ...manufacturerArray]);
        setModelTypes(['すべて', ...modelTypeArray]);
        setDataLoaded(true);

        // 初期メーカーと機種を設定（値があれば）
        if (manufacturerArray.length > 0) {
          setSelectedManufacturer(manufacturerArray[0]);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        toast({
          title: "エラー",
          description: "データの読み込みに失敗しました",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // フィルタリング
  useEffect(() => {
    if (!dataLoaded || items.length === 0) return;

    console.log(`フィルタリング: メーカー=${selectedManufacturer}, 機種=${selectedModelType}`);

    let filtered = [...items];

    // メーカーでフィルタリング
    if (selectedManufacturer !== 'すべて') {
      filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
    }

    // 機種でフィルタリング
    if (selectedModelType !== 'すべて') {
      filtered = filtered.filter(item => item.modelType === selectedModelType);
    }

    console.log(`フィルタリング結果: ${filtered.length}件`);
    setFilteredItems(filtered);
  }, [selectedManufacturer, selectedModelType, items, dataLoaded]);

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
      '確認箇所', '判断基準', '確認要領', '測定等記録', '図形記録', '結果'
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
      item.graphicRecord,
      item.result || ''
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
                  {manufacturer || "未設定"}
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
                  {modelType || "未設定"}
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
          <TableCaption>仕業点検項目一覧（{filteredItems.length}件）</TableCaption>
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
          {dataLoaded ? 
            (selectedManufacturer !== 'すべて' || selectedModelType !== 'すべて' ? 
              '選択された条件に一致する点検項目はありません。' : 
              '点検項目がありません。') :
            'データの読み込みに失敗しました。'}
        </div>
      )}
    </div>
  );
}
