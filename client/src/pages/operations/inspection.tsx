import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

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

// CSVデータを解析する関数
function parseCSVData(csvText: string): InspectionItem[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  // CSVヘッダーと項目のマッピング
  const headerMap: Record<string, string> = {
    '製造メーカー': 'manufacturer',
    'メーカー': 'manufacturer',
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
  
  // 日本語のヘッダーをマッピングした英語の識別子に変換
  const mappedHeaders = headers.map(header => headerMap[header.trim()] || header.trim());
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map((line, index) => {
      const values = line.split(',');
      const item: any = { id: `item-${index + 1}`, order: index + 1 };
      
      mappedHeaders.forEach((header, i) => {
        if (header in headerMap || Object.values(headerMap).includes(header)) {
          item[header] = values[i]?.trim() || '';
        }
      });
      
      return item as InspectionItem;
    });
}

interface InspectionProps {
  onChanges?: (hasChanges: boolean) => void;
}

export default function Inspection({ onChanges }: InspectionProps) {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

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

          // 製造メーカーの一覧を抽出（空でないもの）
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

  // 製造メーカーが変更されたら機種の一覧を更新
  useEffect(() => {
    if (selectedManufacturer) {
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
    } else {
      setModelTypes([]);
      setSelectedModelType('');
    }
  }, [selectedManufacturer, items]);

  // フィルター適用
  useEffect(() => {
    if (items.length) {
      let filtered = [...items];
      
      if (selectedManufacturer) {
        filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
      }
      
      if (selectedModelType) {
        filtered = filtered.filter(item => item.modelType === selectedModelType);
      }
      
      setFilteredItems(filtered);
    }
  }, [items, selectedManufacturer, selectedModelType]);

  // 結果の更新
  const updateItemResult = (itemId: string, result: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, result } : item
      )
    );
    
    setHasChanges(true);
    if (onChanges) onChanges(true);
  };

  // 変更の保存
  const saveInspectionResults = async () => {
    try {
      // ここで実際のデータ保存APIを呼び出す
      // 例: await axios.post('/api/inspection-results', { items: filteredItems });
      
      // 保存成功を示す
      setSaveStatus('保存しました');
      setHasChanges(false);
      if (onChanges) onChanges(false);
      
      // 3秒後にステータスメッセージをクリア
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      console.error('保存に失敗しました:', error);
      setSaveStatus('保存に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">点検項目データを読み込み中...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>仕業点検シート</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium mb-1">製造メーカー</label>
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger>
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
            <Select value={selectedModelType} onValueChange={setSelectedModelType}>
              <SelectTrigger>
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

        <div className="border rounded-md overflow-auto max-h-[500px] mt-4">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary">
              <TableRow>
                <TableHead className="w-[180px]">部位</TableHead>
                <TableHead className="w-[180px]">装置</TableHead>
                <TableHead className="w-[180px]">確認箇所</TableHead>
                <TableHead className="w-[250px]">判断基準</TableHead>
                <TableHead className="w-[120px]">結果</TableHead>
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
                        value={item.result || ''}
                        onValueChange={(value) => updateItemResult(item.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="正常">正常</SelectItem>
                          <SelectItem value="注意">注意</SelectItem>
                          <SelectItem value="要修理">要修理</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    {selectedManufacturer && selectedModelType
                      ? '該当する点検項目がありません'
                      : 'メーカーと機種を選択してください'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div>
            {saveStatus && (
              <span className={`text-sm ${saveStatus.includes('失敗') ? 'text-red-500' : 'text-green-500'}`}>
                {saveStatus}
              </span>
            )}
          </div>
          <Button
            onClick={saveInspectionResults}
            disabled={!hasChanges}
            className={!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  ); error);
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  // 製造メーカーが変更されたら機種の一覧を更新
  useEffect(() => {
    if (selectedManufacturer) {
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
    } else {
      setModelTypes([]);
      setSelectedModelType('');
    }
  }, [selectedManufacturer, items]);

  // フィルター適用
  useEffect(() => {
    if (items.length) {
      let filtered = [...items];
      
      if (selectedManufacturer) {
        filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
      }
      
      if (selectedModelType) {
        filtered = filtered.filter(item => item.modelType === selectedModelType);
      }
      
      setFilteredItems(filtered);
    }
  }, [items, selectedManufacturer, selectedModelType]);

  // 結果の更新
  const updateItemResult = (itemId: string, result: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, result } : item
      )
    );
    
    setHasChanges(true);
    if (onChanges) onChanges(true);
  };

  // 変更の保存
  const saveInspectionResults = async () => {
    try {
      // ここで実際のデータ保存APIを呼び出す
      // 例: await axios.post('/api/inspection-results', { items: filteredItems });
      
      // 保存成功を示す
      setSaveStatus('保存しました');
      setHasChanges(false);
      if (onChanges) onChanges(false);
      
      // 3秒後にステータスメッセージをクリア
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      console.error('保存に失敗しました:', error);
      setSaveStatus('保存に失敗しました');
    }
  }; error);
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  // 選択されたメーカーが変更されたら機種の一覧を更新
  useEffect(() => {
    if (selectedManufacturer && items.length > 0) {
      // 選択されたメーカーの機種一覧を取得
      const modelTypesForManufacturer = [...new Set(
        items
          .filter(item => item.manufacturer === selectedManufacturer)
          .map(item => item.modelType)
      )].filter(Boolean);

      setModelTypes(modelTypesForManufacturer);

      // 機種を初期化
      if (modelTypesForManufacturer.length > 0) {
        setSelectedModelType(modelTypesForManufacturer[0]);
      } else {
        setSelectedModelType('');
      }
    } else {
      setModelTypes([]);
      setSelectedModelType('');
    }
  }, [selectedManufacturer, items]);

  // メーカーと機種でアイテムをフィルタリング
  useEffect(() => {
    if (items.length === 0) return;

    let filtered = [...items];

    if (selectedManufacturer) {
      filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
    }

    if (selectedModelType) {
      filtered = filtered.filter(item => item.modelType === selectedModelType);
    }

    setFilteredItems(filtered);
  }, [items, selectedManufacturer, selectedModelType]);

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
        // ダブルクォーテーションでくくられたカンマを処理するための簡易的な解析
        let values: string[] = [];
        let currentValue = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }

        // 最後の値を追加
        values.push(currentValue.trim());

        // 値が少ない場合はヘッダー数に合わせて空文字を追加
        while (values.length < headers.length) {
          values.push('');
        }

        const item: any = { id: `item-${index + 1}`, order: index + 1 };

        headers.forEach((header, i) => {
          const field = headerMap[header] || header;
          item[field] = values[i] || '';
        });

        return item as InspectionItem;
      });
  };

  const handleResultChange = (itemId: string, value: string) => {
    setFilteredItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, result: value } : item
      )
    );

    setHasChanges(true);
    if (onChanges) onChanges(true);
  };

  // 点検データの保存
  const saveInspectionResults = () => {
    // ここで保存処理を実装
    console.log('保存処理:', filteredItems);
    setHasChanges(false);
    if (onChanges) onChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>仕業点検表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">製造メーカー</label>
              <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                <SelectTrigger>
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
                disabled={modelTypes.length === 0}
              >
                <SelectTrigger>
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

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>部位</TableHead>
                  <TableHead>装置</TableHead>
                  <TableHead>確認箇所</TableHead>
                  <TableHead>判断基準</TableHead>
                  <TableHead>確認要領</TableHead>
                  <TableHead>結果</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.part}</TableCell>
                      <TableCell>{item.device}</TableCell>
                      <TableCell>{item.checkPoint}</TableCell>
                      <TableCell>{item.judgmentCriteria}</TableCell>
                      <TableCell>{item.checkMethod}</TableCell>
                      <TableCell>
                        <select
                          className="w-full p-1 border rounded"
                          value={item.result || ''}
                          onChange={(e) => handleResultChange(item.id, e.target.value)}
                        >
                          <option value="">選択</option>
                          <option value="OK">OK</option>
                          <option value="NG">NG</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      データがありません。メーカーと機種を選択してください。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {hasChanges && (
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                onClick={saveInspectionResults}
              >
                保存
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}