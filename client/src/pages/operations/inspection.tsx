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
    // APIから点検データを取得
    fetch('/api/inspection-data')
      .then(res => res.text())
      .catch((error) => {
        console.error("点検データ取得エラー:", error);
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

          setItems(parsedItems);

          // メーカーと機種のリストを作成
          const mfrs = Array.from(new Set(parsedItems.map(item => item.manufacturer).filter(Boolean)));
          const models = Array.from(new Set(parsedItems.map(item => item.modelType).filter(Boolean)));

          setManufacturers(['すべて', ...mfrs]);
          setModelTypes(['すべて', ...models]);
        }
      })
      .catch(err => {
        console.error('データの読み込みに失敗しました:', err);
      });
  }, []);

  // メーカーと機種の両方が選択されたらテーブルを表示する
  useEffect(() => {
    if (selectedManufacturer !== 'すべて' && selectedModelType !== 'すべて') {
      let filtered = [...items];
      filtered = filtered.filter(item => 
        item.manufacturer === selectedManufacturer && 
        item.modelType === selectedModelType
      );
      setFilteredItems(filtered);
      setShowTable(true);
    } else {
      setShowTable(false);
    }
  }, [selectedManufacturer, selectedModelType, items]);

  // 点検結果を更新する関数
  const updateResult = (id: string, result: string) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, result } : item
    );
    setItems(updatedItems);
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
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">仕業点検</h1>
            <ExitButton /> {/* Exit button styling needs to be updated separately in CSS */}
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
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
                      {manufacturers.map(mfr => (
                        <SelectItem key={mfr} value={mfr}>{mfr}</SelectItem>
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
                    <SelectTrigger>
                      <SelectValue placeholder="機種を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelTypes.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showTable && (
                <>
                  <div className="flex justify-between mb-4">
                    <Tabs defaultValue="all">
                      <TabsList>
                        <TabsTrigger value="all">すべて</TabsTrigger>
                        <TabsTrigger value="engine">エンジン</TabsTrigger>
                        <TabsTrigger value="transmission">動力伝達</TabsTrigger>
                        <TabsTrigger value="brake">制動装置</TabsTrigger>
                        <TabsTrigger value="electric">電気装置</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={exportCSV}>
                        <FileText className="h-4 w-4 mr-2" />
                        レポート出力
                      </Button>
                      <Button onClick={saveResults} disabled={!hasChanges}>
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>部位</TableHead>
                          <TableHead>装置</TableHead>
                          <TableHead>確認箇所</TableHead>
                          <TableHead>判断基準</TableHead>
                          <TableHead>確認要領</TableHead>
                          <TableHead className="w-32">点検結果</TableHead>
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
                              <TableCell>{item.checkMethod}</TableCell>
                              <TableCell>
                                <Select 
                                  value={item.result || '未実施'} 
                                  onValueChange={(value) => updateResult(item.id, value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="未実施">未実施</SelectItem>
                                    <SelectItem value="良好">良好</SelectItem>
                                    <SelectItem value="注意">注意</SelectItem>
                                    <SelectItem value="不良">不良</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              選択した製造メーカーと機種に一致する点検項目がありません。
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {!showTable && (
                <div className="border rounded-md p-6 text-center">
                  <p className="text-lg">製造メーカーと機種を選択すると、点検項目編集で生成されたデータが表示されます。</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}