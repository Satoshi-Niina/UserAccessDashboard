import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { parse } from 'papaparse';

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
}

export default function Inspection() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>(['すべて']);
  const [modelTypes, setModelTypes] = useState<string[]>(['すべて']);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('すべて');
  const [selectedModelType, setSelectedModelType] = useState<string>('すべて');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // CSVデータを取得して処理
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items');
        const csvData = await response.text();

        console.log('CSV取得成功:', csvData.substring(0, 200) + '...');

        // CSVパース
        const { data } = parse(csvData, {
          header: true,
          skipEmptyLines: true,
        });

        // データをInspectionItem形式に変換
        const parsedItems: InspectionItem[] = data.map((row: any, index: number) => ({
          id: `item-${index}`,
          manufacturer: row['製造メーカー'] || '',
          modelType: row['機種'] || '',
          engineType: row['エンジン型式'] || '',
          part: row['部位'] || '',
          device: row['装置'] || '',
          procedure: row['手順'] || '',
          checkPoint: row['確認箇所'] || '',
          judgmentCriteria: row['判断基準'] || '',
          checkMethod: row['確認要領'] || '',
          measurement: row['測定等記録'] || '',
          graphicRecord: row['図形記録'] || '',
        }));

        console.log(`パース完了: ${parsedItems.length}件のデータ`);

        // 重複なしのメーカーと機種リストを作成
        const uniqueManufacturers = Array.from(
          new Set(parsedItems.map(item => item.manufacturer).filter(Boolean))
        );

        const uniqueModelTypes = Array.from(
          new Set(parsedItems.map(item => item.modelType).filter(Boolean))
        );

        setItems(parsedItems);
        setFilteredItems(parsedItems);
        setManufacturers(['すべて', ...uniqueManufacturers]);
        setModelTypes(['すべて', ...uniqueModelTypes]);

        console.log(`メーカー: ${uniqueManufacturers.join(', ')}`);
        console.log(`機種: ${uniqueModelTypes.join(', ')}`);
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
  }, [toast]);

  // フィルターの変更時に実行
  useEffect(() => {
    if (items.length === 0) return;

    console.log(`フィルター適用: メーカー=${selectedManufacturer}, 機種=${selectedModelType}`);

    let filtered = [...items];

    if (selectedManufacturer !== 'すべて') {
      filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
    }

    if (selectedModelType !== 'すべて') {
      filtered = filtered.filter(item => item.modelType === selectedModelType);
    }

    console.log(`フィルター結果: ${filtered.length}件`);
    setFilteredItems(filtered);
  }, [selectedManufacturer, selectedModelType, items]);

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader>
          <CardTitle>仕業点検</CardTitle>
          <CardDescription>点検項目を確認します</CardDescription>
        </CardHeader>
        <CardContent>
          {/* フィルターセクション */}
          <div className="flex space-x-4 mb-6">
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">製造メーカー</label>
              <Select 
                value={selectedManufacturer} 
                onValueChange={setSelectedManufacturer}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">機種</label>
              <Select 
                value={selectedModelType} 
                onValueChange={setSelectedModelType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="機種を選択" />
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
          </div>

          {/* データテーブル */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">データを読み込み中...</span>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>仕業点検項目一覧</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">部位</TableHead>
                    <TableHead className="w-[120px]">装置</TableHead>
                    <TableHead className="w-[180px]">確認箇所</TableHead>
                    <TableHead className="w-[200px]">判断基準</TableHead>
                    <TableHead className="w-[200px]">確認要領</TableHead>
                    <TableHead className="w-[100px]">測定記録</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.part}</TableCell>
                      <TableCell>{item.device}</TableCell>
                      <TableCell>{item.checkPoint}</TableCell>
                      <TableCell>{item.judgmentCriteria}</TableCell>
                      <TableCell>{item.checkMethod}</TableCell>
                      <TableCell>{item.measurement}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>表示するデータがありません</p>
              <p className="text-sm text-gray-500 mt-2">フィルターの条件を変更してください</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}