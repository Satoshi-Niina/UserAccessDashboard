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
  result?: string;
}

export default function Inspection() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>(['すべて']);
  const [modelTypes, setModelTypes] = useState<string[]>(['すべて']);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('すべて');
  const [selectedModelType, setSelectedModelType] = useState<string>('すべて');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CSVデータを取得
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items');
        const csvText = await response.text();

        console.log('CSV取得完了, サイズ:', csvText.length);

        // CSVパース
        const lines = csvText.split('\n');
        const headerLine = lines[0];
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');

        console.log('ヘッダー行:', headerLine);
        console.log('データ行数:', dataLines.length);

        // 項目のパース
        const parsedItems: InspectionItem[] = [];
        const uniqueManufacturers = new Set<string>();
        const uniqueModelTypes = new Set<string>();

        for (let i = 0; i < dataLines.length; i++) {
          const values = dataLines[i].split(',');
          if (values.length < 8) continue;

          const manufacturer = values[0]?.trim() || '';
          const modelType = values[1]?.trim() || '';

          if (manufacturer) uniqueManufacturers.add(manufacturer);
          if (modelType) uniqueModelTypes.add(modelType);

          parsedItems.push({
            manufacturer,
            modelType,
            engineType: values[2]?.trim() || '',
            part: values[3]?.trim() || '',
            device: values[4]?.trim() || '',
            procedure: values[5]?.trim() || '',
            checkPoint: values[6]?.trim() || '',
            judgmentCriteria: values[7]?.trim() || '',
            checkMethod: values[8]?.trim() || '',
            measurement: values[9]?.trim() || '',
            graphicRecord: values[10]?.trim() || ''
          });
        }

        console.log('パース完了:', parsedItems.length, '件');

        if (parsedItems.length > 0) {
          console.log('最初の項目サンプル:', JSON.stringify(parsedItems[0]));
        }

        // 状態更新
        setItems(parsedItems);
        setFilteredItems(parsedItems);
        setManufacturers(['すべて', ...Array.from(uniqueManufacturers)]);
        setModelTypes(['すべて', ...Array.from(uniqueModelTypes)]);

        // デフォルト選択（データがある場合）
        if (uniqueManufacturers.size > 0) {
          const firstManufacturer = Array.from(uniqueManufacturers)[0];
          setSelectedManufacturer(firstManufacturer);

          // そのメーカーで利用可能な機種をフィルタ
          const relatedModels = parsedItems
            .filter(item => item.manufacturer === firstManufacturer)
            .map(item => item.modelType);

          if (relatedModels.length > 0) {
            setSelectedModelType(relatedModels[0]);
          }
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        toast({
          title: "エラー",
          description: "点検データの読み込みに失敗しました",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // メーカー・機種選択変更時のフィルタリング
  useEffect(() => {
    let filtered = [...items];

    // メーカーフィルタ
    if (selectedManufacturer !== 'すべて') {
      filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
    }

    // 機種フィルタ
    if (selectedModelType !== 'すべて') {
      filtered = filtered.filter(item => item.modelType === selectedModelType);
    }

    console.log('フィルタリング結果:', filtered.length, '件');
    setFilteredItems(filtered);
  }, [selectedManufacturer, selectedModelType, items]);

  // メーカー選択時に対応する機種のみを表示
  useEffect(() => {
    if (selectedManufacturer !== 'すべて') {
      const availableModels = [...new Set(
        items
          .filter(item => item.manufacturer === selectedManufacturer)
          .map(item => item.modelType)
          .filter(Boolean)
      )];

      setModelTypes(['すべて', ...availableModels]);

      // 選択中の機種が新しいリストにない場合はリセット
      if (!availableModels.includes(selectedModelType) && selectedModelType !== 'すべて') {
        setSelectedModelType('すべて');
      }
    } else {
      // すべてのメーカーの場合は、全機種を表示
      const allModels = [...new Set(items.map(item => item.modelType).filter(Boolean))];
      setModelTypes(['すべて', ...allModels]);
    }
  }, [selectedManufacturer, items]);

  // 結果変更ハンドラ
  const handleResultChange = (index: number, result: string) => {
    const newItems = [...filteredItems];
    newItems[index].result = result;
    setFilteredItems(newItems);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">仕業点検</h2>
      </div>

      <div className="flex space-x-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">メーカー</label>
          <Select 
            value={selectedManufacturer} 
            onValueChange={setSelectedManufacturer}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="メーカーを選択" />
            </SelectTrigger>
            <SelectContent>
              {manufacturers.map(manufacturer => (
                <SelectItem key={manufacturer} value={manufacturer}>
                  {manufacturer || '未設定'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">機種</label>
          <Select 
            value={selectedModelType} 
            onValueChange={setSelectedModelType}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="機種を選択" />
            </SelectTrigger>
            <SelectContent>
              {modelTypes.map(model => (
                <SelectItem key={model} value={model}>
                  {model || '未設定'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>データを読み込み中...</span>
        </div>
      ) : filteredItems.length > 0 ? (
        <Table>
          <TableCaption>
            {selectedManufacturer !== 'すべて' ? selectedManufacturer : '全メーカー'} / 
            {selectedModelType !== 'すべて' ? selectedModelType : '全機種'} の点検項目一覧
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">部位</TableHead>
              <TableHead className="w-[120px]">装置</TableHead>
              <TableHead className="w-[180px]">確認箇所</TableHead>
              <TableHead className="w-[240px]">判断基準</TableHead>
              <TableHead className="w-[120px]">結果</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.part}</TableCell>
                <TableCell>{item.device}</TableCell>
                <TableCell>{item.checkPoint}</TableCell>
                <TableCell>{item.judgmentCriteria}</TableCell>
                <TableCell>
                  <Select
                    value={item.result || ''}
                    onValueChange={(value) => handleResultChange(index, value)}
                  >
                    <SelectTrigger className="w-[100px]">
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
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">
            {items.length === 0 
              ? '点検データが読み込まれていません。' 
              : '選択された条件に一致する点検項目がありません。'}
          </p>
        </div>
      )}
    </div>
  );
}