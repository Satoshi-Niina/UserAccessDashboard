import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

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

  // 初期データの読み込み
  useEffect(() => {
    fetch('/api/inspection-items')
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

          setItems(parsedItems);

          // メーカーと機種のリストを作成
          const mfrs = Array.from(new Set(parsedItems.map(item => item.manufacturer).filter(Boolean)));
          const models = Array.from(new Set(parsedItems.map(item => item.modelType).filter(Boolean)));

          setManufacturers(['すべて', ...mfrs]);
          setModelTypes(['すべて', ...models]);
        } else {
          // サンプルデータ設定
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
              order: 1,
              result: '未実施'
            },
            {
              id: 'item-2',
              manufacturer: '堀川工機',
              modelType: 'MC300',
              engineType: 'ボルボ',
              part: 'エンジン',
              device: '本体',
              procedure: '',
              checkPoint: '排気及び吸気',
              judgmentCriteria: '排気ガス色及びガス漏れ等の点検（マフラー等）',
              checkMethod: 'ほぼ透明の薄紫',
              measurement: '',
              graphicRecord: '',
              order: 2,
              result: '未実施'
            },
          ];
          setItems(sampleItems);
          setManufacturers(['すべて', '堀川工機']);
          setModelTypes(['すべて', 'MC300']);
        }
      })
      .catch(err => {
        console.error('データの読み込みに失敗しました:', err);
        toast({
          title: "エラー",
          description: "データの読み込みに失敗しました",
          variant: "destructive"
        });
      });
  }, []);

  // フィルタリング
  useEffect(() => {
    let filtered = [...items];

    if (selectedManufacturer !== 'すべて') {
      filtered = filtered.filter(item => item.manufacturer === selectedManufacturer);
    }

    if (selectedModelType !== 'すべて') {
      filtered = filtered.filter(item => item.modelType === selectedModelType);
    }

    setFilteredItems(filtered);
  }, [items, selectedManufacturer, selectedModelType]);

  // 点検結果の更新
  const updateResult = (id: string, result: string) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, result } : item
    );

    setItems(updatedItems);
    setHasChanges(true);
  };

  // 変更の保存
  const saveChanges = () => {
    // ここで実際のAPIを呼び出して保存する
    console.log('保存するデータ:', items);

    // モック処理
    setTimeout(() => {
      setHasChanges(false);
      toast({
        title: "保存完了",
        description: "点検結果を保存しました",
      });
    }, 500);
  };

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle>仕業点検</CardTitle>
      </CardHeader>

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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="正常">正常</SelectItem>
                            <SelectItem value="不良">不良</SelectItem>
                            <SelectItem value="要注意">要注意</SelectItem>
                            <SelectItem value="未実施">未実施</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      データがありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex justify-end mt-4">
          <Button onClick={saveChanges}>保存</Button>
        </div>
      )}
    </div>
  );
}