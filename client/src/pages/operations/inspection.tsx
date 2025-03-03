
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

interface InspectionProps {
  onChanges?: (hasChanges: boolean) => void;
}

export default function Inspection({ onChanges }: InspectionProps) {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedModelType, setSelectedModelType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // 点検項目データの読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items');
        const text = await response.text();

        if (text) {
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());

          // ヘッダーとカラムのマッピング
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
            '図形記録': 'graphicRecord'
          };

          // CSVデータをパース
          const parsedItems: InspectionItem[] = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',').map(v => v.trim());
            const item: any = { id: `item-${i}`, order: i, result: '' };
            
            for (let j = 0; j < headers.length; j++) {
              const key = headerMap[headers[j]];
              if (key) {
                item[key] = values[j] || '';
              }
            }
            
            parsedItems.push(item as InspectionItem);
          }

          setItems(parsedItems);
          
          // メーカーリストの生成
          const uniqueManufacturers = Array.from(
            new Set(parsedItems.map(item => item.manufacturer))
          ).filter(Boolean);
          setManufacturers(uniqueManufacturers);
          
          setLoading(false);
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        toast({
          title: "エラー",
          description: "点検項目データの読み込みに失敗しました。",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // メーカー選択時の処理
  useEffect(() => {
    if (selectedManufacturer) {
      // 選択されたメーカーで機種をフィルタリング
      const filteredByManufacturer = items.filter(
        item => item.manufacturer === selectedManufacturer
      );
      
      // 機種リストの生成
      const uniqueModelTypes = Array.from(
        new Set(filteredByManufacturer.map(item => item.modelType))
      ).filter(Boolean);
      setModelTypes(uniqueModelTypes);
      
      // 機種が選択されている場合はその機種でもフィルタリング
      if (selectedModelType && !uniqueModelTypes.includes(selectedModelType)) {
        setSelectedModelType('');
      }
      
      applyFilters(selectedManufacturer, selectedModelType);
    } else {
      setModelTypes([]);
      setSelectedModelType('');
      setFilteredItems([]);
    }
  }, [selectedManufacturer, items]);

  // 機種選択時の処理
  useEffect(() => {
    if (selectedManufacturer) {
      applyFilters(selectedManufacturer, selectedModelType);
    }
  }, [selectedModelType]);

  // フィルター適用
  const applyFilters = (manufacturer: string, modelType: string) => {
    let filtered = items.filter(item => item.manufacturer === manufacturer);
    
    if (modelType) {
      filtered = filtered.filter(item => item.modelType === modelType);
    }
    
    setFilteredItems(filtered);
  };

  // 結果の更新処理
  const handleResultChange = (itemId: string, result: string) => {
    setFilteredItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, result } 
          : item
      )
    );
    
    setItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, result } 
          : item
      )
    );
    
    setHasChanges(true);
    
    // 親コンポーネントに変更を通知
    if (onChanges) {
      onChanges(true);
    }
  };

  // 保存処理
  const saveInspectionResults = async () => {
    try {
      // ここで実際のデータ保存APIを呼び出す
      // 例: await fetch('/api/inspection-results', { 
      //   method: 'POST', 
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(items) 
      // });
      
      toast({
        title: "保存完了",
        description: "点検結果を保存しました。",
      });
      
      setHasChanges(false);
      
      // 親コンポーネントに保存完了を通知
      if (onChanges) {
        onChanges(false);
      }
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "エラー",
        description: "点検結果の保存に失敗しました。",
        variant: "destructive"
      });
    }
  };

  // 結果のCSVエクスポート
  const exportResultsToCSV = () => {
    if (items.length === 0) return;
    
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
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `点検結果_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">仕業点検</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="製造メーカー" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">すべて</SelectItem>
              {manufacturers.map(manufacturer => (
                <SelectItem key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedModelType} 
            onValueChange={setSelectedModelType}
            disabled={!selectedManufacturer}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="機種" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">すべて</SelectItem>
              {modelTypes.map(model => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={saveInspectionResults}
            disabled={!hasChanges}
            variant={hasChanges ? "default" : "outline"}
          >
            保存
          </Button>
          <Button 
            onClick={exportResultsToCSV}
            variant="outline"
            disabled={items.length === 0}
          >
            CSVエクスポート
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">データを読み込み中...</span>
        </div>
      ) : selectedManufacturer && filteredItems.length > 0 ? (
        <Table>
          <TableCaption>
            {selectedManufacturer} {selectedModelType && `- ${selectedModelType}`} の仕業点検項目
          </TableCaption>
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
            {filteredItems.map(item => (
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
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="結果" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">未選択</SelectItem>
                      <SelectItem value="正常">正常</SelectItem>
                      <SelectItem value="注意">注意</SelectItem>
                      <SelectItem value="要修理">要修理</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : selectedManufacturer ? (
        <div className="text-center py-12 text-gray-500">
          選択された条件に一致する点検項目がありません
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          メーカーを選択して点検項目を表示してください
        </div>
      )}
    </div>
  );
}
