
// 点検実績管理ページ
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

// データの型定義
interface InspectionRecord {
  id: number;
  date: string;
  model: string;
  location: string;
  responsible: string; // 責任者
  inspector: string; // 点検者
  startTime: string; // 開始時刻
  endTime: string; // 終了時刻
  status: "completed" | "incomplete" | "pending"; // 進捗
  items: number;
  completedItems: number;
  notes: string; // 特記事項
}

export default function InspectionRecords() {
  const { toast } = useToast();
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<InspectionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [location, setLocation] = useLocation();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InspectionRecord;
    direction: "ascending" | "descending";
  } | null>(null);

  // サンプルデータを読み込む
  useEffect(() => {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const sampleData: InspectionRecord[] = [
      {
        id: 1,
        date: "2023-01-15",
        model: "モデルA",
        location: "場所X",
        responsible: "山田花子",
        inspector: "山田太郎",
        startTime: "09:00",
        endTime: "11:30",
        status: "completed",
        items: 25,
        completedItems: 25,
        notes: "正常に動作を確認しました。"
      },
      {
        id: 2,
        date: "2023-01-16",
        model: "モデルB",
        location: "場所Y",
        responsible: "佐藤美咲",
        inspector: "佐藤次郎",
        startTime: "13:00",
        endTime: "15:45",
        status: "incomplete",
        items: 25,
        completedItems: 18,
        notes: "一部エラーが発生しました。"
      },
      {
        id: 3,
        date: "2023-01-17",
        model: "モデルC",
        location: "場所Z",
        responsible: "鈴木一郎",
        inspector: "鈴木三郎",
        startTime: "10:30",
        endTime: "12:00",
        status: "pending",
        items: 25,
        completedItems: 0,
        notes: "未着手です。"
      },
      {
        id: 4,
        date: "2023-01-18",
        model: "モデルA",
        location: "場所X",
        responsible: "田中麻衣",
        inspector: "田中次郎",
        startTime: "08:30",
        endTime: "10:15",
        status: "completed",
        items: 25,
        completedItems: 25,
        notes: "特に問題ありませんでした。"
      },
    ];
    setRecords(sampleData);
    setFilteredRecords(sampleData);
  }, []);

  // 検索フィルタリング
  useEffect(() => {
    let result = records;
    
    // 日付でフィルタリング
    if (dateFilter) {
      result = result.filter(record => 
        record.date.includes(dateFilter)
      );
    }
    
    // 機種でフィルタリング
    if (modelFilter) {
      result = result.filter(record => 
        record.model.toLowerCase().includes(modelFilter.toLowerCase())
      );
    }
    
    // 検索語でフィルタリング（複数フィールドから）
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      result = result.filter(item => {
        return (
          item.location.toLowerCase().includes(lowercasedFilter) ||
          item.responsible.toLowerCase().includes(lowercasedFilter) ||
          item.inspector.toLowerCase().includes(lowercasedFilter) ||
          item.notes.toLowerCase().includes(lowercasedFilter)
        );
      });
    }
    
    setFilteredRecords(result);
  }, [records, searchTerm, dateFilter, modelFilter]);

  // ソート機能
  const requestSort = (key: keyof InspectionRecord) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    if (sortConfig !== null) {
      setFilteredRecords([...filteredRecords].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      }));
    }
  }, [sortConfig]);

  // レコードの削除
  const handleDelete = (id: number) => {
    const updatedRecords = records.filter(record => record.id !== id);
    setRecords(updatedRecords);
    toast({
      title: "削除完了",
      description: "点検記録が削除されました",
    });
  };

  // ステータスに応じたバッジの色を返す
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">完了</Badge>;
      case "incomplete":
        return <Badge variant="warning">進行中</Badge>;
      case "pending":
        return <Badge>未着手</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 戻るボタンのハンドラー
  const handleBack = () => {
    setLocation("/settings");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader heading="点検実績管理" description="過去の点検記録の一覧と管理" />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">日付フィルター</label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="日付で絞り込み"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">機種フィルター</label>
          <Input
            type="text"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            placeholder="機種で絞り込み"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">検索</label>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="場所、責任者、点検者、特記事項で検索"
            className="w-full"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => requestSort("date")}>
                  日付
                </th>
                <th className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => requestSort("model")}>
                  機種
                </th>
                <th className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => requestSort("location")}>
                  場所
                </th>
                <th className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => requestSort("responsible")}>
                  責任者
                </th>
                <th className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => requestSort("inspector")}>
                  点検者
                </th>
                <th className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => requestSort("status")}>
                  進捗
                </th>
                <th className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => requestSort("startTime")}>
                  開始時刻
                </th>
                <th className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => requestSort("endTime")}>
                  終了時刻
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  特記事項
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-3 text-center text-muted-foreground">
                    点検記録がありません
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3">{record.date}</td>
                    <td className="px-4 py-3">{record.model}</td>
                    <td className="px-4 py-3">{record.location}</td>
                    <td className="px-4 py-3">{record.responsible}</td>
                    <td className="px-4 py-3">{record.inspector}</td>
                    <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                    <td className="px-4 py-3">{record.startTime}</td>
                    <td className="px-4 py-3">{record.endTime}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{record.notes}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(record.id)}
                      >
                        削除
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
