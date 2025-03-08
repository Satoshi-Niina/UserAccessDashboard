import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, PenSquare, Trash2, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// 実際の運用計画コンポーネントをインポート
import OperationalPlanPage from "./operational-plan";

// 点検項目の型定義
interface InspectionItem {
  id: number;
  manufacturer: string;
  model: string;
  category: string;
  item: string;
  method: string;
  criteria: string;
}

export default function Inspection() {
  // タイトルを設定
  useEffect(() => {
    document.title = "仕業点検 | 保守用車管理システム";
  }, []);

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inspection");

  // 状態変数
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({
    category: "",
    item: "",
    method: "",
    criteria: "",
  });

  // タブを切り替える処理
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "operational-plan") {
      navigate("/operations/operational-plan");
    }
  };

  // ダイアログを開く (新規追加)
  const openAddDialog = () => {
    setIsEditMode(false);
    setNewItem({
      category: "",
      item: "",
      method: "",
      criteria: "",
    });
    setIsDialogOpen(true);
  };

  // ダイアログを開く (編集)
  const openEditDialog = (item: InspectionItem) => {
    setIsEditMode(true);
    setEditingItemId(item.id);
    setNewItem({
      category: item.category,
      item: item.item,
      method: item.method,
      criteria: item.criteria,
    });
    setIsDialogOpen(true);
  };

  // 点検項目を保存する
  const saveInspectionItem = () => {
    if (isEditMode && editingItemId !== null) {
      // 既存の項目を編集
      const updatedItems = inspectionItems.map((item) => {
        if (item.id === editingItemId) {
          return {
            ...item,
            category: newItem.category,
            item: newItem.item,
            method: newItem.method,
            criteria: newItem.criteria,
          };
        }
        return item;
      });
      setInspectionItems(updatedItems);
      toast({
        title: "更新完了",
        description: "点検項目を更新しました",
      });
    } else {
      // 新規項目を追加
      const newId =
        inspectionItems.length > 0
          ? Math.max(...inspectionItems.map((item) => item.id)) + 1
          : 1;
      const newInspectionItem: InspectionItem = {
        id: newId,
        manufacturer,
        model,
        category: newItem.category || "",
        item: newItem.item || "",
        method: newItem.method || "",
        criteria: newItem.criteria || "",
      };
      setInspectionItems([...inspectionItems, newInspectionItem]);
      toast({
        title: "追加完了",
        description: "新しい点検項目を追加しました",
      });
    }

    setIsDialogOpen(false);
  };

  // 点検項目を削除する
  const deleteInspectionItem = (id: number) => {
    if (window.confirm("この点検項目を削除してもよろしいですか？")) {
      const updatedItems = inspectionItems.filter((item) => item.id !== id);
      setInspectionItems(updatedItems);
      toast({
        title: "削除完了",
        description: "点検項目を削除しました",
      });
    }
  };

  // 変更を保存する（実際のアプリでは、APIにデータを送信する）
  const saveChanges = () => {
    // ここでデータをサーバーに送信する処理を実装する
    toast({
      title: "保存完了",
      description: "点検項目リストを保存しました",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inspection">仕業点検</TabsTrigger>
          <TabsTrigger value="operational-plan">運用計画</TabsTrigger>
        </TabsList>

        <TabsContent value="inspection">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">仕業点検</h2>
                <p className="text-muted-foreground">
                  メーカーと機種を選択して、点検項目を表示します。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">メーカー</Label>
                    <Select
                      value={manufacturer}
                      onValueChange={setManufacturer}
                    >
                      <SelectTrigger id="manufacturer">
                        <SelectValue placeholder="メーカーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="メーカーA">メーカーA</SelectItem>
                        <SelectItem value="メーカーB">メーカーB</SelectItem>
                        <SelectItem value="メーカーC">メーカーC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">機種</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="model">
                        <SelectValue placeholder="機種を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MC300">MC300</SelectItem>
                        <SelectItem value="MR400">MR400</SelectItem>
                        <SelectItem value="MT500">MT500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 点検項目一覧と操作ボタン */}
                {manufacturer && model ? (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        点検項目一覧 ({inspectionItems.length}件)
                      </h3>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openAddDialog}
                          className="gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          新規追加
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={saveChanges}
                          className="gap-1"
                        >
                          <Save className="h-4 w-4" />
                          変更を保存
                        </Button>
                      </div>
                    </div>

                    {/* 点検項目テーブル */}
                    {inspectionItems.length > 0 ? (
                      <div className="border rounded-md overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>カテゴリ</TableHead>
                              <TableHead className="min-w-[20ch]">
                                点検項目
                              </TableHead>
                              <TableHead>点検方法</TableHead>
                              <TableHead>判定基準</TableHead>
                              <TableHead className="w-[100px]">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="max-h-[90px]">
                            {inspectionItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.category}</TableCell>
                                <TableCell>{item.item}</TableCell>
                                <TableCell>{item.method}</TableCell>
                                <TableCell>{item.criteria}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(item)}
                                    >
                                      <PenSquare className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        deleteInspectionItem(item.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-4 border rounded-md bg-muted/50">
                        点検項目がありません。「新規追加」ボタンから追加してください。
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4 border rounded-md bg-muted/50">
                    メーカーと機種を選択すると、点検項目が表示されます。
                  </div>
                )}

                {/* 点検項目追加/編集ダイアログ */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {isEditMode ? "点検項目を編集" : "点検項目を追加"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">カテゴリ</Label>
                        <Input
                          id="category"
                          value={newItem.category}
                          onChange={(e) =>
                            setNewItem({ ...newItem, category: e.target.value })
                          }
                          placeholder="例: エンジン、油圧系統など"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="item">点検項目</Label>
                        <Input
                          id="item"
                          value={newItem.item}
                          onChange={(e) =>
                            setNewItem({ ...newItem, item: e.target.value })
                          }
                          placeholder="点検項目名を入力"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="method">点検方法</Label>
                        <Input
                          id="method"
                          value={newItem.method}
                          onChange={(e) =>
                            setNewItem({ ...newItem, method: e.target.value })
                          }
                          placeholder="点検方法を入力"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="criteria">判定基準</Label>
                        <Textarea
                          id="criteria"
                          value={newItem.criteria}
                          onChange={(e) =>
                            setNewItem({ ...newItem, criteria: e.target.value })
                          }
                          placeholder="判定基準を入力"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        キャンセル
                      </Button>
                      <Button onClick={saveInspectionItem}>保存</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational-plan">
          <OperationalPlanPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}