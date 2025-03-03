
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
  result?: string;
}

export default function Inspection() {
  // 状態管理
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedModelType, setSelectedModelType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CSVデータを取得し処理する関数
  const fetchInspectionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/inspection-items');
      
      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('取得したCSVデータ:', csvText.substring(0, 200));
      
      // CSVデータを行に分割
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        setError('CSVデータが空です');
        setLoading(false);
        return;
      }
      
      // ヘッダー行を取得
      const headers = lines[0].split(',');
      
      // ヘッダーが期待した形式かチェック
      if (headers.length < 11) {
        setError('CSVヘッダーのフォーマットが不正です');
        setLoading(false);
        return;
      }
      
      // メーカーと機種のセット（重複排除用）
      const manufacturerSet = new Set<string>();
      const modelTypeSet = new Set<string>();
      
      // CSVデータをパース
      const parsedItems: InspectionItem[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        
        // 不足している場合は空の文字列で埋める
        while (values.length < 11) {
          values.push('');
        }
        
        const manufacturer = values[0] ? values[0].trim() : '';
        const modelType = values[1] ? values[1].trim() : '';
        
        // 製造メーカーや機種が前の行と同じ場合の処理（空欄の場合は前の行の値を使用）
        // 1行目でない場合に空欄であれば前の行の値を継承する
        if (i > 1 && manufacturer === '' && parsedItems.length > 0) {
          const lastItem = parsedItems[parsedItems.length - 1];
          const inheritedManufacturer = lastItem.manufacturer;
          
          if (inheritedManufacturer) {
            manufacturerSet.add(inheritedManufacturer);
          }
          
          // 機種も同様に処理
          if (modelType === '' && lastItem.modelType) {
            const inheritedModelType = lastItem.modelType;
            if (inheritedModelType) {
              modelTypeSet.add(inheritedModelType);
            }
            
            // 項目を追加
            parsedItems.push({
              id: `item-${i}`,
              manufacturer: inheritedManufacturer,
              modelType: inheritedModelType,
              engineType: values[2]?.trim() || '',
              part: values[3]?.trim() || '',
              device: values[4]?.trim() || '',
              procedure: values[5]?.trim() || '',
              checkPoint: values[6]?.trim() || '',
              judgmentCriteria: values[7]?.trim() || '',
              checkMethod: values[8]?.trim() || '',
              measurement: values[9]?.trim() || '',
              graphicRecord: values[10]?.trim() || '',
              order: i,
            });
            continue;
          }
        }
        
        // 通常処理
        if (manufacturer) manufacturerSet.add(manufacturer);
        if (modelType) modelTypeSet.add(modelType);
        
        parsedItems.push({
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
          order: i,
        });
      }
      
      console.log(`パース完了: ${parsedItems.length}件のデータ`);
      console.log(`検出されたメーカー: ${Array.from(manufacturerSet).join(', ')}`);
      console.log(`検出された機種: ${Array.from(modelTypeSet).join(', ')}`);
      
      // 状態を更新
      setItems(parsedItems);
      
      // メーカーと機種の選択肢を設定（アルファベット順にソート）
      const sortedManufacturers = Array.from(manufacturerSet).sort();
      const sortedModelTypes = Array.from(modelTypeSet).sort();
      
      setManufacturers(sortedManufacturers);
      setModelTypes(sortedModelTypes);
      
      // 初期選択（データがあれば）
      if (sortedManufacturers.length > 0) {
        setSelectedManufacturer(sortedManufacturers[0]);
      }
      
      if (sortedModelTypes.length > 0) {
        setSelectedModelType(sortedModelTypes[0]);
      }
      
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      toast({
        title: "エラー",
        description: "データの読み込みに失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントのマウント時にデータを取得
  useEffect(() => {
    fetchInspectionData();
  }, []);

  // 選択されたメーカーと機種でフィルタリング
  useEffect(() => {
    if (items.length === 0) return;
    
    let filtered = [...items];
    
    if (selectedManufacturer) {
      filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
    }
    
    if (selectedModelType) {
      filtered = filtered.filter(item => item.modelType === selectedModelType);
    }
    
    console.log(`フィルタリング結果: ${filtered.length}件のデータが表示されます`);
    setFilteredItems(filtered);
  }, [selectedManufacturer, selectedModelType, items]);

  // 点検結果の変更を処理
  const handleResultChange = (itemId: string, result: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, result } : item
    );
    setItems(updatedItems);
    setHasChanges(true);
  };

  // 保存処理
  const saveInspection = () => {
    // ここで保存処理を実装（今回はログのみ）
    console.log('保存するデータ:', items.filter(item => item.result));
    toast({
      title: "保存完了",
      description: "点検結果が保存されました",
    });
    setHasChanges(false);
  };

  // データ再読み込み
  const reloadData = () => {
    fetchInspectionData();
    toast({
      title: "更新",
      description: "データを再読み込みしました",
    });
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">データを読み込み中...</span>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">エラー: {error}</div>
        <Button onClick={reloadData}>再読み込み</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">製造メーカー</label>
            <Select 
              value={selectedManufacturer} 
              onValueChange={setSelectedManufacturer}
            >
              <SelectTrigger className="w-[200px]">
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
                {modelTypes.map((modelType) => (
                  <SelectItem key={modelType} value={modelType}>
                    {modelType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="self-end">
            <Button variant="outline" onClick={reloadData}>
              データ更新
            </Button>
          </div>
        </div>
        
        {hasChanges && (
          <Button onClick={saveInspection}>
            保存
          </Button>
        )}
      </div>

      {filteredItems.length > 0 ? (
        <Table>
          <TableCaption>
            {selectedManufacturer && selectedModelType
              ? `${selectedManufacturer} ${selectedModelType}の点検項目一覧`
              : '仕業点検項目一覧'}
          </TableCaption>
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
          {items.length > 0 
            ? '選択された条件に一致する点検項目はありません。' 
            : '点検項目が登録されていません。'}
        </div>
      )}
    </div>
  );
}
