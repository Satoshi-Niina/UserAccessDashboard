
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";

// 点検項目のインターフェース定義
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
  // 状態管理
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [operationalPlan, setOperationalPlan] = useState<string>("");
  const [checkResults, setCheckResults] = useState<Record<string, string>>({});
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
        console.log("CSV読み込み成功:", csvText.substring(0, 100) + "...");
        
        // CSVをパース
        const { data, errors } = Papa.parse<InspectionItem>(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        
        if (errors.length > 0) {
          console.error("CSVパースエラー:", errors);
          throw new Error("CSVデータの解析中にエラーが発生しました");
        }
        
        console.log("パース済みデータ:", data.length, "件");
        
        // データが正しくパースできたかチェック
        if (data.length === 0) {
          throw new Error("データが見つかりませんでした");
        }
        
        // メーカーと機種のリストを抽出
        const uniqueManufacturers = Array.from(new Set(data.map(item => item['製造メーカー']).filter(Boolean)));
        const uniqueModels = Array.from(new Set(data.map(item => item['機種']).filter(Boolean)));
        
        console.log("メーカー:", uniqueManufacturers);
        console.log("機種:", uniqueModels);
        
        setItems(data);
        setFilteredItems(data);
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

  // フィルターが変更されたときの処理
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
    if (items.length === 0) return;
    
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
      
      // 選択されていた機種が新しいメーカーに存在しない場合はリセット
      if (!relatedModels.includes(selectedModel) && selectedModel !== "all") {
        setSelectedModel("all");
      }
    } else {
      // すべてのメーカーが選択された場合は、すべての機種を表示
      const allModels = Array.from(new Set(items.map(item => item['機種']).filter(Boolean)));
      setModels(allModels);
    }
  }, [items, selectedManufacturer, selectedModel]);

  // 点検結果が変更されたときの処理
  const handleResultChange = (itemId: string, value: string) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: value
    }));
    
    if (!hasChanges) {
      setHasChanges(true);
      if (onChanges) onChanges(true);
    }
  };

  // コメントが変更されたときの処理
  const handleCommentChange = (itemId: string, value: string) => {
    setComments(prev => ({
      ...prev,
      [itemId]: value
    }));
    
    if (!hasChanges) {
      setHasChanges(true);
      if (onChanges) onChanges(true);
    }
  };

  // 運用計画が変更されたときの処理
  const handleOperationalPlanChange = (value: string) => {
    setOperationalPlan(value);
    
    if (!hasChanges) {
      setHasChanges(true);
      if (onChanges) onChanges(true);
    }
  };

  // 点検データを保存する関数
  const saveInspectionData = () => {
    // TODO: 実際のAPIエンドポイントを実装する
    toast({
      title: "保存成功",
      description: "点検データが保存されました",
    });
    
    setHasChanges(false);
    if (onChanges) onChanges(false);
  };

  // 過去のデータを検索する関数
  const searchPastData = () => {
    // TODO: 過去のデータ検索機能を実装する
    toast({
      title: "検索",
      description: "過去のデータ検索機能は実装中です",
    });
  };

  // 各項目に一意のIDを生成する関数
  const generateItemId = (item: InspectionItem, index: number) => {
    return `${item['製造メーカー']}-${item['機種']}-${item['部位']}-${item['装置']}-${index}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>仕業点検</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>データを読み込み中...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
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
                <Input
                  type="text"
                  value={operationalPlan}
                  onChange={(e) => handleOperationalPlanChange(e.target.value)}
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
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        表示するデータがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item, index) => {
                      const itemId = generateItemId(item, index);
                      return (
                        <TableRow key={itemId}>
                          <TableCell>{item['部位']}</TableCell>
                          <TableCell>{item['装置']}</TableCell>
                          <TableCell>{item['確認箇所']}</TableCell>
                          <TableCell>{item['判断基準']}</TableCell>
                          <TableCell>{item['確認要領']}</TableCell>
                          <TableCell>
                            <Select
                              value={checkResults[itemId] || ''}
                              onValueChange={(value) => handleResultChange(itemId, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="選択" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ok">良好</SelectItem>
                                <SelectItem value="ng">不良</SelectItem>
                                <SelectItem value="na">対象外</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={comments[itemId] || ''}
                              onChange={(e) => handleCommentChange(itemId, e.target.value)}
                              placeholder="コメント"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
