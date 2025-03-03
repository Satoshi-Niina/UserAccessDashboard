
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loader2 } from 'lucide-react';

interface InspectionItem {
  メーカー: string;
  機種: string;
  エンジン型式: string;
  部位: string;
  装置: string;
  手順: string;
  確認箇所: string;
  判断基準: string;
  確認要領: string;
  測定等記録: string;
  図形記録: string;
}

export default function InspectionItems() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMaker, setFilterMaker] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");

  // 一意のメーカーと機種のリストを取得
  const uniqueMakers = [...new Set(items.map(item => item.メーカー))].filter(Boolean).sort();
  const uniqueModels = [...new Set(items.map(item => item.機種))].filter(Boolean).sort();

  // フィルタリングされたアイテム
  const filteredItems = items.filter(item => 
    (filterMaker === "all" || item.メーカー === filterMaker) &&
    (filterModel === "all" || item.機種 === filterModel)
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/inspection-items', {
          headers: { 'Cache-Control': 'no-cache' }
        });

        // CSVテキストをJSONに変換
        const lines = response.data.split('\n');
        const headers = lines[0].split(',');

        const parsedData = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',');
          const item: any = {};
          headers.forEach((header, index) => {
            item[header] = values[index] || '';
          });
          return item;
        });

        setItems(parsedData);
        setError(null);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('点検項目データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">点検項目データを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">点検項目マスタ</h2>
          <div className="flex space-x-4 mb-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">製造メーカー</label>
              <Select value={filterMaker} onValueChange={setFilterMaker}>
                <SelectTrigger>
                  <SelectValue placeholder="すべてのメーカー" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのメーカー</SelectItem>
                  {uniqueMakers.map(maker => (
                    <SelectItem key={maker} value={maker}>{maker}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">機種</label>
              <Select value={filterModel} onValueChange={setFilterModel}>
                <SelectTrigger>
                  <SelectValue placeholder="すべての機種" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての機種</SelectItem>
                  {uniqueModels.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border rounded-md overflow-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary">
              <TableRow>
                <TableHead className="min-w-[120px]">メーカー</TableHead>
                <TableHead className="min-w-[120px]">機種</TableHead>
                <TableHead className="min-w-[150px]">エンジン型式</TableHead>
                <TableHead className="min-w-[100px]">部位</TableHead>
                <TableHead className="min-w-[100px]">装置</TableHead>
                <TableHead className="min-w-[150px]">確認箇所</TableHead>
                <TableHead className="min-w-[200px]">判断基準</TableHead>
                <TableHead className="min-w-[200px]">確認要領</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.メーカー}</TableCell>
                    <TableCell>{item.機種}</TableCell>
                    <TableCell>{item.エンジン型式}</TableCell>
                    <TableCell>{item.部位}</TableCell>
                    <TableCell>{item.装置}</TableCell>
                    <TableCell>{item.確認箇所}</TableCell>
                    <TableCell>{item.判断基準}</TableCell>
                    <TableCell>{item.確認要領}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    該当する点検項目がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
