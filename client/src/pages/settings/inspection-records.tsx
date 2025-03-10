import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, FileText, ArrowUpDown, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// 点検記録データの型定義
interface InspectionRecord {
  id: number;
  date: string;
  model: string; // Added model field
  location: string; // Added location field
  responsible: string; // Added responsible field
  inspector: string;
  status: "completed" | "incomplete" | "pending";
  items: number;
  completedItems: number;
  notes: string; //Added notes field
}

export default function InspectionRecords() {
  const { toast } = useToast();
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<InspectionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InspectionRecord;
    direction: "ascending" | "descending";
  } | null>(null);

  // サンプルデータを読み込む -  Added model, location, responsible, and notes fields to sample data
  useEffect(() => {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const sampleData: InspectionRecord[] = [
      {
        id: 1,
        date: "2023-01-15",
        model: "モデルA", // Added
        location: "場所X", // Added
        responsible: "山田花子", // Added
        inspector: "山田太郎",
        status: "completed",
        items: 25,
        completedItems: 25,
        notes: "正常に動作を確認しました。" // Added
      },
      {
        id: 2,
        date: "2023-01-16",
        model: "モデルB", // Added
        location: "場所Y", // Added
        responsible: "佐藤美咲", // Added
        inspector: "佐藤次郎",
        status: "incomplete",
        items: 25,
        completedItems: 18,
        notes: "一部エラーが発生しました。" // Added
      },
      {
        id: 3,
        date: "2023-01-17",
        model: "モデルC", // Added
        location: "場所Z", // Added
        responsible: "鈴木一郎", // Added
        inspector: "鈴木三郎",
        status: "pending",
        items: 25,
        completedItems: 0,
        notes: "未着手です。" // Added
      },
      {
        id: 4,
        date: "2023-01-18",
        model: "モデルA", // Added
        location: "場所X", // Added
        responsible: "田中麻衣", // Added
        inspector: "田中四郎",
        status: "completed",
        items: 25,
        completedItems: 25,
        notes: "正常に動作を確認しました。" // Added
      },
      {
        id: 5,
        date: "2023-01-19",
        model: "モデルB", // Added
        location: "場所Y", // Added
        responsible: "小林健太", // Added
        inspector: "小林五郎",
        status: "incomplete",
        items: 25,
        completedItems: 20,
        notes: "一部エラーが発生しました。" // Added
      }
    ];

    setRecords(sampleData);
    setFilteredRecords(sampleData);
  }, []);

  // 検索機能
  useEffect(() => {
    const results = records.filter(record =>
      record.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date.includes(searchTerm) ||
      record.model.toLowerCase().includes(searchTerm.toLowerCase()) || // Added
      record.location.toLowerCase().includes(searchTerm.toLowerCase()) || // Added
      record.responsible.toLowerCase().includes(searchTerm.toLowerCase()) // Added

    );
    setFilteredRecords(results);
  }, [searchTerm, records]);

  // ソート機能
  const requestSort = (key: keyof InspectionRecord) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });

    setFilteredRecords([...filteredRecords].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "ascending" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === "ascending" ? 1 : -1;
      }
      return 0;
    }));
  };

  // ステータスに応じたバッジを表示
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">完了</Badge>;
      case "incomplete":
        return <Badge variant="warning">未完了</Badge>;
      case "pending":
        return <Badge variant="outline">未着手</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 詳細ページへのリンク（実装例）
  const viewRecordDetails = (id: number) => {
    toast({
      title: "開発中",
      description: `記録 ID: ${id} の詳細表示は現在開発中です。`,
    });
  };

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="点検実績管理"
        description="点検の実施状況と結果を確認・管理します"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>検索フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <Input
                placeholder="点検者名または日付で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>点検記録一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("date")}>
                    日付
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("model")}>
                    機種
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("location")}>
                    場所
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("responsible")}>
                    責任者
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("inspector")}>
                    点検者
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("status")}>
                    進捗
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {new Date(record.date).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </TableCell>
                    <TableCell>{record.model}</TableCell>
                    <TableCell>{record.location}</TableCell>
                    <TableCell>{record.responsible}</TableCell>
                    <TableCell>{record.inspector}</TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewRecordDetails(record.id)}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    記録が見つかりません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}