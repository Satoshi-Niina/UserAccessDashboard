import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import Papa from 'papaparse';
import { Download, Upload, Plus, Save } from "lucide-react";

// 点検項目の型定義
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
  [key: string]: string; // その他の動的なプロパティのために追加
}

export default function InspectionItems() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "運用管理システム - 点検項目管理";
    fetchInspectionItems();
  }, []);

  // 点検項目データを取得
  const fetchInspectionItems = async () => {
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
      const { data, errors } = Papa.parse<InspectionItem>(csvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',',
        transformHeader: (header) => header.trim() || 'column',
        quoteChar: '"'
      });

      if (errors.length > 0) {
        console.warn("CSV解析中にエラーが発生しました:", errors);
      }

      console.log("点検項目データ読み込み成功", data.length, "件");
      setItems(data);
      setLoading(false);
    } catch (err) {
      console.error("データ読み込みエラー:", err);
      setError('データの読み込みに失敗しました');
      setLoading(false);
    }
  };

  // ファイルアップロード処理
  const handleFileUpload = async () => {
    try {
      if (!fileInputRef.current?.files?.length) {
        toast({
          title: "エラー",
          description: "ファイルが選択されていません",
          variant: "destructive",
        });
        return;
      }

      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-inspection-items', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '不明なエラーが発生しました');
      }

      toast({
        title: "アップロード成功",
        description: `${file.name} (${(file.size / 1024).toFixed(2)} KB) がアップロードされました`,
      });

      // データを再取得
      fetchInspectionItems();

    } catch (error) {
      console.error('ファイルアップロード処理エラー:', error);
      toast({
        title: "アップロードエラー",
        description: error instanceof Error ? error.message : '不明なエラーが発生しました',
        variant: "destructive",
      });
    }
  };

  // CSVデータをダウンロード
  const handleDownload = () => {
    if (items.length === 0) {
      toast({
        title: "エラー",
        description: "ダウンロードするデータがありません",
        variant: "destructive",
      });
      return;
    }

    // CSVに変換
    const csv = Papa.unparse(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '点検項目マスタ.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 新規項目の追加ボタン
  const handleAddItem = () => {
    // 空の項目を追加
    const newItem: InspectionItem = {
      製造メーカー: "",
      機種: "",
      エンジン型式: "",
      部位: "",
      装置: "",
      手順: "",
      確認箇所: "",
      判断基準: "",
      確認要領: "",
      測定等記録: "",
      図形記録: "",
    };

    setItems([...items, newItem]);

    // 追加後に一番下にスクロール
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  // 項目を編集
  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  // 変更を保存
  const handleSave = async () => {
    try {
      // CSVに変換
      const csv = Papa.unparse(items);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const formData = new FormData();
      formData.append('file', blob, '仕業点検マスタ.csv');

      const response = await fetch('/api/upload-inspection-items', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '不明なエラーが発生しました');
      }

      toast({
        title: "保存成功",
        description: "点検項目が保存されました",
      });

    } catch (error) {
      console.error('データ保存エラー:', error);
      toast({
        title: "保存エラー",
        description: error instanceof Error ? error.message : '不明なエラーが発生しました',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <div className="space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">点検項目管理</h2>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1"
              >
                <Upload className="h-4 w-4" />
                CSVアップロード
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                CSVダウンロード
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>点検項目管理</CardTitle>
              <CardDescription>
                点検項目の一覧と編集を行います。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">データを読み込み中...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">{error}</div>
              ) : (
                <>
                  <div className="flex justify-end mb-4 space-x-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleAddItem}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      新規追加
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleSave}
                      className="gap-1"
                    >
                      <Save className="h-4 w-4" />
                      変更を保存
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <Table className="border text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-24">製造メーカー</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-24">機種</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-24">エンジン型式</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-20">部位</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-20">装置</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-20">手順</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-32">確認箇所</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-32">判断基準</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-32">確認要領</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-20">測定等記録</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-1 w-20">図形記録</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.製造メーカー || ''} 
                                onChange={(e) => handleItemChange(index, '製造メーカー', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.機種 || ''} 
                                onChange={(e) => handleItemChange(index, '機種', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.エンジン型式 || ''} 
                                onChange={(e) => handleItemChange(index, 'エンジン型式', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.部位 || ''} 
                                onChange={(e) => handleItemChange(index, '部位', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.装置 || ''} 
                                onChange={(e) => handleItemChange(index, '装置', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.手順 || ''} 
                                onChange={(e) => handleItemChange(index, '手順', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.確認箇所 || ''} 
                                onChange={(e) => handleItemChange(index, '確認箇所', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.判断基準 || ''} 
                                onChange={(e) => handleItemChange(index, '判断基準', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.確認要領 || ''} 
                                onChange={(e) => handleItemChange(index, '確認要領', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.測定等記録 || ''} 
                                onChange={(e) => handleItemChange(index, '測定等記録', e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="px-1 py-1">
                              <Input 
                                className="h-7 text-xs px-1" 
                                value={item.図形記録 || ''} 
                                onChange={(e) => handleItemChange(index, '図形記録', e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}