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
        const headers = lines[0].split(',');
        const parsedItems: InspectionItem[] = [];
        const manufacturersArray: string[] = [];
        const modelTypesArray: string[] = [];

        console.log(`CSVヘッダー: ${headers.join(', ')}`);
        console.log(`総行数: ${lines.length}`);

        // ヘッダー行をスキップして2行目から処理
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // 空行はスキップ

          const values = lines[i].split(',');

          // 最低限の項目数があることを確認
          if (values.length >= 8) { // 少なくとも必要な列数があるか確認
            const manufacturer = values[0]?.trim() || '';
            const modelType = values[1]?.trim() || '';
            const engineType = values[2]?.trim() || '';

            // 重複しないようにメーカーと機種を追加
            if (manufacturer && !manufacturersArray.includes(manufacturer)) {
              manufacturersArray.push(manufacturer);
            }

            if (modelType && !modelTypesArray.includes(modelType)) {
              modelTypesArray.push(modelType);
            }

            // 点検項目の作成
            const item: InspectionItem = {
              id: `item-${i}`,
              manufacturer: manufacturer,
              modelType: modelType,
              engineType: engineType,
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

            // アイテムをログに出力（デバッグ用）
            if (i < 5) {
              console.log(`項目 ${i}: ${JSON.stringify(item)}`);
            }

            parsedItems.push(item);
          }
        }

        console.log(`パース完了: ${parsedItems.length}個の項目を読み込みました`);
        console.log(`メーカー: ${manufacturersArray.join(', ')}`);
        console.log(`機種: ${modelTypesArray.join(', ')}`);

        // 空の値を持つレコードを考慮して、「未設定」オプションを追加
        if (parsedItems.some(item => !item.manufacturer || item.manufacturer === '')) {
          if (!manufacturersArray.includes('未設定')) {
            manufacturersArray.push('未設定');
          }
        }

        if (parsedItems.some(item => !item.modelType || item.modelType === '')) {
          if (!modelTypesArray.includes('未設定')) {
            modelTypesArray.push('未設定');
          }
        }

        // 状態を更新
        setItems(parsedItems);
        setFilteredItems(parsedItems);

        if (manufacturersArray.length > 0) {
          setManufacturers(['すべて', ...manufacturersArray]);
          // 初期メーカーを選択 (デフォルトは「すべて」)
          setSelectedManufacturer('すべて');
        }

        if (modelTypesArray.length > 0) {
          setModelTypes(['すべて', ...modelTypesArray]);
          // 初期機種を選択 (デフォルトは「すべて」)
          setSelectedModelType('すべて');
        }
      } else {
        console.error('CSVデータが空です');
      }
    } catch (error) {
      console.error('CSVデータの取得に失敗しました:', error);
      toast({
        title: "エラー",
        description: "点検データの読み込みに失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントのマウント時に点検データを読み込む
  useEffect(() => {
    fetchInspectionData();

    // CSVファイルの内容を直接確認
    fetch('/api/inspection-items')
      .then(response => response.text())
      .then(csv => {
        console.log('--- CSVデータの詳細 ---');
        console.log(csv.substring(0, 1000)); // 最初の1000文字を表示

        // CSVの行数を確認
        const lines = csv.split('\n');
        console.log(`CSVの総行数: ${lines.length}`);

        // ヘッダー行を確認
        console.log('ヘッダー行:', lines[0]);

        // 最初の数行のデータを確認
        console.log('データ行の例:');
        lines.slice(1, 6).forEach((line, i) => {
          console.log(`${i+1}行目:`, line);
        });
      })
      .catch(error => console.error('CSVデータの直接読み込みに失敗:', error));
  }, []);

  // データが読み込まれた後に最初のメーカーと機種を自動選択
  useEffect(() => {
    if (manufacturers.length > 1 && selectedManufacturer === 'すべて') {
      // 最初の実際のメーカー（「すべて」の次のもの）を選択
      setSelectedManufacturer(manufacturers[1]);
    }

    if (modelTypes.length > 1 && selectedModelType === 'すべて') {
      // 最初の実際の機種（「すべて」の次のもの）を選択
      setSelectedModelType(modelTypes[1]);
    }
  }, [manufacturers, modelTypes]);

  // フィルタリング
  useEffect(() => {
    if (items.length > 0) {
      console.log(`フィルタリング開始: 全${items.length}件, メーカー: ${selectedManufacturer}, 機種: ${selectedModelType}`);

      let filtered = [...items];

      // メーカーでフィルタリング
      if (selectedManufacturer !== 'すべて') {
        filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
        console.log(`  メーカー「${selectedManufacturer}」でフィルター後: ${filtered.length}件`);
      }

      // 機種でフィルタリング
      if (selectedModelType !== 'すべて') {
        filtered = filtered.filter(item => item.modelType === selectedModelType);
        console.log(`  機種「${selectedModelType}」でフィルター後: ${filtered.length}件`);
      }

      console.log(`フィルタリング結果: ${filtered.length}件`);

      // フィルタリング結果のサンプルを表示
      if (filtered.length > 0) {
        console.log('フィルタリング結果のサンプル:', JSON.stringify(filtered[0]));
      } else {
        console.log('フィルタリング結果が0件です');
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