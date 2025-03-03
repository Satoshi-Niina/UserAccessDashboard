
import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Sidebar } from "@/components/layout/sidebar";
import { ExitButton } from "@/components/layout/exit-button";

// 点検項目のインターフェース
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
}

export default function Inspection() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('すべて');
  const [selectedModelType, setSelectedModelType] = useState<string>('すべて');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // 初期データの読み込み
  useEffect(() => {
    fetch('/api/inspection-items')
      .then(res => res.text())
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
            const item: any = { id: `item-${index + 1}`, order: index + 1 };
            
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
        } else {
          // サンプルデータを使用
          const sampleItems = [
            {
              id: 'item-1',
              manufacturer: '堀川工機',
              modelType: 'MC300',
              engineType: 'ボルボ',
              part: 'エンジン',
              device: '本体',
              procedure: '',
              checkPoint: 'エンジンヘッドカバー、ターボ',
              judgmentCriteria: 'オイル、燃料漏れ',
              checkMethod: 'オイル等滲み・垂れ跡が無',
              measurement: '',
              graphicRecord: '',
              order: 1
            },
            {
              id: 'item-2',
              manufacturer: '',
              modelType: '',
              engineType: '',
              part: 'エンジン',
              device: '本体',
              procedure: '',
              checkPoint: '排気及び吸気',
              judgmentCriteria: '排気ガス色及びガス漏れ等の点検（マフラー等）',
              checkMethod: 'ほぼ透明の薄紫',
              measurement: '',
              graphicRecord: '',
              order: 2
            },
          ];
          setItems(sampleItems);
          setManufacturers(['すべて', '堀川工機']);
          setModelTypes(['すべて', 'MC300']);
        }
      })
      .catch(err => {
        console.error('データの読み込みに失敗しました:', err);
        // サンプルデータを使用
        const sampleItems = [
          {
            id: 'item-1',
            manufacturer: '堀川工機',
            modelType: 'MC300',
            engineType: 'ボルボ',
            part: 'エンジン',
            device: '本体',
            procedure: '',
            checkPoint: 'エンジンヘッドカバー、ターボ',
            judgmentCriteria: 'オイル、燃料漏れ',
            checkMethod: 'オイル等滲み・垂れ跡が無',
            measurement: '',
            graphicRecord: '',
            order: 1
          },
        ];
        setItems(sampleItems);
        setManufacturers(['すべて', '堀川工機']);
        setModelTypes(['すべて', 'MC300']);
      });
  }, []);

  // フィルター後のアイテム
  const filteredItems = items.filter(item => {
    if (selectedManufacturer !== 'すべて' && item.manufacturer !== selectedManufacturer) {
      return false;
    }
    if (selectedModelType !== 'すべて' && item.modelType !== selectedModelType) {
      return false;
    }
    
    // タブによるフィルタリング
    if (activeTab === 'engine' && item.part === 'エンジン') return true;
    if (activeTab === 'transmission' && item.part === '動力伝達') return true;
    if (activeTab === 'brake' && (item.part === '制動装置' || item.part === '駐車ブレーキ')) return true;
    if (activeTab === 'electric' && item.part === '電気装置') return true;
    if (activeTab === 'all') return true;
    
    return false;
  });

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">仕業点検</h1>
            <ExitButton />
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="manufacturer">製造メーカー</Label>
                  <Select 
                    value={selectedManufacturer} 
                    onValueChange={setSelectedManufacturer}
                  >
                    <SelectTrigger id="manufacturer">
                      <SelectValue placeholder="製造メーカーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map(mfr => (
                        <SelectItem key={mfr} value={mfr}>{mfr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="modelType">機種</Label>
                  <Select 
                    value={selectedModelType} 
                    onValueChange={setSelectedModelType}
                  >
                    <SelectTrigger id="modelType">
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

              <div className="mb-4">
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="all">すべて</TabsTrigger>
                    <TabsTrigger value="engine">エンジン</TabsTrigger>
                    <TabsTrigger value="transmission">動力伝達</TabsTrigger>
                    <TabsTrigger value="brake">制動装置</TabsTrigger>
                    <TabsTrigger value="electric">電気装置</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">番号</TableHead>
                      <TableHead>部位</TableHead>
                      <TableHead>装置</TableHead>
                      <TableHead>確認箇所</TableHead>
                      <TableHead>判断基準</TableHead>
                      <TableHead>確認結果</TableHead>
                      <TableHead>備考</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="w-10">{index + 1}</TableCell>
                        <TableCell>{item.part}</TableCell>
                        <TableCell>{item.device}</TableCell>
                        <TableCell>{item.checkPoint}</TableCell>
                        <TableCell>{item.judgmentCriteria}</TableCell>
                        <TableCell>
                          <Select defaultValue="ok">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ok">良好</SelectItem>
                              <SelectItem value="ng">不良</SelectItem>
                              <SelectItem value="na">該当なし</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input placeholder="備考を入力" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" className="mr-2">キャンセル</Button>
                <Button>保存</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
