import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import Papa from 'papaparse';

interface InspectionItem {
  id: string;
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
  order: number;
}

export default function OperationalPlan() {
  // タイトルを設定
  useEffect(() => {
    document.title = "運用管理システム - 運用計画";
  }, []);

  const [items, setItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // 点検項目データの読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items?t=' + new Date().getTime());
        const csvText = await response.text();

        const { data } = Papa.parse<InspectionItem>(csvText, {
          header: true,
          skipEmptyLines: true,
        });

        // 項目をIDと順序で強化
        const enhancedItems = data.map((item, index) => ({
          ...item,
          id: `item-${index + 1}`,
          order: index + 1
        }));

        console.log("運用計画: データ読み込み成功", enhancedItems.length, "件");

        // メーカーとモデルタイプのリストを作成（空の値を確実に除外）
        const uniqueManufacturers = [...new Set(enhancedItems.map(item => item.メーカー).filter(value => value && value.trim() !== ''))];
        const uniqueModelTypes = [...new Set(enhancedItems.map(item => item.機種).filter(value => value && value.trim() !== ''))];

        setItems(enhancedItems);
        setManufacturers(uniqueManufacturers);
        setModelTypes(uniqueModelTypes);
      } catch (error) {
        console.error("運用計画: データ読み込みエラー", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">データを読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">運用計画</h2>
        <p className="mb-4">保守用車の運用計画を管理します。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>計画カレンダー</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>登録済み機械一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>メーカー</TableHead>
                  <TableHead>機種</TableHead>
                  <TableHead>作業状態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manufacturers.map((manufacturer, index) => (
                  <TableRow key={index}>
                    <TableCell>{manufacturer}</TableCell>
                    <TableCell>
                      {items
                        .filter(item => item.メーカー === manufacturer)
                        .map(item => item.機種)
                        .filter((value, index, self) => self.indexOf(value) === index)
                        .join(', ')}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}