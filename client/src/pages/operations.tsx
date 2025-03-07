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
import { Textarea } from '@/components/ui/textarea';

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

// 点検記録情報の型定義
interface InspectionRecord {
  点検年月日: string;
  開始時刻: string;
  終了時刻: string;
  実施箇所: string;
  責任者: string;
  点検者: string;
  引継ぎ: string;
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
  const [inspectionRecord, setInspectionRecord] = useState<InspectionRecord>({
    点検年月日: '',
    開始時刻: '',
    終了時刻: '',
    実施箇所: '',
    責任者: '',
    点検者: '',
    引継ぎ: ''
  });

  const updateInspectionRecord = (key: keyof InspectionRecord, value: string) => {
    setInspectionRecord({ ...inspectionRecord, [key]: value });
  };

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


        // データを確認
        console.log("CSV列名:", meta.fields);

        // 製造メーカーと機種の値を明示的に処理
        processedData.forEach(item => {
          // nullやundefinedの場合は空文字にする
          if (item.製造メーカー === null || item.製造メーカー === undefined) {
            item.製造メーカー = "";
          }
          if (item.機種 === null || item.機種 === undefined) {
            item.機種 = "";
          }
          if (item.部位 === null || item.部位 === undefined) {
            item.部位 = "";
          }
        });

        // メーカーと機種のリストを抽出
        const uniqueManufacturers = Array.from(new Set(
          processedData
            .map(item => item.製造メーカー)
            .filter(manufacturer => typeof manufacturer === 'string' && manufacturer.trim() !== '')
        )) as string[];

        const uniqueModels = Array.from(new Set(
          processedData
            .map(item => item.機種)
            .filter(model => typeof model === 'string' && model.trim() !== '')
        )) as string[];

        // エンジン型式を除外したデータを作成
        const filteredProcessedData = processedData.map(item => {
          const { エンジン型式, ...rest } = item;
          return rest;
        });

        console.log("読み込んだデータ:", filteredProcessedData.slice(0, 3));
        console.log("メーカー一覧:", uniqueManufacturers);
        console.log("機種一覧:", uniqueModels);

        setManufacturers(uniqueManufacturers);
        setModels(uniqueModels);
        setInspectionItems(filteredProcessedData);
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
    console.log("フィルター中のアイテム:", item, "選択した製造メーカー:", selectedManufacturer, "選択した機種:", selectedModel);

    // 製造メーカーと機種の値を確実に取得（存在しない場合は空文字に）
    const itemManufacturer = item.製造メーカー || "";
    const itemModel = item.機種 || "";

    // マッチング条件を明確に
    const matchManufacturer = selectedManufacturer === "all" || itemManufacturer === selectedManufacturer;
    const matchModel = selectedModel === "all" || itemModel === selectedModel;

    console.log("マッチ状況:", "製造メーカー:", matchManufacturer, "機種:", matchModel);
    return matchManufacturer && matchModel;
  });

  console.log("フィルター後のアイテム数:", filteredItems.length);

  // 部位によるグループ化を削除
  console.log("フィルター後のアイテム数:", filteredItems.length);

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
          {/* 点検記録情報の入力フォーム */}
          <div className="border p-4 mb-6 rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">仕業点検記録</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="inspectionDate">点検年月日</Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  value={inspectionRecord.点検年月日}
                  onChange={(e) => updateInspectionRecord('点検年月日', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="startTime">開始時刻</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={inspectionRecord.開始時刻}
                  onChange={(e) => updateInspectionRecord('開始時刻', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endTime">終了時刻</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={inspectionRecord.終了時刻}
                  onChange={(e) => updateInspectionRecord('終了時刻', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="location">実施箇所</Label>
                <Input
                  id="location"
                  type="text"
                  value={inspectionRecord.実施箇所}
                  onChange={(e) => updateInspectionRecord('実施箇所', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="responsible">責任者</Label>
                <Input
                  id="responsible"
                  type="text"
                  value={inspectionRecord.責任者}
                  onChange={(e) => updateInspectionRecord('責任者', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="inspector">点検者</Label>
                <Input
                  id="inspector"
                  type="text"
                  value={inspectionRecord.点検者}
                  onChange={(e) => updateInspectionRecord('点検者', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="handover">引継ぎ</Label>
              <Textarea
                id="handover"
                value={inspectionRecord.引継ぎ}
                onChange={(e) => updateInspectionRecord('引継ぎ', e.target.value)}
                placeholder="引継ぎ内容を入力（200文字以内）"
                maxLength={200}
                className="h-20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Select
                value={selectedManufacturer || "all"}
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
                  <SelectItem key="all-manufacturers" value="all">すべて</SelectItem>
                  {manufacturers
                    .filter(manufacturer => typeof manufacturer === 'string' && manufacturer.trim() !== '')
                    .map((manufacturer) => (
                      <SelectItem key={`manufacturer-${manufacturer}`} value={manufacturer}>
                        {manufacturer}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model">機種</Label>
              <Select
                value={selectedModel || "all"}
                onValueChange={(value) => {
                  console.log("機種選択:", value);
                  setSelectedModel(value);
                }}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-models" value="all">すべて</SelectItem>
                  {models
                    .filter(model => typeof model === 'string' && model.trim() !== '')
                    .map((model) => (
                      <SelectItem key={`model-${model}`} value={model}>
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
              <Select value={currentFileName} onValueChange={(value) => setCurrentFileName(value)}>
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
                    // 点検記録情報の入力確認
                    const missingFields = [];
                    if (!inspectionRecord.点検年月日) missingFields.push('点検年月日');
                    if (!inspectionRecord.開始時刻) missingFields.push('開始時刻');
                    if (!inspectionRecord.終了時刻) missingFields.push('終了時刻');
                    if (!inspectionRecord.実施箇所) missingFields.push('実施箇所');
                    if (!inspectionRecord.責任者) missingFields.push('責任者');
                    if (!inspectionRecord.点検者) missingFields.push('点検者');

                    if (missingFields.length > 0) {
                      toast({
                        title: "入力不足",
                        description: `以下の項目を入力してください: ${missingFields.join(', ')}`,
                        variant: "destructive",
                      });
                      return;
                    }

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
                          sourceFileName: currentFileName, // 元のファイル名を追加
                          data: inspectionItems,
                          fileName: newFileName,
                          inspectionRecord: inspectionRecord // 点検記録情報を追加
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
                    // 点検記録情報の入力確認
                    const missingFields = [];
                    if (!inspectionRecord.点検年月日) missingFields.push('点検年月日');
                    if (!inspectionRecord.開始時刻) missingFields.push('開始時刻');
                    if (!inspectionRecord.終了時刻) missingFields.push('終了時刻');
                    if (!inspectionRecord.実施箇所) missingFields.push('実施箇所');
                    if (!inspectionRecord.責任者) missingFields.push('責任者');
                    if (!inspectionRecord.点検者) missingFields.push('点検者');

                    if (missingFields.length > 0) {
                      toast({
                        title: "入力不足",
                        description: `以下の項目を入力してください: ${missingFields.join(', ')}`,
                        variant: "destructive",
                      });
                      return;
                    }

                    // 点検記録情報をヘッダーに追加
                    const recordInfoHeader = [
                      `#点検年月日: ${inspectionRecord.点検年月日}`,
                      `#開始時刻: ${inspectionRecord.開始時刻}`,
                      `#終了時刻: ${inspectionRecord.終了時刻}`,
                      `#実施箇所: ${inspectionRecord.実施箇所}`,
                      `#責任者: ${inspectionRecord.責任者}`,
                      `#点検者: ${inspectionRecord.点検者}`,
                      `#引継ぎ: ${inspectionRecord.引継ぎ}`,
                      ''  // 空行を追加
                    ];

                    // CSVを生成してダウンロード
                    const itemsCSV = Papa.unparse(filteredItems);
                    const csvContent = recordInfoHeader.join('\n') + '\n' + itemsCSV;
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `仕業点検_${inspectionRecord.点検年月日}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    toast({
                      title: "CSVをエクスポートしました",
                      description: `仕業点検_${inspectionRecord.点検年月日}.csvとしてダウンロードされました`,
                      duration: 3000,
                    });
                  }}
                >
                  エクスポート
                </Button>
              </div>
            </div>

            <div className="mt-2">
              {filteredItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  該当する点検項目がありません。フィルターを変更してください。
                </p>
              ) : (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/70">
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground border">装置</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground border">確認箇所</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground border">確認要領</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground border">判断基準</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground border">測定等記録</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground border">図形記録</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-2 border">{item.装置 || "-"}</td>
                              <td className="px-4 py-2 border">{item.確認箇所 || "-"}</td>
                              <td className="px-4 py-2 border">{item.確認要領 || "-"}</td>
                              <td className="px-4 py-2 border">{item.判断基準 || "-"}</td>
                              <td className="px-4 py-2 border">{item.測定等記録 || "-"}</td>
                              <td className="px-4 py-2 border">{item.図形記録 || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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