
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// 点検項目の型定義
type InspectionItem = {
  製造メーカー: string;
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

export default function Inspection({ onChanges }: { onChanges?: (hasChanges: boolean) => void }) {
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
  
  // 製造メーカーと機種のリストを抽出
  const manufacturers = Array.from(new Set(items.map(item => item.製造メーカー))).filter(Boolean);
  const models = Array.from(new Set(items
    .filter(item => selectedManufacturer === "all" || item.製造メーカー === selectedManufacturer)
    .map(item => item.機種)))
    .filter(Boolean);

  // コンポーネントのマウント時にCSVからデータを読み込む
  useEffect(() => {
    // CSVデータを取得する関数
    const fetchData = async () => {
      try {
        // サーバーからCSVデータを取得
        const response = await fetch('/api/inspection-items');
        
        if (!response.ok) {
          throw new Error('CSVデータの取得に失敗しました');
        }
        
        const data = await response.json();
        setItems(data);
        setLoading(false);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        setLoading(false);
      }
    };

    fetchData();

    // コンポーネントのアンマウント時にhasChangesを更新
    return () => {
      if (onChanges && hasChanges) {
        onChanges(false);
      }
    };
  }, []);

  // 選択された製造メーカーと機種に基づいてデータをフィルタリング
  useEffect(() => {
    if (loading) return;
    
    let filtered = [...items];
    
    if (selectedManufacturer !== "all") {
      filtered = filtered.filter(item => item.製造メーカー === selectedManufacturer);
    }
    
    if (selectedModel !== "all") {
      filtered = filtered.filter(item => item.機種 === selectedModel);
    }
    
    setFilteredItems(filtered);
  }, [selectedManufacturer, selectedModel, items, loading]);

  // 結果の変更を追跡
  const handleResultChange = (itemIndex: number, value: string) => {
    const key = `${itemIndex}`;
    setResults(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    if (onChanges) onChanges(true);
  };

  // コメントの変更を追跡
  const handleCommentChange = (itemIndex: number, value: string) => {
    const key = `${itemIndex}`;
    setComments(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    if (onChanges) onChanges(true);
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
      if (onChanges) onChanges(false);
    } catch (err) {
      console.error('保存エラー:', err);
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : '不明なエラーが発生しました',
      });
    }
  };

  // 過去の点検履歴を表示
  const showHistory = async () => {
    try {
      toast({
        title: "履歴表示",
        description: "点検履歴を表示します",
      });
      // TODO: 履歴表示のロジックを実装
    } catch (err) {
      console.error('履歴表示エラー:', err);
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : '不明なエラーが発生しました',
      });
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">運用管理</h1>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">仕業点検</h2>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">点検項目編集のデータを読み込み表示</h3>
                <p className="text-sm text-muted-foreground mb-4">メーカーと機種を選択して点検項目を表示します。</p>
              </div>
              
              <div className="flex space-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">製造メーカー</label>
                  <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                    <SelectTrigger>
                      <SelectValue placeholder="メーカーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
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
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="機種を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mb-4">
                <Button variant="outline" onClick={showHistory}>
                  履歴
                </Button>
                <Button onClick={saveResults}>
                  保存
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-6">データを読み込み中...</div>
              ) : error ? (
                <div className="text-center py-6 text-red-500">{error}</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-6">該当する点検項目がありません</div>
              ) : (
                <div className="overflow-auto max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">製造メーカー</TableHead>
                        <TableHead className="w-[100px]">機種</TableHead>
                        <TableHead className="w-[150px]">部位</TableHead>
                        <TableHead className="w-[150px]">装置</TableHead>
                        <TableHead className="w-[200px]">確認箇所</TableHead>
                        <TableHead className="w-[200px]">判断基準</TableHead>
                        <TableHead className="w-[100px]">結果</TableHead>
                        <TableHead className="w-[200px]">コメント</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.製造メーカー}</TableCell>
                          <TableCell>{item.機種}</TableCell>
                          <TableCell>{item.部位}</TableCell>
                          <TableCell>{item.装置}</TableCell>
                          <TableCell>{item.確認箇所}</TableCell>
                          <TableCell>{item.判断基準}</TableCell>
                          <TableCell>
                            <Select 
                              value={results[`${index}`] || ""} 
                              onValueChange={(value) => handleResultChange(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="選択" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="good">良好</SelectItem>
                                <SelectItem value="fair">やや不良</SelectItem>
                                <SelectItem value="poor">不良</SelectItem>
                                <SelectItem value="na">対象外</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={comments[`${index}`] || ""}
                              onChange={(e) => handleCommentChange(index, e.target.value)}
                              placeholder="コメント"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
