
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Save, Filter } from "lucide-react";
import Papa from 'papaparse';
import { useToast } from "@/components/ui/use-toast";

type InspectionItem = {
  [key: string]: string;
};

export default function Inspection() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // CSVデータを読み込む
  useEffect(() => {
    setLoading(true);
    fetch('/api/inspection-items')
      .then(response => response.text())
      .then(csvData => {
        const results = Papa.parse(csvData, { header: true, skipEmptyLines: true });
        if (results.data && Array.isArray(results.data)) {
          const parsedItems = results.data as InspectionItem[];
          setItems(parsedItems);

          // メーカーと機種のリストを抽出
          const uniqueManufacturers = [...new Set(parsedItems.map(item => item.メーカー || item.製造メーカー).filter(Boolean))];
          const uniqueModels = [...new Set(parsedItems.map(item => item.機種).filter(Boolean))];
          
          setManufacturers(uniqueManufacturers);
          setModels(uniqueModels);
        }
      })
      .catch(err => {
        console.error('CSV読み込みエラー:', err);
        setError('データの読み込みに失敗しました');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // フィルタリング処理
  useEffect(() => {
    let filtered = [...items];
    
    if (selectedManufacturer !== "all") {
      filtered = filtered.filter(item => 
        (item.メーカー === selectedManufacturer) || (item.製造メーカー === selectedManufacturer)
      );
    }
    
    if (selectedModel !== "all") {
      filtered = filtered.filter(item => item.機種 === selectedModel);
    }
    
    setFilteredItems(filtered);
  }, [items, selectedManufacturer, selectedModel]);

  // 完了状態を切り替える
  const toggleCompleted = (id: string) => {
    setCompletedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // メモを更新
  const updateNote = (id: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // 保存機能
  const saveInspection = () => {
    // 実際の保存処理はここに実装
    // この例ではローカルストレージに保存
    const inspectionData = {
      date: new Date().toISOString(),
      manufacturer: selectedManufacturer,
      model: selectedModel,
      items: filteredItems.map(item => ({
        ...item,
        completed: completedItems[item.メーカー + item.機種 + item.部位] || false,
        note: notes[item.メーカー + item.機種 + item.部位] || ''
      }))
    };
    
    localStorage.setItem('inspectionData', JSON.stringify(inspectionData));
    
    toast({
      title: "保存完了",
      description: "点検データが正常に保存されました。",
    });
  };

  // CSVとしてエクスポート
  const exportToCsv = () => {
    const exportData = filteredItems.map(item => ({
      ...item,
      "点検完了": completedItems[item.メーカー + item.機種 + item.部位] ? "完了" : "未完了",
      "メモ": notes[item.メーカー + item.機種 + item.部位] || ''
    }));
    
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `仕業点検_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 点検項目をグループ化する
  const groupedItems = filteredItems.reduce((acc, item) => {
    const key = item.部位 || '未分類';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, InspectionItem[]>);

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">仕業点検</h1>
            <div className="flex gap-2">
              <Button onClick={saveInspection} className="gap-2">
                <Save className="h-4 w-4" />
                保存
              </Button>
              <Button variant="outline" onClick={exportToCsv} className="gap-2">
                <Download className="h-4 w-4" />
                CSVエクスポート
              </Button>
            </div>
          </div>

          {/* フィルター部分 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">フィルター</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">製造メーカー</label>
                  <Select
                    value={selectedManufacturer}
                    onValueChange={setSelectedManufacturer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="メーカーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべてのメーカー</SelectItem>
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
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="機種を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべての機種</SelectItem>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ローディング表示 */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* データ表示 */}
          {!loading && !error && (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <Card key={category} className="overflow-hidden">
                  <CardHeader className="bg-muted">
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">状態</TableHead>
                          <TableHead>メーカー</TableHead>
                          <TableHead>機種</TableHead>
                          <TableHead>装置</TableHead>
                          <TableHead>確認箇所</TableHead>
                          <TableHead>判断基準</TableHead>
                          <TableHead>確認要領</TableHead>
                          <TableHead className="w-[200px]">メモ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => {
                          const itemId = item.メーカー + item.機種 + item.部位;
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={completedItems[itemId] || false}
                                  onChange={() => toggleCompleted(itemId)}
                                  className="h-5 w-5"
                                />
                              </TableCell>
                              <TableCell>{item.メーカー || item.製造メーカー}</TableCell>
                              <TableCell>{item.機種}</TableCell>
                              <TableCell>{item.装置}</TableCell>
                              <TableCell>{item.確認箇所}</TableCell>
                              <TableCell>{item.判断基準}</TableCell>
                              <TableCell>{item.確認要領}</TableCell>
                              <TableCell>
                                <input
                                  type="text"
                                  value={notes[itemId] || ''}
                                  onChange={(e) => updateNote(itemId, e.target.value)}
                                  className="w-full p-1 border rounded"
                                  placeholder="メモを入力..."
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
              
              {filteredItems.length === 0 && !loading && (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">条件に一致する点検項目がありません。フィルターを変更してください。</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
