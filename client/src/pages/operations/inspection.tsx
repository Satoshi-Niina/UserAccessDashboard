
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Papa from 'papaparse';

type InspectionItem = {
  [key: string]: string;
};

export default function Inspection() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaker, setSelectedMaker] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // CSVデータの読み込み
  useEffect(() => {
    setLoading(true);
    fetch('/api/inspection-items')
      .then(response => response.text())
      .then(csvData => {
        const results = Papa.parse(csvData, { header: true, skipEmptyLines: true });
        if (results.data && Array.isArray(results.data)) {
          const parsedItems = results.data as InspectionItem[];
          setItems(parsedItems);
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

  // フィルターとカラム表示の変更を監視して表示アイテムを更新
  useEffect(() => {
    let filtered = [...items];
    
    // メーカーフィルター
    if (selectedMaker !== "all") {
      filtered = filtered.filter(item => item["メーカー"] === selectedMaker);
    }
    
    // 機種フィルター
    if (selectedModel !== "all") {
      filtered = filtered.filter(item => item["機種"] === selectedModel);
    }
    
    // 検索語句によるフィルター
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value.toLowerCase().includes(term)
        )
      );
    }
    
    setFilteredItems(filtered);
  }, [items, selectedMaker, selectedModel, searchTerm]);

  // 一意のメーカーリストの取得
  const uniqueMakers = [...new Set(items.map(item => item["メーカー"]))].filter(Boolean).sort();

  // 選択されたメーカーに基づく機種リストの取得
  const uniqueModels = [...new Set(
    items
      .filter(item => selectedMaker === "all" || item["メーカー"] === selectedMaker)
      .map(item => item["機種"])
  )].filter(Boolean).sort();

  // 点検項目の完了状態を切り替え
  const toggleItemCompletion = (index: number) => {
    setCompletedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 全項目の完了状態をリセット
  const resetAllCompletions = () => {
    setCompletedItems({});
  };

  // 印刷用にページを設定
  const handlePrint = () => {
    window.print();
  };

  // レポート生成（ここでは単純なCSVエクスポート）
  const handleGenerateReport = () => {
    // 完了状態を含めた新しい配列を作成
    const reportItems = filteredItems.map((item, index) => ({
      ...item,
      "点検済み": completedItems[index] ? "完了" : "未完了"
    }));
    
    const csv = Papa.unparse(reportItems);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '点検結果.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">仕業点検</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetAllCompletions}>
                リセット
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                印刷
              </Button>
              <Button onClick={handleGenerateReport}>
                レポート生成
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">メーカー</label>
                  <Select value={selectedMaker} onValueChange={setSelectedMaker}>
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
                <div>
                  <label className="block text-sm font-medium mb-1">機種</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
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
                <div>
                  <label className="block text-sm font-medium mb-1">検索</label>
                  <Input
                    placeholder="検索語句を入力..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="border rounded-md overflow-auto max-h-[600px] print:max-h-none">
                <Table>
                  <TableHeader className="sticky top-0 bg-secondary print:bg-white">
                    <TableRow>
                      <TableHead className="w-[50px] print:w-auto">完了</TableHead>
                      <TableHead className="min-w-[100px]">メーカー</TableHead>
                      <TableHead className="min-w-[100px]">機種</TableHead>
                      <TableHead className="min-w-[120px]">エンジン型式</TableHead>
                      <TableHead className="min-w-[100px]">部位</TableHead>
                      <TableHead className="min-w-[100px]">装置</TableHead>
                      <TableHead className="min-w-[150px]">確認箇所</TableHead>
                      <TableHead className="min-w-[200px]">判断基準</TableHead>
                      <TableHead className="min-w-[200px]">確認要領</TableHead>
                      <TableHead className="min-w-[150px]">備考</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-10">
                          データを読み込み中...
                        </TableCell>
                      </TableRow>
                    ) : filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-10">
                          表示するデータがありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item, index) => (
                        <TableRow key={index} className={completedItems[index] ? "bg-green-50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={completedItems[index] || false}
                              onCheckedChange={() => toggleItemCompletion(index)}
                              className="print:hidden"
                            />
                            <div className="hidden print:block">
                              {completedItems[index] ? "✓" : "□"}
                            </div>
                          </TableCell>
                          <TableCell>{item["メーカー"]}</TableCell>
                          <TableCell>{item["機種"]}</TableCell>
                          <TableCell>{item["エンジン型式"]}</TableCell>
                          <TableCell>{item["部位"]}</TableCell>
                          <TableCell>{item["装置"]}</TableCell>
                          <TableCell>{item["確認箇所"]}</TableCell>
                          <TableCell>{item["判断基準"]}</TableCell>
                          <TableCell>{item["確認要領"]}</TableCell>
                          <TableCell className="print:min-h-[30px]">{/* 現場での手書きメモ用 */}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 text-right">
                表示件数: {filteredItems.length} / {items.length}
              </div>
            </CardContent>
          </Card>

          {/* 印刷用スタイル */}
          <style jsx global>{`
            @media print {
              .sidebar, button, select, input[type="text"] {
                display: none !important;
              }
              body * {
                visibility: hidden;
              }
              .card, .card * {
                visibility: visible;
              }
              .card {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
          `}</style>
        </main>
      </div>
    </div>
  );
}
