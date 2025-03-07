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
  [key: string]: string | undefined; // インデックスシグネチャ, undefinedを追加
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
  const [currentFileName, setCurrentFileName] = useState("仕業点検マスタ.csv");
  const [availableFiles, setAvailableFiles] = useState<{name: string, modified: string}[]>([]);
  const { toast } = useToast();

  // 利用可能なCSVファイル一覧を取得
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        const response = await fetch('/api/inspection-files');
        const data = await response.json();

        if (data.files && Array.isArray(data.files)) {
          const fileList = data.files.map(file => ({
            name: file.name,
            modified: new Date(file.modified).toLocaleString()
          }));
          setAvailableFiles(fileList);

          // 最新のファイルを選択する
          if (fileList.length > 0) {
            // latestFileがレスポンスに含まれている場合はそれを使用
            if (data.latestFile) {
              setCurrentFileName(data.latestFile);
            } else {
              // 含まれていない場合は最初のファイル（すでにソート済み）を使用
              setCurrentFileName(fileList[0].name);
            }
          }
        }
      } catch (err) {
        console.error("ファイル一覧取得エラー:", err);
      }
    };

    fetchAvailableFiles();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // キャッシュを回避するためのタイムスタンプ付きリクエスト
        const response = await fetch(`/api/inspection-items?file=${currentFileName}&t=` + new Date().getTime());

        if (!response.ok) {
          throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim() === '') {
          setError('データが空です');
          setLoading(false);
          return;
        }


        // CSVデータのパース
        const { data, errors, meta } = Papa.parse<InspectionItem>(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: ',',
          transformHeader: (header) => header.trim() || 'column',
          quoteChar: '"',
          encoding: "UTF-8",
          dynamicTyping: true, // add dynamicTyping to handle different data types
          // Add error handling for fewer fields.  This is crucial for the problem described.
          error: (err) => {
            console.error('Papa Parse Error:', err);
            setError(`CSV解析エラー: ${err.message}`);
            setLoading(false);
          }
        });

        if (errors && errors.length > 0) {
          console.error("CSVパースエラー:", errors);
          setError(`CSVの解析に失敗しました: ${errors[0].message}`);
          setLoading(false);
          return;
        }

        // データの欠損値を処理
        const processedData = data.map(item => {
          const processedItem: InspectionItem = { ...item };
          for (const key in processedItem) {
            if (processedItem[key] === undefined || processedItem[key] === null) {
              processedItem[key] = "";
            }
          }
          return processedItem;
        });


        // 製造メーカーと機種のキーを決定
        const manufacturerKey = meta.fields?.includes("製造メーカー") ? "製造メーカー" : meta.fields?.[0] || "";
        const modelKey = meta.fields?.includes("機種") ? "機種" : meta.fields?.[1] || "";


        // メーカーと機種のリストを抽出
        const uniqueManufacturers = Array.from(new Set(processedData.map(item => item.製造メーカー)))
          .filter(manufacturer => typeof manufacturer === 'string' && manufacturer.trim() !== '') as string[];

        const uniqueModels = Array.from(new Set(processedData.map(item => item.機種)))
          .filter(model => typeof model === 'string' && model.trim() !== '') as string[];

        setManufacturers(uniqueManufacturers);
        setModels(uniqueModels);
        console.log("読み込んだデータ:", processedData.slice(0, 3));
        console.log("メーカー一覧:", uniqueManufacturers);
        console.log("機種一覧:", uniqueModels);
        
        setInspectionItems(processedData);
        setLoading(false);

        // 初期値は「すべて」に設定
        setSelectedManufacturer("all");
        setSelectedModel("all");
        
        console.log("製造メーカー初期値:", "all");
        console.log("機種初期値:", "all");

        toast({
          title: "データ読み込み完了",
          description: `${processedData.length}件の点検項目を読み込みました`,
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
    // console.log("フィルター中のアイテム:", item);
    const matchManufacturer = selectedManufacturer === "all" || !selectedManufacturer || item.製造メーカー === selectedManufacturer;
    const matchModel = selectedModel === "all" || !selectedModel || item.機種 === selectedModel;
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

                    // CSVデータのパース
                    const { data, errors } = Papa.parse<InspectionItem>(csvText, {
                      header: true,
                      skipEmptyLines: true,
                      delimiter: ',',
                      transformHeader: (header) => header.trim() || 'column',
                      quoteChar: '"',
                      encoding: "UTF-8",
                      dynamicTyping: true,
                      error: (err) => {
                        console.error('Papa Parse Error:', err);
                        setError(`CSV解析エラー: ${err.message}`);
                        setLoading(false);
                      }
                    });

                    if (errors && errors.length > 0) {
                      console.error("CSVパースエラー:", errors);
                      setError(`CSVの解析に失敗しました: ${errors[0].message}`);
                      setLoading(false);
                      return;
                    }

                    // データの欠損値を処理
                    const processedData = data.map(item => {
                      const processedItem: InspectionItem = { ...item };
                      for (const key in processedItem) {
                        if (processedItem[key] === undefined || processedItem[key] === null) {
                          processedItem[key] = "";
                        }
                      }
                      return processedItem;
                    });

                    console.log("CSVデータを再読み込みしました:", processedData.length, "件");

                    // メーカーと機種のリストを抽出
                    const uniqueManufacturers = Array.from(new Set(processedData.map(item => item.製造メーカー)))
                      .filter(manufacturer => typeof manufacturer === 'string' && manufacturer.trim() !== '') as string[];

                    const uniqueModels = Array.from(new Set(processedData.map(item => item.機種)))
                      .filter(model => typeof model === 'string' && model.trim() !== '') as string[];

                    setManufacturers(uniqueManufacturers);
                    setModels(uniqueModels);
                    setInspectionItems(processedData);
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
                onValueChange={(value) => {
                  console.log("製造メーカー選択:", value);
                  setSelectedManufacturer(value);
                  // メーカーが変わったら機種をリセット
                  if (value !== selectedManufacturer) {
                    setSelectedModel("all");
                  }
                }}
              >
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {manufacturers.filter(manufacturer => typeof manufacturer === 'string' && manufacturer.trim() !== '').map((manufacturer) => (
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
                onValueChange={(value) => {
                  console.log("機種選択:", value);
                  setSelectedModel(value);
                }}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {models.filter(model => typeof model === 'string' && model.trim() !== '').map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">仕業点検項目一覧</h2>
            <div className="flex gap-2">
              <Select value={currentFileName} onValueChange={(e) => setCurrentFileName(e.target.value)}>
                <SelectTrigger>
                  <SelectValue placeholder="ファイルを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableFiles.map((file) => (
                    <SelectItem key={file.name} value={file.name}>{file.name}</SelectItem>
                  ))}
                  {availableFiles.length === 0 && <SelectItem value="仕業点検マスタ.csv">仕業点検マスタ.csv</SelectItem>}
                </SelectContent>
              </Select>

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