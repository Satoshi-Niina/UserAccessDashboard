
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Papa from 'papaparse';

// 点検項目の型定義
type InspectionItem = {
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
  [key: string]: string;
};

export default function Inspection() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [results, setResults] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // 点検項目データの読み込み
  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        setLoading(true);
        // サーバーから点検項目データを取得
        const response = await fetch('/api/inspection-items');
        
        if (!response.ok) {
          throw new Error('点検項目データの取得に失敗しました');
        }
        
        const text = await response.text();
        
        // CSVをパース
        const parsedData = Papa.parse<InspectionItem>(text, {
          header: true,
          skipEmptyLines: true
        });
        
        if (parsedData.errors.length > 0) {
          console.error('CSVパースエラー:', parsedData.errors);
          throw new Error('CSVデータの解析に失敗しました');
        }
        
        console.log('取得したデータ:', parsedData.data);
        
        setItems(parsedData.data);
        setFilteredItems(parsedData.data);
        setError(null);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '点検項目データの取得中にエラーが発生しました');
        toast({
          title: "データ取得エラー",
          description: err instanceof Error ? err.message : '点検項目データの取得中にエラーが発生しました',
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  // メーカーまたは機種の選択が変更されたときにフィルタリング
  useEffect(() => {
    if (items.length === 0) return;

    let filtered = [...items];
    
    if (selectedManufacturer !== "all") {
      filtered = filtered.filter(item => item.メーカー === selectedManufacturer);
    }
    
    if (selectedModel !== "all") {
      filtered = filtered.filter(item => item.機種 === selectedModel);
    }
    
    setFilteredItems(filtered);
  }, [selectedManufacturer, selectedModel, items]);

  // 結果の変更を追跡
  const handleResultChange = (key: string, value: string) => {
    setResults(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // コメントの変更を追跡
  const handleCommentChange = (key: string, value: string) => {
    setComments(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // 点検結果の保存
  const saveResults = async () => {
    try {
      // TODO: 点検結果の保存APIを実装
      // const response = await fetch('/api/inspection-results', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     results,
      //     comments,
      //     manufacturer: selectedManufacturer,
      //     model: selectedModel,
      //     timestamp: new Date().toISOString()
      //   }),
      // });
      
      // if (!response.ok) {
      //   throw new Error('点検結果の保存に失敗しました');
      // }
      
      toast({
        title: "保存完了",
        description: "点検結果を保存しました",
      });
      
      setHasChanges(false);
    } catch (err) {
      console.error('保存エラー:', err);
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "点検結果の保存中にエラーが発生しました",
        variant: "destructive"
      });
    }
  };

  // 履歴検索
  const searchHistory = () => {
    toast({
      title: "履歴検索",
      description: "履歴検索機能は開発中です",
    });
  };

  // 一意のメーカーと機種のリストを取得
  const uniqueManufacturers = ["all", ...new Set(items.map(item => item.メーカー))].filter(Boolean);
  const uniqueModels = ["all", ...new Set(items.map(item => item.機種))].filter(Boolean);

  // アイテムのユニークキーを生成
  const getItemKey = (item: InspectionItem) => {
    return `${item.メーカー}|${item.機種}|${item.部位}|${item.装置}|${item.確認箇所}`;
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">運用管理</h1>
            <Button variant="outline" onClick={() => window.history.back()}>
              終了
            </Button>
          </div>

          <div className="flex space-x-4 mb-6">
            <Button variant="outline" className="flex-1" onClick={() => {}}>
              仕業点検
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => {}}>
              運用計画
            </Button>
          </div>

          <Button variant="outline" className="mb-6" onClick={() => {}}>
            点検項目編集のデータを読み込み
          </Button>

          <h2 className="text-2xl font-bold mb-4">仕業点検</h2>
          <p className="mb-6">メーカーと機種を選択して点検項目を表示します。</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">製造メーカー</label>
              <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                <SelectTrigger>
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueManufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer} value={manufacturer}>
                      {manufacturer === "all" ? "すべて" : manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">機種</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model === "all" ? "すべて" : model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mb-6">
            <Button 
              variant="outline"
              className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
              onClick={searchHistory}
            >
              履歴
            </Button>
            <Button 
              variant="outline"
              className="bg-orange-50 hover:bg-orange-100 border-orange-400"
              onClick={saveResults}
              disabled={!hasChanges}
            >
              保存
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">データを読み込み中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">選択したメーカーと機種の点検項目がありません</div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">点検部位</TableHead>
                        <TableHead className="w-[250px]">装置</TableHead>
                        <TableHead className="w-[250px]">確認箇所</TableHead>
                        <TableHead className="w-[300px]">判断基準</TableHead>
                        <TableHead className="w-[100px]">結果</TableHead>
                        <TableHead className="w-[200px]">コメント</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item, index) => {
                        const itemKey = getItemKey(item);
                        return (
                          <TableRow key={index}>
                            <TableCell>{item.部位}</TableCell>
                            <TableCell>{item.装置}</TableCell>
                            <TableCell>{item.確認箇所}</TableCell>
                            <TableCell>{item.判断基準}</TableCell>
                            <TableCell>
                              <Select
                                value={results[itemKey] || ""}
                                onValueChange={(value) => handleResultChange(itemKey, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ok">良好</SelectItem>
                                  <SelectItem value="ng">不良</SelectItem>
                                  <SelectItem value="na">該当なし</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={comments[itemKey] || ""}
                                onChange={(e) => handleCommentChange(itemKey, e.target.value)}
                                placeholder="コメント"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
