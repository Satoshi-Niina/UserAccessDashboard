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
  id: number;
  manufacturer: string;
  model: string;
  engineType: string;
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
  measurementRecord: string;
  diagramRecord: string;
}

// 仕様点検記録シートコンポーネント
function InspectionForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [manufacturer, setManufacturer] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const { toast } = useToast();

  // 利用可能なメーカーとモデルのサンプル - 実際のデータベースから取得する
  const sampleManufacturers = ["堀川工機", "トランシス", "ヤンマー"];
  const sampleModels = ["MC300", "MH200", "MC100"];

  // データのフェッチ（実装例）
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/inspection-items');
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const data = await response.json();
        setInspectionItems(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "エラー",
          description: "データの取得に失敗しました",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // フィルタリングされた項目
  const filteredItems = inspectionItems.filter(item => {
    const manufacturerMatch = manufacturer === "all" || !manufacturer || item.manufacturer === manufacturer;
    const modelMatch = model === "all" || !model || item.model === model;
    console.log("フィルター中のアイテム:", item, "選択した製造メーカー:", manufacturer, "選択した機種:", model);
    console.log("マッチ状況:", "製造メーカー:", manufacturerMatch, "機種:", modelMatch);
    return manufacturerMatch && modelMatch;
  });

  console.log("フィルター後のアイテム数:", filteredItems.length);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>仕業点検</CardTitle>
          <CardDescription>点検項目と結果を記録します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Select
                value={manufacturer}
                onValueChange={setManufacturer}
              >
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {sampleManufacturers
                    .filter((mfr) => mfr && mfr.trim() !== "")
                    .map((mfr) => (
                      <SelectItem key={mfr} value={mfr}>
                        {mfr}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">機種</Label>
              <Select
                value={model}
                onValueChange={setModel}
                disabled={!manufacturer}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {sampleModels
                    .filter((mdl) => mdl && mdl.trim() !== "")
                    .map((mdl) => (
                      <SelectItem key={mdl} value={mdl}>
                        {mdl}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">読み込み中...</span>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-2 py-2 text-xs text-left font-medium border">部位</th>
                    <th className="px-2 py-2 text-xs text-left font-medium border">装置</th>
                    <th className="px-2 py-2 text-xs text-left font-medium border">確認箇所</th>
                    <th className="px-2 py-2 text-xs text-left font-medium border">判断基準</th>
                    <th className="px-2 py-2 text-xs text-left font-medium border">確認要領</th>
                    <th className="px-2 py-2 text-xs text-left font-medium border">結果</th>
                    <th className="px-2 py-2 text-xs text-left font-medium border">測定記録</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-2 py-2 text-xs border align-top">{item.category || item.部位}</td>
                      <td className="px-2 py-2 text-xs border align-top">{item.equipment || item.装置}</td>
                      <td className="px-2 py-2 text-xs border align-top">
                        <div className="max-h-16 overflow-y-auto">{item.item || item.確認箇所}</div>
                      </td>
                      <td className="px-2 py-2 text-xs border align-top">
                        <div className="max-h-16 overflow-y-auto">{item.criteria || item.判断基準}</div>
                      </td>
                      <td className="px-2 py-2 text-xs border align-top">
                        <div className="max-h-16 overflow-y-auto">{item.method || item.確認要領}</div>
                      </td>
                      <td className="px-2 py-2 text-xs border align-top">
                        <Select>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ok">良</SelectItem>
                            <SelectItem value="ng">否</SelectItem>
                            <SelectItem value="na">対象外</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2 text-xs border align-top">
                        <Input className="h-8 text-xs" placeholder="記録" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>該当する項目がありません</AlertTitle>
              <AlertDescription>
                フィルター条件を変更してください
              </AlertDescription>
            </Alert>
          )}

          {filteredItems.length > 0 && (
            <div className="mt-4 flex justify-between">
              <Button variant="outline">一時保存</Button>
              <Button>完了</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 入場検査記録シートコンポーネント
function EntryInspectionForm() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>入場検査</CardTitle>
          <CardDescription>入場時の検査結果を記録します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entry-manufacturer">製造メーカー</Label>
                <Select>
                  <SelectTrigger id="entry-manufacturer">
                    <SelectValue placeholder="メーカーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horikawa">堀川工機</SelectItem>
                    <SelectItem value="transis">トランシス</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry-model">機種</Label>
                <Select>
                  <SelectTrigger id="entry-model">
                    <SelectValue placeholder="機種を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mc300">MC300</SelectItem>
                    <SelectItem value="mh200">MH200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-notes">検査メモ</Label>
              <Textarea id="entry-notes" placeholder="検査に関する特記事項があれば入力してください" />
            </div>

            <div className="mt-4 flex justify-end">
              <Button>保存</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 出場検査記録シートコンポーネント
function ExitInspectionForm() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>出場検査</CardTitle>
          <CardDescription>出場時の検査結果を記録します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exit-manufacturer">製造メーカー</Label>
                <Select>
                  <SelectTrigger id="exit-manufacturer">
                    <SelectValue placeholder="メーカーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horikawa">堀川工機</SelectItem>
                    <SelectItem value="transis">トランシス</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exit-model">機種</Label>
                <Select>
                  <SelectTrigger id="exit-model">
                    <SelectValue placeholder="機種を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mc300">MC300</SelectItem>
                    <SelectItem value="mh200">MH200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-notes">検査メモ</Label>
              <Textarea id="exit-notes" placeholder="検査に関する特記事項があれば入力してください" />
            </div>

            <div className="mt-4 flex justify-end">
              <Button>保存</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// メインコンポーネント
export default function Operations() {
  return (
    <div className="container py-4 mx-auto">
      <h1 className="text-2xl font-bold mb-6">保守用車 運用管理</h1>

      <Tabs defaultValue="daily-inspection">
        <TabsList className="mb-4">
          <TabsTrigger value="daily-inspection">仕業点検</TabsTrigger>
          <TabsTrigger value="entry-inspection">入場検査</TabsTrigger>
          <TabsTrigger value="exit-inspection">出場検査</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-inspection">
          <InspectionForm />
        </TabsContent>

        <TabsContent value="entry-inspection">
          <EntryInspectionForm />
        </TabsContent>

        <TabsContent value="exit-inspection">
          <ExitInspectionForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}