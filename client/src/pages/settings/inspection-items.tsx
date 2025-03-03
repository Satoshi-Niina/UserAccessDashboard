import { useState, useEffect } from "react";
import axios from "axios";

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
  const [filterMaker, setFilterMaker] = useState<string>("");
  const [filterModel, setFilterModel] = useState<string>("");

  // 一意のメーカーと機種のリストを取得
  const uniqueMakers = [...new Set(items.map(item => item.メーカー))].filter(Boolean).sort();
  const uniqueModels = [...new Set(items.map(item => item.機種))].filter(Boolean).sort();

  // フィルタリングされたアイテム
  const filteredItems = items.filter(item => 
    (filterMaker === "" || item.メーカー === filterMaker) &&
    (filterModel === "" || item.機種 === filterModel)
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

          return item as InspectionItem;
        });

        setItems(parsedData);
      } catch (err) {
        console.error('Data fetching error:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">点検項目マスタ管理</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">メーカー</label>
          <select
            className="border rounded px-3 py-2 w-48"
            value={filterMaker}
            onChange={(e) => setFilterMaker(e.target.value)}
          >
            <option value="">すべて</option>
            {uniqueMakers.map(maker => (
              <option key={maker} value={maker}>{maker}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">機種</label>
          <select
            className="border rounded px-3 py-2 w-48"
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
          >
            <option value="">すべて</option>
            {uniqueModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">メーカー</th>
                <th className="border px-4 py-2">機種</th>
                <th className="border px-4 py-2">エンジン型式</th>
                <th className="border px-4 py-2">部位</th>
                <th className="border px-4 py-2">装置</th>
                <th className="border px-4 py-2">確認箇所</th>
                <th className="border px-4 py-2">判断基準</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border px-4 py-2">{item.メーカー}</td>
                    <td className="border px-4 py-2">{item.機種}</td>
                    <td className="border px-4 py-2">{item.エンジン型式}</td>
                    <td className="border px-4 py-2">{item.部位}</td>
                    <td className="border px-4 py-2">{item.装置}</td>
                    <td className="border px-4 py-2">{item.確認箇所}</td>
                    <td className="border px-4 py-2">{item.判断基準}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="border px-4 py-8 text-center text-gray-500">
                    データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}