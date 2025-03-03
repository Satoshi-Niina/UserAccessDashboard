
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Papa from 'papaparse';

interface InspectionItem {
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
}

export default function Inspection({ onChanges }: { onChanges?: (hasChanges: boolean) => void }) {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
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
        console.log("API呼び出し: /api/inspection-items");
        const response = await fetch('/api/inspection-items');
        if (!response.ok) {
          throw new Error(`API エラー: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log("CSV読み込み成功:", csvText.slice(0, 100) + "...");
        
        // Papaを使用してCSVをパース
        const { data } = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });
        
        console.log("パース結果:", data.slice(0, 2));
        
        setItems(data as InspectionItem[]);
        
        // 製造メーカーと機種のリストを抽出
        const uniqueManufacturers = Array.from(new Set(data.map((item: any) => item['製造メーカー']).filter(Boolean)));
        const uniqueModels = Array.from(new Set(data.map((item: any) => item['機種']).filter(Boolean)));
        
        console.log("メーカーリスト:", uniqueManufacturers);
        console.log("機種リスト:", uniqueModels);
        
        setManufacturers(uniqueManufacturers);
        setModels(uniqueModels);
      } catch (error) {
        console.error("データ取得エラー:", error);
        toast({
          title: "データ読み込みエラー",
          description: `${error}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, [toast]);

  // フィルター効果
  useEffect(() => {
    if (items.length === 0) return;
    
    let filtered = [...items];
    
    if (selectedManufacturer !== "all") {
      filtered = filtered.filter(item => item['製造メーカー'] === selectedManufacturer);
    }
    
    if (selectedModel !== "all") {
      filtered = filtered.filter(item => item['機種'] === selectedModel);
    }
    
    setFilteredItems(filtered);
    console.log("フィルター適用後:", filtered.length, "件");
  }, [items, selectedManufacturer, selectedModel]);
  
  // 選択されたメーカーが変更されたら関連する機種を更新
  useEffect(() => {
    if (selectedManufacturer !== "all") {
      const relatedModels = Array.from(
        new Set(
          items
            .filter(item => item['製造メーカー'] === selectedManufacturer)
            .map(item => item['機種'])
            .filter(Boolean)
        )
      );
      setModels(relatedModels);
      if (!relatedModels.includes(selectedModel) && selectedModel !== "all") {
        setSelectedModel("all");
      }
    } else {
      const allModels = Array.from(new Set(items.map(item => item['機種']).filter(Boolean)));
      setModels(allModels);
    }
  }, [selectedManufacturer, items, selectedModel]);

  const handleResultChange = (itemIndex: number, value: string) => {
    const key = `${itemIndex}`;
    setResults(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    if (onChanges) onChanges(true);
  };

  const handleCommentChange = (itemIndex: number, value: string) => {
    const key = `${itemIndex}`;
    setComments(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    if (onChanges) onChanges(true);
  };
  
  // データ保存
  const saveInspectionData = async () => {
    try {
      // ここで実際のデータ保存APIを呼び出す
      // 例: await fetch('/api/save-inspection', { method: 'POST', body: JSON.stringify({ results, comments }) });
      
      toast({
        title: "保存完了",
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

  if (loading) {
    return <div className="p-4 text-center">データを読み込み中...</div>;
  }

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
            <div>
              <label className="text-sm font-medium mb-1 block">運用計画</label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="運用計画を入力"
              />
            </div>
          </div>
          
          <div className="flex justify-between mb-4">
            <Button variant="outline" onClick={searchPastData}>
              過去のデータを検索
            </Button>
            <Button onClick={saveInspectionData} disabled={!hasChanges}>
              保存
            </Button>
          </div>
          
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
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item['部位']}</TableCell>
                      <TableCell>{item['装置']}</TableCell>
                      <TableCell>{item['確認箇所']}</TableCell>
                      <TableCell>{item['判断基準']}</TableCell>
                      <TableCell>{item['確認要領']}</TableCell>
                      <TableCell>
                        <Select
                          value={results[index] || ""}
                          onValueChange={(value) => handleResultChange(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="結果を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="good">良好</SelectItem>
                            <SelectItem value="caution">要注意</SelectItem>
                            <SelectItem value="bad">不良</SelectItem>
                            <SelectItem value="na">該当なし</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={comments[index] || ""}
                          onChange={(e) => handleCommentChange(index, e.target.value)}
                          placeholder="コメント"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      該当するデータがありません。フィルター条件を変更してください。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
