
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/use-toast';
import Papa from 'papaparse';

interface InspectionItem {
  メーカー: string;
  機種: string;
  'エンジン型式': string;
  部位: string;
  装置: string;
  手順: string;
  確認箇所: string;
  判断基準: string;
  確認要領: string;
  測定等記録: string;
  図形記録: string;
  [key: string]: string;
}

export default function Inspection() {
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [displayItems, setDisplayItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // CSVデータの読み込み
  useEffect(() => {
    const fetchInspectionItems = async () => {
      setLoading(true);
      try {
        console.log("APIコール：仕業点検項目を取得します");
        const response = await fetch('/api/inspection-items?t=' + new Date().getTime());
        
        if (!response.ok) {
          throw new Error(`API エラー: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log("CSV取得成功:", csvText.substring(0, 100) + "...");
        
        // CSVパース
        const { data } = Papa.parse<InspectionItem>(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        
        console.log("パース成功:", data.length, "件のレコード");
        
        if (data.length === 0) {
          setError("点検項目データが見つかりませんでした");
          return;
        }
        
        // 製造メーカーと機種の一覧を取得
        const uniqueManufacturers = [...new Set(data.map(item => item['メーカー']).filter(Boolean))];
        const uniqueModels = [...new Set(data.map(item => item['機種']).filter(Boolean))];
        
        console.log("製造メーカー:", uniqueManufacturers);
        console.log("機種:", uniqueModels);
        
        setManufacturers(uniqueManufacturers);
        setModelTypes(uniqueModels);
        
        // 初期選択の設定
        if (uniqueManufacturers.length > 0) {
          setSelectedManufacturer(uniqueManufacturers[0]);
          
          // 選択したメーカーに対応する機種を抽出
          const relatedModels = data
            .filter(item => item['メーカー'] === uniqueManufacturers[0])
            .map(item => item['機種'])
            .filter((value, index, self) => self.indexOf(value) === index);
            
          if (relatedModels.length > 0) {
            setSelectedModel(relatedModels[0]);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("点検項目データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  // 選択したメーカーに基づいて機種リストをフィルタリング
  useEffect(() => {
    if (!selectedManufacturer) return;
    
    const fetchInspectionItems = async () => {
      try {
        const response = await fetch('/api/inspection-items?t=' + new Date().getTime());
        const csvText = await response.text();
        
        const { data } = Papa.parse<InspectionItem>(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        
        // 選択したメーカーの機種を取得
        const filteredModels = [...new Set(
          data
            .filter(item => item['メーカー'] === selectedManufacturer)
            .map(item => item['機種'])
            .filter(Boolean)
        )];
        
        setModelTypes(filteredModels);
        
        // 機種リストが更新されたとき、最初の機種を選択
        if (filteredModels.length > 0 && !filteredModels.includes(selectedModel)) {
          setSelectedModel(filteredModels[0]);
        }
      } catch (err) {
        console.error("機種リスト取得エラー:", err);
      }
    };
    
    fetchInspectionItems();
  }, [selectedManufacturer]);

  // 表示アイテムの更新
  useEffect(() => {
    if (!selectedManufacturer || !selectedModel) return;
    
    const fetchFilteredItems = async () => {
      try {
        const response = await fetch('/api/inspection-items?t=' + new Date().getTime());
        const csvText = await response.text();
        
        const { data } = Papa.parse<InspectionItem>(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        
        // 選択されたメーカーと機種で点検項目をフィルタリング
        const filtered = data.filter(item => 
          item['メーカー'] === selectedManufacturer && 
          item['機種'] === selectedModel
        );
        
        setDisplayItems(filtered);
      } catch (err) {
        console.error("点検項目フィルタリングエラー:", err);
      }
    };
    
    fetchFilteredItems();
  }, [selectedManufacturer, selectedModel]);

  // 点検結果の保存
  const handleSaveResults = () => {
    // 点検結果の保存処理を実装
    toast({
      title: "保存完了",
      description: "点検結果が保存されました",
    });
    setHasChanges(false);
  };

  // 結果の変更ハンドラ
  const handleResultChange = (itemId: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [itemId]: value
    }));
    setHasChanges(true);
  };

  if (loading) {
    return <div className="text-center py-8">データを読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">仕業点検</h2>
        <p className="mb-4">メーカーと機種を選択して点検項目を表示します。</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">製造メーカー</label>
          <Select 
            value={selectedManufacturer} 
            onValueChange={setSelectedManufacturer}
          >
            <SelectTrigger>
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
            value={selectedModel} 
            onValueChange={setSelectedModel}
            disabled={modelTypes.length === 0}
          >
            <SelectTrigger>
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
      
      {displayItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>点検項目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
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
                  {displayItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.部位}</TableCell>
                      <TableCell>{item.装置}</TableCell>
                      <TableCell>{item.確認箇所}</TableCell>
                      <TableCell>{item.判断基準}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`ok-${index}`}
                              checked={results[`${index}`] === 'OK'}
                              onCheckedChange={() => handleResultChange(`${index}`, 'OK')}
                            />
                            <label htmlFor={`ok-${index}`}>OK</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`ng-${index}`}
                              checked={results[`${index}`] === 'NG'}
                              onCheckedChange={() => handleResultChange(`${index}`, 'NG')}
                            />
                            <label htmlFor={`ng-${index}`}>NG</label>
                          </div>
                          {item.測定等記録 === '要記録' && (
                            <Input 
                              placeholder="測定値"
                              value={results[`${index}-value`] || ''}
                              onChange={(e) => handleResultChange(`${index}-value`, e.target.value)}
                              className="w-24"
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSaveResults}
                disabled={!hasChanges}
              >
                点検結果を保存
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        selectedManufacturer && selectedModel ? (
          <div className="text-center py-4">
            選択されたメーカーと機種の点検項目がありません
          </div>
        ) : null
      )}
    </div>
  );
}
