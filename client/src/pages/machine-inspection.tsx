
// 点検システムページコンポーネント
// 機器の点検と記録機能を提供
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

// 仮のデータ（実際の実装では、APIからデータを取得）
const machines = [
  { id: 1, name: "保守用車001", type: "軌道検測車", status: "正常" },
  { id: 2, name: "保守用車002", type: "マルチプルタイタンパー", status: "点検中" },
  { id: 3, name: "保守用車003", type: "バラスト整正車", status: "整備中" },
  { id: 4, name: "保守用車004", type: "レール運搬車", status: "正常" },
  { id: 5, name: "保守用車005", type: "モーターカー", status: "正常" },
];

const inspectionItems = [
  { id: 1, category: "走行装置", name: "車輪", criteria: "摩耗や亀裂がないこと" },
  { id: 2, category: "走行装置", name: "車軸", criteria: "損傷や変形がないこと" },
  { id: 3, category: "制動装置", name: "ブレーキパッド", criteria: "摩耗が規定値以内であること" },
  { id: 4, category: "制動装置", name: "エアタンク", criteria: "漏れがないこと" },
  { id: 5, category: "電気系統", name: "バッテリー", criteria: "電圧が規定値内であること" },
  { id: 6, category: "電気系統", name: "配線", criteria: "損傷や劣化がないこと" },
  { id: 7, category: "エンジン", name: "エンジンオイル", criteria: "量と状態が適正であること" },
  { id: 8, category: "エンジン", name: "冷却水", criteria: "量が適正であること" },
];

// 点検履歴の仮データ
const inspectionHistory = [
  { id: 1, machineId: 1, date: "2023-10-15", inspector: "山田太郎", status: "完了", result: "合格" },
  { id: 2, machineId: 2, date: "2023-10-14", inspector: "佐藤次郎", status: "完了", result: "不合格" },
  { id: 3, machineId: 1, date: "2023-10-10", inspector: "鈴木三郎", status: "完了", result: "合格" },
  { id: 4, machineId: 3, date: "2023-10-05", inspector: "田中四郎", status: "完了", result: "合格" },
  { id: 5, machineId: 4, date: "2023-10-01", inspector: "山田太郎", status: "完了", result: "合格" },
];

export default function MachineInspection() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("machines");
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [inspectionMode, setInspectionMode] = useState(false);
  const [inspectionChecklist, setInspectionChecklist] = useState<{[key: number]: boolean}>({});
  const [inspectionNotes, setInspectionNotes] = useState<{[key: number]: string}>({});

  // 点検開始処理
  const startInspection = (machineId: number) => {
    setSelectedMachine(machineId);
    setInspectionMode(true);
    
    // 初期状態ですべてのチェックリストアイテムを未チェック状態に
    const initialChecklist: {[key: number]: boolean} = {};
    inspectionItems.forEach(item => {
      initialChecklist[item.id] = false;
    });
    setInspectionChecklist(initialChecklist);
    
    // 点検メモを初期化
    const initialNotes: {[key: number]: string} = {};
    inspectionItems.forEach(item => {
      initialNotes[item.id] = "";
    });
    setInspectionNotes(initialNotes);
  };

  // 点検項目のチェック状態変更
  const handleCheckboxChange = (itemId: number, checked: boolean) => {
    setInspectionChecklist(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  // 点検メモの変更
  const handleNoteChange = (itemId: number, note: string) => {
    setInspectionNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
  };

  // 点検完了処理
  const completeInspection = () => {
    // ここでAPIを呼び出して点検データを保存する処理を実装
    alert("点検が完了しました。データが保存されました。");
    setInspectionMode(false);
    setSelectedMachine(null);
  };

  // 点検キャンセル処理
  const cancelInspection = () => {
    if (confirm("点検をキャンセルしますか？入力したデータは失われます。")) {
      setInspectionMode(false);
      setSelectedMachine(null);
    }
  };

  // 選択された機器の情報を取得
  const getSelectedMachine = () => {
    return machines.find(machine => machine.id === selectedMachine);
  };

  // 機器ごとの点検履歴をフィルタリング
  const getMachineInspectionHistory = (machineId: number) => {
    return inspectionHistory.filter(history => history.machineId === machineId);
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">点検システム</h1>

          {!inspectionMode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="machines">機器一覧</TabsTrigger>
                <TabsTrigger value="history">点検履歴</TabsTrigger>
                <TabsTrigger value="reports">レポート</TabsTrigger>
              </TabsList>

              <TabsContent value="machines" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>機器一覧</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>機器名</TableHead>
                          <TableHead>種類</TableHead>
                          <TableHead>状態</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {machines.map((machine) => (
                          <TableRow key={machine.id}>
                            <TableCell>{machine.id}</TableCell>
                            <TableCell>{machine.name}</TableCell>
                            <TableCell>{machine.type}</TableCell>
                            <TableCell>
                              {machine.status === "正常" ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="mr-1 h-4 w-4" /> 正常
                                </span>
                              ) : machine.status === "点検中" ? (
                                <span className="flex items-center text-blue-600">
                                  <Clock className="mr-1 h-4 w-4" /> 点検中
                                </span>
                              ) : (
                                <span className="flex items-center text-yellow-600">
                                  <AlertTriangle className="mr-1 h-4 w-4" /> 整備中
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => startInspection(machine.id)}
                                disabled={machine.status !== "正常"}
                              >
                                点検開始
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>点検履歴</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Label htmlFor="machineFilter">機器フィルター</Label>
                      <Select>
                        <SelectTrigger id="machineFilter" className="w-[250px]">
                          <SelectValue placeholder="すべての機器" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべての機器</SelectItem>
                          {machines.map(machine => (
                            <SelectItem key={machine.id} value={machine.id.toString()}>
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日付</TableHead>
                          <TableHead>機器名</TableHead>
                          <TableHead>点検者</TableHead>
                          <TableHead>状態</TableHead>
                          <TableHead>結果</TableHead>
                          <TableHead>詳細</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inspectionHistory.map((history) => {
                          const machine = machines.find(m => m.id === history.machineId);
                          return (
                            <TableRow key={history.id}>
                              <TableCell>{history.date}</TableCell>
                              <TableCell>{machine?.name || "不明"}</TableCell>
                              <TableCell>{history.inspector}</TableCell>
                              <TableCell>{history.status}</TableCell>
                              <TableCell>
                                {history.result === "合格" ? (
                                  <span className="text-green-600">合格</span>
                                ) : (
                                  <span className="text-red-600">不合格</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm">詳細表示</Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>点検レポート</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      点検データを分析して各種レポートを生成できます。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline">機器別点検実績レポート</Button>
                      <Button variant="outline">不具合傾向分析レポート</Button>
                      <Button variant="outline">期間別点検実績レポート</Button>
                      <Button variant="outline">点検者別実績レポート</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">
                  {getSelectedMachine()?.name} の点検
                </h2>
                <div className="space-x-2">
                  <Button variant="outline" onClick={cancelInspection}>キャンセル</Button>
                  <Button onClick={completeInspection}>点検完了</Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-6">
                  <Tabs defaultValue="basic">
                    <TabsList>
                      <TabsTrigger value="basic">基本情報</TabsTrigger>
                      <TabsTrigger value="inspection">点検項目</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="inspector">点検者名</Label>
                          <Input id="inspector" placeholder="点検者名を入力" />
                        </div>
                        <div>
                          <Label htmlFor="inspectionDate">点検日</Label>
                          <Input id="inspectionDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="comments">総合コメント</Label>
                          <Input id="comments" placeholder="総合的なコメントを入力" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="inspection" className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>カテゴリ</TableHead>
                            <TableHead>点検項目</TableHead>
                            <TableHead>基準</TableHead>
                            <TableHead>合格</TableHead>
                            <TableHead>メモ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inspectionItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.criteria}</TableCell>
                              <TableCell>
                                <Checkbox
                                  checked={inspectionChecklist[item.id] || false}
                                  onCheckedChange={(checked) => 
                                    handleCheckboxChange(item.id, checked === true)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="メモ"
                                  value={inspectionNotes[item.id] || ""}
                                  onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
