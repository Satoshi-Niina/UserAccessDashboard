import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ExitButton } from '@/components/layout/exit-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui';
import { Save, FileText } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import Label from '@/components/ui/label';


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
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('すべて');
  const [selectedModelType, setSelectedModelType] = useState<string>('すべて');
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // 初期データの読み込み
  useEffect(() => {
    fetch('/api/inspection-data')
      .then(res => res.text())
      .catch(() => {
        // APIが失敗した場合、ローカルのサンプルデータを返す
        return '製造メーカー,機種,エンジン型式,部位,装置,手順,確認箇所,判断基準,確認要領,測定等記録,図形記録\n堀川工機,MC300,ボルボ,エンジン,本体,,エンジンヘッドカバー、ターボ,オイル、燃料漏れ,オイル等滲み・垂れ跡が無,,\n,,,エンジン,本体,,排気及び吸気,排気ガス色及びガス漏れ等の点検（マフラー等）,ほぼ透明の薄紫,,';
      })
      .then(text => {
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
            '図形記録': 'graphicRecord',
          };

          const parsedItems = lines.slice(1).filter(line => line.trim()).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const item: any = { id: `item-${index + 1}`, order: index + 1, result: '未実施' };

            headers.forEach((header, i) => {
              const field = headerMap[header] || header;
              item[field] = values[i] || '';
            });

            return item as InspectionItem;
          });

          console.log('Parsed items:', parsedItems.length);
          setItems(parsedItems);

          // メーカーと機種の重複を削除したリストを作成
          const uniqueManufacturers = [...new Set(parsedItems.map(item => item.manufacturer).filter(Boolean))];
          const uniqueModelTypes = [...new Set(parsedItems.map(item => item.modelType).filter(Boolean))];

          console.log('Unique manufacturers:', uniqueManufacturers);
          console.log('Unique model types:', uniqueModelTypes);

          setManufacturers(['すべて', ...uniqueManufacturers]);
          setModelTypes(['すべて', ...uniqueModelTypes]);

          // フィルタリングされたアイテムの初期設定
          setFilteredItems(parsedItems);

          // データが取得できたことを示す
          setShowTable(true);
        }
      })
      .catch(err => {
        console.error('データの読み込みに失敗しました:', err);
      });
  }, []);

  // メーカーと機種の選択が変更された時のフィルタリング
  useEffect(() => {
    if (!items.length) return;

    console.log('Filtering with manufacturer:', selectedManufacturer, 'model type:', selectedModelType);

    let filtered = [...items];

    if (selectedManufacturer !== 'すべて') {
      filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
    }

    if (selectedModelType !== 'すべて') {
      filtered = filtered.filter(item => item.modelType === selectedModelType);
    }

    console.log('Filtered items count:', filtered.length);
    setFilteredItems(filtered);
  }, [selectedManufacturer, selectedModelType, items]);

  // 点検結果を更新する関数
  const updateResult = (id: string, result: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, result } : item
    );
    setItems(updatedItems);
    setFilteredItems(prev => updatedItems.filter(item => item.manufacturer === selectedManufacturer && item.modelType === selectedModelType));
    setHasChanges(true);
  };

  // 変更を保存する関数
  const saveResults = () => {
    // APIに保存処理を実装する（実際の実装では）
    console.log('保存するデータ:', items);

    // 保存成功を通知
    toast({
      title: "点検結果を保存しました",
      description: "点検結果が正常に保存されました。",
    });

    setHasChanges(false);
  };

  // CSVエクスポート関数
  const exportCSV = () => {
    const headers = ['製造メーカー', '機種', 'エンジン型式', '部位', '装置', '確認箇所', '判断基準', '確認要領', '点検結果'];

    const rows = filteredItems.map(item => [
      item.manufacturer,
      item.modelType,
      item.engineType,
      item.part,
      item.device,
      item.checkPoint,
      item.judgmentCriteria,
      item.checkMethod,
      item.result || '未実施'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `点検結果_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSVをエクスポートしました",
      description: "点検結果をCSVファイルとしてダウンロードしました。",
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isExpanded={isMenuExpanded} setIsExpanded={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">仕業点検</h1>

          {/* コンテンツをここに追加する */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 左側のセレクター */}
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manufacturer">製造メーカー</Label>
                  <Select
                    value={selectedManufacturer}
                    onValueChange={setSelectedManufacturer}
                  >
                    <SelectTrigger id="manufacturer">
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
                  <Label htmlFor="model">機種</Label>
                  <Select
                    value={selectedModelType}
                    onValueChange={setSelectedModelType}
                  >
                    <SelectTrigger id="model">
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
            </div>

            {/* 右側のボタン */}
            <div className="flex items-end justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  // リセット処理
                  setSelectedManufacturer('すべて');
                  setSelectedModelType('すべて');
                  setFilteredItems([]);
                  setShowTable(false);
                }}
              >
                リセット
              </Button>
              <Button
                disabled={!hasChanges}
                onClick={() => {
                  // 保存処理
                  console.log("保存しました");
                  setHasChanges(false);
                }}
              >
                保存
              </Button>
            </div>
          </div>

          {/* ここにテーブルや点検データを表示する */}
          <div className="mt-6">
            {filteredItems.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/12">製造メーカー</TableHead>
                      <TableHead className="w-1/12">機種</TableHead>
                      <TableHead className="w-1/12">エンジン型式</TableHead>
                      <TableHead className="w-1/12">部位</TableHead>
                      <TableHead className="w-1/12">装置</TableHead>
                      <TableHead className="w-1/6">確認箇所</TableHead>
                      <TableHead className="w-1/6">判断基準</TableHead>
                      <TableHead className="w-1/6">確認要領</TableHead>
                      <TableHead className="w-1/12">状態</TableHead>
                      <TableHead className="w-1/12">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.manufacturer}</TableCell>
                        <TableCell>{item.modelType}</TableCell>
                        <TableCell>{item.engineType}</TableCell>
                        <TableCell>{item.part}</TableCell>
                        <TableCell>{item.device}</TableCell>
                        <TableCell>{item.checkPoint}</TableCell>
                        <TableCell>{item.judgmentCriteria}</TableCell>
                        <TableCell>{item.checkMethod}</TableCell>
                        <TableCell>
                          <Select
                            value={item.result}
                            onValueChange={(value) => {
                              const newItems = [...items];
                              const index = newItems.findIndex(i => i.id === item.id);
                              if (index !== -1) {
                                newItems[index] = { ...newItems[index], result: value };
                                setItems(newItems);
                                setFilteredItems(prev => {
                                  const prevIndex = prev.findIndex(i => i.id === item.id);
                                  if (prevIndex !== -1) {
                                    const newFilteredItems = [...prev];
                                    newFilteredItems[prevIndex] = { ...newFilteredItems[prevIndex], result: value };
                                    return newFilteredItems;
                                  }
                                  return prev;
                                });
                                setHasChanges(true);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="正常">正常</SelectItem>
                              <SelectItem value="注意">注意</SelectItem>
                              <SelectItem value="要修理">要修理</SelectItem>
                              <SelectItem value="未実施">未実施</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {/* アクションボタンを追加 */}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">データが見つかりませんでした。</div>
                <div className="text-sm text-gray-400 mt-2">製造メーカーと機種の選択を確認してください。</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}