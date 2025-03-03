
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Save, Search } from "lucide-react";

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
  
  // CSVデータの読み込み
  useEffect(() => {
    const fetchInspectionItems = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/inspection-items');
        if (!response.ok) {
          throw new Error(`API エラー: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log("CSV読み込み成功:", csvText.slice(0, 100) + "..."); // デバッグ用
        
        // CSVをパース
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        
        const parsedItems: InspectionItem[] = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue;
          
          const values = rows[i].split(',');
          const item: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            item[header.trim()] = values[index]?.trim() || '';
          });
          
          parsedItems.push(item as InspectionItem);
        }
        
        setItems(parsedItems);
        console.log("パース完了:", parsedItems.length, "件のデータ");
      } catch (err) {
        console.error("データ読み込みエラー:", err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        
        // エラー時にデモデータをセット
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  // 製造メーカーと機種のリストを抽出
  const manufacturers = Array.from(new Set(items.map(item => item.製造メーカー))).filter(Boolean);
  const models = Array.from(new Set(items
    .filter(item => selectedManufacturer === "all" || item.製造メーカー === selectedManufacturer)
    .map(item => item.機種)))
    .filter(Boolean);

  // フィルター適用
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
      toast({
        title: "点検結果を保存しました",
        description: `${filteredItems.length}件のデータを保存しました`,
      });
      setHasChanges(false);
      if (onChanges) onChanges(false);
    } catch (error) {
      toast({
        title: "保存に失敗しました",
        description: "エラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    }
  };
  
  // 過去データ検索
  const searchPastData = () => {
    toast({
      title: "過去データの検索",
      description: "この機能は現在実装中です。",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>仕業点検</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">製造メーカー</label>
              <Select
                value={selectedManufacturer}
                onValueChange={setSelectedManufacturer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {manufacturers.map((manufacturer, index) => (
                    <SelectItem key={index} value={manufacturer}>
                      {manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">機種</label>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {models.map((model, index) => (
                    <SelectItem key={index} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={saveResults} disabled={!hasChanges} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
              <Button variant="outline" onClick={searchPastData} className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                検索
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">データを読み込み中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">点検項目がありません。メーカーと機種を選択してください。</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>部位</TableHead>
                    <TableHead>装置</TableHead>
                    <TableHead>確認箇所</TableHead>
                    <TableHead>判断基準</TableHead>
                    <TableHead>確認要領</TableHead>
                    <TableHead className="w-[120px]">結果</TableHead>
                    <TableHead className="w-[200px]">コメント</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.部位}</TableCell>
                      <TableCell>{item.装置}</TableCell>
                      <TableCell>{item.確認箇所}</TableCell>
                      <TableCell>{item.判断基準}</TableCell>
                      <TableCell>{item.確認要領}</TableCell>
                      <TableCell>
                        <Select
                          value={results[index] || ""}
                          onValueChange={(value) => handleResultChange(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OK">OK</SelectItem>
                            <SelectItem value="NG">NG</SelectItem>
                            <SelectItem value="NA">対象外</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={comments[index] || ""}
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
    </div>
  );
}
