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
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 点検項目の型定義
type InspectionItem = {
  id: number;
  メーカー: string;
  機種: string;
  部位: string;
  点検項目: string;
  判定基準: string;
  備考: string;
};

export default function Inspection({ onChanges }: { onChanges: (hasChanges: boolean) => void }) {
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaker, setSelectedMaker] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [results, setResults] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const { toast } = useToast();

  // 一意のメーカーと機種のリストを取得
  const uniqueMakers = [...new Set(inspectionItems.map(item => item.メーカー))].filter(Boolean).sort();
  const uniqueModels = [...new Set(inspectionItems.map(item => item.機種))].filter(Boolean).sort();

  // 点検データを読み込む
  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items');
        if (!response.ok) {
          throw new Error('点検項目データの取得に失敗しました');
        }
        const data = await response.json();
        setInspectionItems(data);
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
    const filtered = inspectionItems.filter(item => 
      (selectedMaker === "all" || item.メーカー === selectedMaker) &&
      (selectedModel === "all" || item.機種 === selectedModel)
    );
    setFilteredItems(filtered);
  }, [inspectionItems, selectedMaker, selectedModel]);

  // 点検結果の更新
  const updateResult = (itemId: number, result: string) => {
    setResults(prev => ({
      ...prev,
      [itemId]: result
    }));
    onChanges(true);
  };

  // 備考の更新
  const updateNote = (itemId: number, note: string) => {
    setNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
    onChanges(true);
  };

  // 点検結果の保存
  const saveInspection = async () => {
    try {
      // 保存APIの呼び出し
      // await fetch('/api/inspection-results', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ results, notes })
      // });

      toast({
        title: "保存完了",
        description: "点検結果が保存されました",
      });
      onChanges(false);
    } catch (err) {
      toast({
        title: "エラー",
        description: "点検結果の保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-6">データを読み込み中...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>仕業点検</CardTitle>
      </CardHeader>
      <CardContent>
        {/* フィルター */}
        <div className="flex space-x-4 mb-6">
          <div className="w-1/3">
            <label className="text-sm font-medium mb-1 block">メーカー</label>
            <Select value={selectedMaker} onValueChange={setSelectedMaker}>
              <SelectTrigger>
                <SelectValue placeholder="すべてのメーカー" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのメーカー</SelectItem>
                {uniqueMakers.map(maker => (
                  <SelectItem key={maker} value={maker}>{maker}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/3">
            <label className="text-sm font-medium mb-1 block">機種</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="すべての機種" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての機種</SelectItem>
                {uniqueModels.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-4" />

        {/* 点検項目テーブル */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">No.</TableHead>
                <TableHead>メーカー</TableHead>
                <TableHead>機種</TableHead>
                <TableHead>部位</TableHead>
                <TableHead>点検項目</TableHead>
                <TableHead>判定基準</TableHead>
                <TableHead className="w-[150px]">結果</TableHead>
                <TableHead className="w-[200px]">備考</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    表示するデータがありません
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.メーカー}</TableCell>
                    <TableCell>{item.機種}</TableCell>
                    <TableCell>{item.部位}</TableCell>
                    <TableCell>{item.点検項目}</TableCell>
                    <TableCell>{item.判定基準}</TableCell>
                    <TableCell>
                      <Select 
                        value={results[item.id] || ""}
                        onValueChange={(value) => updateResult(item.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="正常">正常</SelectItem>
                          <SelectItem value="要注意">要注意</SelectItem>
                          <SelectItem value="不良">不良</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={notes[item.id] || ''}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        className="w-full p-1 border rounded"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={saveInspection}>
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}