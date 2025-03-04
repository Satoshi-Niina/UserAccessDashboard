
import React, { useState, useEffect } from "react";
import { 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableCell, 
  TableBody, 
  Table 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "@/components/layout/sidebar";
import { ExitButton } from "@/components/layout/exit-button";
import { useToast } from "@/components/ui/use-toast";
import Papa from 'papaparse';

// 点検項目の型定義
interface InspectionItem {
  メーカー: string;
  機種: string;
  部位: string;
  装置: string;
  確認箇所: string;
  判断基準: string;
  [key: string]: string; // その他の動的なプロパティのために追加
}

export function Operations() {
  // タイトルを設定
  useEffect(() => {
    document.title = "運用管理システム - 仕業点検";
  }, []);
  
  const [activeTab, setActiveTab] = useState("daily-inspection");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // データ状態
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // CSVデータの読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // キャッシュを回避するためのタイムスタンプ付きリクエスト
        const response = await fetch('/api/inspection-items?t=' + new Date().getTime());
        const csvText = await response.text();
        
        if (!csvText || csvText.trim() === '') {
          setError('データが空です');
          setLoading(false);
          return;
        }

        // CSVデータのパース
        const { data } = Papa.parse<InspectionItem>(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        
        console.log("仕業点検：データ読み込み成功", data.length, "件");

        // メーカーと機種のリストを抽出（重複なし）
        const uniqueManufacturers = Array.from(new Set(data.map(item => item.メーカー)))
          .filter(Boolean) as string[];
        
        const uniqueModels = Array.from(new Set(data.map(item => item.機種)))
          .filter(Boolean) as string[];
        
        setManufacturers(uniqueManufacturers);
        setModels(uniqueModels);
        setInspectionItems(data);
        setLoading(false);
      } catch (err) {
        console.error("データ読み込みエラー:", err);
        setError('データの読み込みに失敗しました');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 選択されたメーカーと機種に基づいて点検項目をフィルタリング
  useEffect(() => {
    if (inspectionItems.length === 0) return;
    
    let filtered = [...inspectionItems];
    
    if (selectedManufacturer) {
      filtered = filtered.filter(item => item.メーカー === selectedManufacturer);
    }
    
    if (selectedModel) {
      filtered = filtered.filter(item => item.機種 === selectedModel);
    }
    
    setFilteredItems(filtered);
  }, [inspectionItems, selectedManufacturer, selectedModel]);

  // 保存関数
  const saveChanges = async () => {
    try {
      // ここで実際のデータ保存APIを呼び出す
      // 例: await fetch('/api/inspection-results', { method: 'POST', body: JSON.stringify(data) });
      
      toast({
        title: "保存完了",
        description: "点検結果が保存されました",
      });
      
      // 保存成功を示すためにhasChangesをfalseに設定
      setHasChanges(false);
      return true;
    } catch (error) {
      console.error("データ保存エラー:", error);
      
      toast({
        title: "エラー",
        description: "データの保存に失敗しました",
        variant: "destructive",
      });
      
      return false;
    }
  };

  // 選択変更時にhasChangesをtrueに設定
  useEffect(() => {
    if (selectedManufacturer || selectedModel) {
      setHasChanges(true);
    }
  }, [selectedManufacturer, selectedModel]);

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <div className="space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">運用管理</h2>
            <ExitButton 
              hasChanges={hasChanges}
              onSave={saveChanges}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily-inspection">仕業点検</TabsTrigger>
          <TabsTrigger value="engine-hours">エンジンアワー</TabsTrigger>
        </TabsList>
        
        {/* 仕業点検タブ */}
        <TabsContent value="daily-inspection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>仕業点検</CardTitle>
              <CardDescription>
                メーカーと機種を選択して点検項目を表示します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">製造メーカー</label>
                  <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                    <SelectTrigger>
                      <SelectValue placeholder="メーカーを選択" />
                    </SelectTrigger>
                    <SelectContent>
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
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {loading && <div className="text-center py-4">データを読み込み中...</div>}
              {error && <div className="text-center py-4 text-red-500">{error}</div>}
              
              {!loading && !error && selectedManufacturer && selectedModel && (
                <>
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-4">選択された条件に一致する点検項目がありません</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>部位</TableHead>
                          <TableHead>装置</TableHead>
                          <TableHead>確認箇所</TableHead>
                          <TableHead>判断基準</TableHead>
                          <TableHead>結果</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.部位}</TableCell>
                            <TableCell>{item.装置}</TableCell>
                            <TableCell>{item.確認箇所}</TableCell>
                            <TableCell>{item.判断基準}</TableCell>
                            <TableCell>
                              <Select>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ok">正常</SelectItem>
                                  <SelectItem value="check">要点検</SelectItem>
                                  <SelectItem value="ng">不良</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* エンジンアワータブ */}
        <TabsContent value="engine-hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>エンジンアワー</CardTitle>
              <CardDescription>
                エンジンアワーを記録・管理します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* エンジンアワー管理の内容をここに実装 */}
              <p>エンジンアワー管理画面（開発中）</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}

// デフォルトエクスポートを追加
export default Operations;
