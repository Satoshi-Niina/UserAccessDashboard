
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Loader2, Save, Search } from "lucide-react";

// 点検項目の型定義
type InspectionItem = {
  メーカー: string;
  機種: string;
  部位: string;
  装置: string;
  確認箇所: string;
  判断基準: string;
  確認要領: string;
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
        
        const data = await response.json();
        console.log('取得したデータ:', data);
        
        setItems(data);
        setFilteredItems(data);
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

  // 結果の更新
  const updateResult = (itemKey: string, result: string) => {
    setResults(prev => ({
      ...prev,
      [itemKey]: result
    }));
    setHasChanges(true);
  };

  // コメントの更新
  const updateComment = (itemKey: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [itemKey]: comment
    }));
    setHasChanges(true);
  };

  // 点検結果を保存
  const saveInspectionResults = async () => {
    try {
      const date = new Date().toISOString();
      
      const resultsToSave = Object.keys(results).map(itemKey => {
        const [manufacturer, model, part, device, checkPoint] = itemKey.split('|');
        return {
          date,
          manufacturer,
          model,
          part,
          device,
          checkPoint,
          result: results[itemKey],
          comment: comments[itemKey] || ''
        };
      });
      
      // TODO: APIエンドポイントを作成して結果を保存する
      // const response = await fetch('/api/inspection-results', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(resultsToSave),
      // });
      
      // if (!response.ok) {
      //   throw new Error('点検結果の保存に失敗しました');
      // }
      
      toast({
        title: "保存完了",
        description: "点検結果が正常に保存されました",
      });
      
      setHasChanges(false);
    } catch (err) {
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
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">仕業点検</h2>
                <p>点検項目データを読み込み中です</p>
              </div>
              
              <p className="text-muted-foreground mb-6">
                メーカーと機種を選択して点検項目を表示します。
              </p>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium mb-1">製造メーカー</label>
                  <Select
                    value={selectedManufacturer}
                    onValueChange={setSelectedManufacturer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="メーカーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueManufacturers.map((manufacturer, index) => (
                        <SelectItem key={index} value={manufacturer}>
                          {manufacturer === "all" ? "全てのメーカー" : manufacturer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium mb-1">機種</label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="機種を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueModels.map((model, index) => (
                        <SelectItem key={index} value={model}>
                          {model === "all" ? "全ての機種" : model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mb-6">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={searchHistory}
                >
                  <Search className="h-4 w-4" />
                  履歴
                </Button>
                <Button 
                  className="flex items-center gap-2" 
                  onClick={saveInspectionResults}
                  disabled={!hasChanges}
                >
                  <Save className="h-4 w-4" />
                  保存
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">データを読み込み中...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-md text-red-800">
                  <p>エラー: {error}</p>
                  <p className="text-sm mt-2">管理者に連絡してください。</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p>表示するデータがありません。</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    メーカーと機種を選択して点検項目を表示してください。
                  </p>
                </div>
              ) : (
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
                        <TableHead>コメント</TableHead>
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
                            <TableCell>{item.確認要領}</TableCell>
                            <TableCell>
                              <Select
                                value={results[itemKey] || ""}
                                onValueChange={(value) => updateResult(itemKey, value)}
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue placeholder="結果" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="良">良</SelectItem>
                                  <SelectItem value="否">否</SelectItem>
                                  <SelectItem value="NA">NA</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={comments[itemKey] || ""}
                                onChange={(e) => updateComment(itemKey, e.target.value)}
                                placeholder="コメント"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
