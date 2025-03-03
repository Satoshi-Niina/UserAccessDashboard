
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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

export default function OperationalPlan() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
            '図形記録': 'graphicRecord',
          };

          const parsedItems = lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.split(',').map(v => v.trim());
              const item: any = { id: `item-${index + 1}`, order: index + 1 };

              headers.forEach((header, i) => {
                const field = headerMap[header] || header;
                item[field] = values[i] || '';
              });

              return item as InspectionItem;
            });

          // メーカーと機種の重複を削除したリストを作成
          const uniqueManufacturers = [...new Set(parsedItems.map(item => item.manufacturer).filter(Boolean))];
          const uniqueModelTypes = [...new Set(parsedItems.map(item => item.modelType).filter(Boolean))];

          setItems(parsedItems);
          setManufacturers(['すべて', ...uniqueManufacturers]);
          setModelTypes(['すべて', ...uniqueModelTypes]);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 表示するデータをグループ化
  const groupedData = items.reduce((acc, item) => {
    const key = `${item.manufacturer || '未分類'}-${item.modelType || '未分類'}`;
    if (!acc[key]) {
      acc[key] = {
        manufacturer: item.manufacturer || '未分類',
        modelType: item.modelType || '未分類',
        count: 0,
        items: []
      };
    }
    acc[key].count++;
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { manufacturer: string, modelType: string, count: number, items: InspectionItem[] }>);

  // データをメーカー・機種ごとにグループ化して配列化
  const groupedArray = Object.values(groupedData);

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">データを読み込み中...</span>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">機種別運用計画データ</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>製造メーカー</TableHead>
                  <TableHead>機種</TableHead>
                  <TableHead>点検項目数</TableHead>
                  <TableHead>最終更新</TableHead>
                  <TableHead>状態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedArray.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      データがありません。まずは設定メニューから点検項目を登録してください。
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedArray.map((group, index) => (
                    <TableRow key={index}>
                      <TableCell>{group.manufacturer}</TableCell>
                      <TableCell>{group.modelType}</TableCell>
                      <TableCell>{group.count}項目</TableCell>
                      <TableCell>{new Date().toLocaleDateString('ja-JP')}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          利用可能
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
