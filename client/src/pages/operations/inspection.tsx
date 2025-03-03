
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Input,
} from '@/components/ui';
import { Download, Save } from 'lucide-react';

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
  result?: string;
}

interface InspectionProps {
  onChanges?: (hasChanges: boolean) => void;
}

export default function Inspection({ onChanges }: InspectionProps) {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  
  // フィルター用の状態
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedModelType, setSelectedModelType] = useState<string>('');

  // CSVデータの読み込み
  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items');
        const csvText = await response.text();
        
        if (csvText) {
          const items = parseCSVData(csvText);
          setItems(items);
          
          // 製造メーカーと機種の一覧を抽出
          const uniqueManufacturers = [...new Set(items.map(item => item.manufacturer))].filter(Boolean);
          setManufacturers(uniqueManufacturers);
          
          if (uniqueManufacturers.length > 0) {
            setSelectedManufacturer(uniqueManufacturers[0]);
          }
        }
      } catch (error) {
        console.error('点検項目の読み込みに失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInspectionItems();
  }, []);

  // CSVデータのパース関数
  const parseCSVData = (csv: string): InspectionItem[] => {
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

    return lines.slice(1)
      .filter(line => line.trim())
      .map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const item: any = { id: `item-${index + 1}` };
        
        headers.forEach((header, i) => {
          const field = headerMap[header] || header;
          item[field] = values[i] || '';
        });
        
        return item as InspectionItem;
      });
  };

  // メーカー選択時の処理
  useEffect(() => {
    if (selectedManufacturer) {
      // 選択されたメーカーに対応する機種一覧を抽出
      const filteredModelTypes = [...new Set(
        items
          .filter(item => item.manufacturer === selectedManufacturer)
          .map(item => item.modelType)
      )].filter(Boolean);
      
      setModelTypes(filteredModelTypes);
      
      if (filteredModelTypes.length > 0) {
        setSelectedModelType(filteredModelTypes[0]);
      } else {
        setSelectedModelType('');
      }
      
      // フィルター適用
      applyFilters(selectedManufacturer, filteredModelTypes.length > 0 ? filteredModelTypes[0] : '');
    } else {
      setFilteredItems([]);
    }
  }, [selectedManufacturer, items]);

  // 機種選択時の処理
  useEffect(() => {
    if (selectedManufacturer && selectedModelType) {
      applyFilters(selectedManufacturer, selectedModelType);
    }
  }, [selectedModelType]);

  // フィルターの適用
  const applyFilters = (manufacturer: string, modelType: string) => {
    if (!manufacturer) {
      setFilteredItems([]);
      return;
    }
    
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
  const handleSave = async () => {
    try {
      // 実際のアプリケーションでは、ここでサーバーにデータを送信する処理を実装
      // 例: await fetch('/api/inspection-results', { method: 'POST', body: JSON.stringify(items) });
      
      alert('点検結果を保存しました');
      setHasChanges(false);
      
      if (onChanges) {
        onChanges(false);
      }
    } catch (error) {
      console.error('保存に失敗しました:', error);
      alert('保存に失敗しました');
    }
  };

  // CSVダウンロード処理
  const handleDownloadCSV = () => {
    const headers = [
      '製造メーカー',
      '機種',
      'エンジン型式',
      '部位',
      '装置',
      '手順',
      '確認箇所',
      '判断基準',
      '確認要領',
      '測定等記録',
      '図形記録',
      '結果'
    ];
    
    const rows = filteredItems.map(item => [
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
    link.setAttribute('download', `点検結果_${selectedManufacturer}_${selectedModelType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-center py-10">データを読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">製造メーカー</label>
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="メーカーを選択" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map(manufacturer => (
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
              disabled={!selectedManufacturer || modelTypes.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="機種を選択" />
              </SelectTrigger>
              <SelectContent>
                {modelTypes.map(model => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadCSV}
            disabled={filteredItems.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            CSVダウンロード
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </div>
      </div>
      
      {filteredItems.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">部位</TableHead>
                <TableHead className="w-[100px]">装置</TableHead>
                <TableHead className="w-[150px]">確認箇所</TableHead>
                <TableHead className="w-[200px]">判断基準</TableHead>
                <TableHead className="w-[200px]">確認要領</TableHead>
                <TableHead className="w-[120px]">結果</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.part}</TableCell>
                  <TableCell>{item.device}</TableCell>
                  <TableCell>{item.checkPoint}</TableCell>
                  <TableCell>{item.judgmentCriteria}</TableCell>
                  <TableCell>{item.checkMethod}</TableCell>
                  <TableCell>
                    <Input
                      value={item.result || ''}
                      onChange={(e) => handleResultChange(item.id, e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg">
          {selectedManufacturer ? '選択された条件に一致する点検項目がありません' : 'メーカーを選択してください'}
        </div>
      )}
    </div>
  );
}
