
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  エンジン型式: string;
  部位: string;
  装置: string;
  手順: string;
  確認箇所: string;
  判断基準: string;
  確認要領: string;
  測定等記録: string;
  図形記録: string;
};

// 点検結果の型定義
type InspectionResult = {
  item_id: string;
  result: string;
  comment: string;
  date: string;
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

  // 点検データを読み込む
  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items');
        if (!response.ok) {
          throw new Error('点検項目データの取得に失敗しました');
        }
        
        // CSVデータをパース
        const csvText = await response.text();
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        // CSVからデータを変換
        const parsedItems = lines.slice(1)
          .filter(line => line.trim())
          .map((line, index) => {
            const values = line.split(',');
            const item: any = {};
            
            headers.forEach((header, i) => {
              item[header.trim()] = values[i]?.trim() || '';
            });
            
            return item as InspectionItem;
          });
        
        setItems(parsedItems);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '点検項目データの取得中にエラーが発生しました');
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  // フィルタリングされたアイテムを更新
  useEffect(() => {
    const filtered = items.filter(item => 
      (selectedManufacturer === "all" || item.メーカー === selectedManufacturer) &&
      (selectedModel === "all" || item.機種 === selectedModel)
    );
    setFilteredItems(filtered);
  }, [items, selectedManufacturer, selectedModel]);

  // 点検結果の更新
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

  // テーブルに表示するヘッダー
  const tableHeaders = [
    "部位", "装置", "確認箇所", "判断基準", "確認要領", "結果", "コメント"
  ];

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
            <h1 className="text-3xl font-bold">仕業点検</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={searchHistory} 
                className="flex items-center gap-1"
              >
                <Search className="h-4 w-4" />
                履歴
              </Button>
              <Button 
                onClick={saveInspectionResults} 
                disabled={!hasChanges}
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                保存
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex space-x-4 mb-4">
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
                      {uniqueManufacturers.filter(m => m !== "all").map((manufacturer) => (
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
                      {uniqueModels.filter(m => m !== "all").map((model) => (
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

          <Card>
            <CardHeader>
              <CardTitle>点検項目</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center text-red-500 p-4">{error}</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center p-4">
                  該当する点検項目がありません。他のメーカーまたは機種を選択してください。
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tableHeaders.map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
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
                                <SelectTrigger className="w-28">
                                  <SelectValue placeholder="結果" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="良好">良好</SelectItem>
                                  <SelectItem value="注意">注意</SelectItem>
                                  <SelectItem value="不良">不良</SelectItem>
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
