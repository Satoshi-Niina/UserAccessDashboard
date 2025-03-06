
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Papa from 'papaparse';

// 検査項目の型定義
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
  [key: string]: string; // インデックスシグネチャ
}

// 運用計画のコンポーネント
function OperationalPlan() {
  return (
    <div className="grid place-items-center h-64">
      <p className="text-center text-muted-foreground">
        この機能は開発中です。しばらくお待ちください。
      </p>
    </div>
  );
}

// 仕業点検のコンポーネント
function Inspection() {
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [currentFileName, setCurrentFileName] = useState("仕業点検マスタ.csv"); // 現在のファイル名を追加
  const [availableFiles, setAvailableFiles] = useState(["仕業点検マスタ.csv", "仕業点検_編集済.csv"]); // 利用可能なファイル名リストを追加
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // キャッシュを回避するためのタイムスタンプ付きリクエスト
        const response = await fetch(`/api/inspection-items?filename=${currentFileName}&t=` + new Date().getTime());

        if (!response.ok) {
          throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim() === '') {
          setError('データが空です');
          setLoading(false);
          return;
        }

        console.log("CSVデータの最初の行:", csvText.split('\n')[0]);

        // CSVのヘッダー行を修正（「測定等"録」などの問題を修正）
        let fixedCsvText = csvText;
        const lines = csvText.split('\n');
        if (lines.length > 0) {
          // ヘッダー行を取得して標準化
          const standardHeader = '製造メーカー,機種,エンジン型式,部位,装置,手順,確認箇所,判断基準,確認要領,測定等記録,図形記録';
          // 最初の行を標準ヘッダーに置き換え
          lines[0] = standardHeader;
          fixedCsvText = lines.join('\n');
        }

        // CSVデータのパース
        const { data, errors, meta } = Papa.parse<InspectionItem>(fixedCsvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: ',',
          transformHeader: (header) => header.trim() || 'column',
          quoteChar: '"',
          encoding: "UTF-8"
        });

        if (errors.length > 0) {
          console.error("CSVパースエラー:", errors);
          setError(`CSVの解析に失敗しました: ${errors[0].message}`);
          setLoading(false);
          return;
        }

        console.log("データのキー:", meta.fields);

        // 製造メーカーと機種のキーを決定
        const manufacturerKey = meta.fields?.includes("製造メーカー") ? "製造メーカー" : meta.fields?.[0] || "";
        const modelKey = meta.fields?.includes("機種") ? "機種" : meta.fields?.[1] || "";

        console.log("使用するメーカーキー:", manufacturerKey);
        console.log("使用する機種キー:", modelKey);

        // メーカーと機種のリストを抽出
        const uniqueManufacturers = Array.from(new Set(data.map(item => item[manufacturerKey])))
          .filter(Boolean) as string[];

        const uniqueModels = Array.from(new Set(data.map(item => item[modelKey])))
          .filter(Boolean) as string[];

        console.log("メーカーリスト:", uniqueManufacturers);
        console.log("機種リスト:", uniqueModels);

        console.log("仕業点検：データ読み込み成功", data.length, "件");
        console.log("データサンプル:", data.slice(0, 3));

        setManufacturers(uniqueManufacturers);
        setModels(uniqueModels);
        setInspectionItems(data);
        setLoading(false);

        if (uniqueManufacturers.length > 0) {
          setSelectedManufacturer(uniqueManufacturers[0]);
        }

        if (uniqueModels.length > 0) {
          setSelectedModel(uniqueModels[0]);
        }

        toast({
          title: "データ読み込み完了",
          description: `${data.length}件の点検項目を読み込みました`,
          duration: 3000,
        });
      } catch (err) {
        console.error("データ読み込みエラー:", err);
        setError(`データの読み込みに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
        setLoading(false);
      }
    }

    fetchData();
  }, [toast, currentFileName]);

  // メーカーや機種で絞り込んだ点検項目を取得
  const filteredItems = inspectionItems.filter(item => {
    const matchManufacturer = !selectedManufacturer || item.製造メーカー === selectedManufacturer;
    const matchModel = !selectedModel || item.機種 === selectedModel;
    return matchManufacturer && matchModel;
  });

  // 部位ごとにグループ化
  const groupedByPart = filteredItems.reduce((acc: Record<string, InspectionItem[]>, item) => {
    const part = item.部位 || "未分類";
    if (!acc[part]) {
      acc[part] = [];
    }
    acc[part].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">データを読み込み中...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => {
                setLoading(true);
                setError(null);
                // 少し遅延を入れてから再試行
                setTimeout(async () => {
                  try {
                    // キャッシュを回避するためのタイムスタンプ付きリクエスト
                    const response = await fetch(`/api/inspection-items?filename=${currentFileName}&t=` + new Date().getTime());

                    if (!response.ok) {
                      throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
                    }

                    const csvText = await response.text();

                    if (!csvText || csvText.trim() === '') {
                      setError('データが空です');
                      setLoading(false);
                      return;
                    }

                    // CSVのヘッダー行を修正
                    let fixedCsvText = csvText;
                    const lines = csvText.split('\n');
                    if (lines.length > 0) {
                      // ヘッダー行を標準化
                      const standardHeader = '製造メーカー,機種,エンジン型式,部位,装置,手順,確認箇所,判断基準,確認要領,測定等記録,図形記録';
                      lines[0] = standardHeader;
                      fixedCsvText = lines.join('\n');
                    }

                    // CSVデータのパース
                    const { data, errors } = Papa.parse<InspectionItem>(fixedCsvText, {
                      header: true,
                      skipEmptyLines: true,
                      delimiter: ',',
                      transformHeader: (header) => header.trim() || 'column',
                      quoteChar: '"',
                      encoding: "UTF-8"
                    });

                    console.log("CSVデータを再読み込みしました:", data.length, "件");

                    // メーカーと機種のリストを抽出
                    const uniqueManufacturers = Array.from(new Set(data.map(item => item.製造メーカー)))
                      .filter(Boolean) as string[];

                    const uniqueModels = Array.from(new Set(data.map(item => item.機種)))
                      .filter(Boolean) as string[];

                    setManufacturers(uniqueManufacturers);
                    setModels(uniqueModels);
                    setInspectionItems(data);
                    setLoading(false);
                  } catch (err) {
                    console.error("データ再読み込みエラー:", err);
                    setError(`データの読み込みに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
                    setLoading(false);
                  }
                }, 500);
              }}>
                データを再読み込み
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Select 
                value={selectedManufacturer} 
                onValueChange={setSelectedManufacturer}
              >
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model">機種</Label>
              <Select 
                value={selectedModel} 
                onValueChange={(value) => setSelectedModel(value === "all" ? "" : value)}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {models.map((model) => (
                    model ? <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem> : null
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">仕業点検項目一覧</h2>
            <div className="flex gap-2">
              <select 
                className="px-3 py-1 border rounded text-sm"
                value={currentFileName} 
                onChange={(e) => setCurrentFileName(e.target.value)}
              >
                {availableFiles.length > 0 ? (
                  availableFiles.map(file => (
                    <option key={file} value={file}>{file}</option>
                  ))
                ) : (
                  <option value="仕業点検マスタ.csv">仕業点検マスタ.csv</option>
                )}
              </select>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      // CSV形式にデータを変換
                      const csv = Papa.unparse(inspectionItems);

                      // 新しいファイル名
                      const newFileName = `仕業点検_編集済_${new Date().toISOString().slice(0, 10)}.csv`;

                      // サーバーにデータを保存
                      const response = await fetch('/api/save-inspection-data', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          data: inspectionItems,
                          fileName: newFileName
                        }),
                      });

                      if (!response.ok) {
                        throw new Error('データの保存に失敗しました');
                      }

                      const result = await response.json();

                      // 現在のファイル名を更新
                      setCurrentFileName(result.fileName);
                      setAvailableFiles([...availableFiles, result.fileName]); // 更新されたファイル名を追加

                      toast({
                        title: "データを保存しました",
                        description: `${result.fileName}として保存されました`,
                        duration: 3000,
                      });
                    } catch (err) {
                      console.error("データ保存エラー:", err);
                      toast({
                        variant: "destructive",
                        title: "エラー",
                        description: `データの保存に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`,
                        duration: 5000,
                      });
                    }
                  }}
                >
                  保存
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // CSV形式にデータを変換
                    const csv = Papa.unparse(inspectionItems);

                    // 新しいファイル名
                    const newFileName = `仕業点検_エクスポート_${new Date().toISOString().slice(0, 10)}.csv`;

                    // Blobを作成してダウンロード
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = newFileName;
                    link.click();

                    toast({
                      title: "CSVをエクスポートしました",
                      description: `${newFileName}としてダウンロードされました`,
                      duration: 3000,
                    });
                  }}
                >
                  エクスポート
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-2">
            {Object.keys(groupedByPart).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                該当する点検項目がありません。フィルターを変更してください。
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByPart).map(([part, items]) => (
                  <Card key={part} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-primary/10 p-3 font-medium">
                        {part}
                      </div>
                      <div className="divide-y">
                        {items.map((item, idx) => (
                          <div key={idx} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">確認箇所:</p>
                                <p>{item.確認箇所 || "-"}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">判断基準:</p>
                                <p>{item.判断基準 || "-"}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">確認要領:</p>
                                <p>{item.確認要領 || "-"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// デフォルトエクスポート
export default function Operations() {
  const [activeTab, setActiveTab] = useState("inspection");

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">運用管理</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          終了
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="inspection">仕業点検</TabsTrigger>
              <TabsTrigger value="operational-plan">運用計画</TabsTrigger>
            </TabsList>

            <TabsContent value="inspection" className="p-4">
              <Inspection />
            </TabsContent>

            <TabsContent value="operational-plan" className="p-4">
              <OperationalPlan />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
