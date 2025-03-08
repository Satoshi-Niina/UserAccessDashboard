import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "@/hooks/use-toast";

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
  //activeTabは不要になったので削除
  //const [activeTab, setActiveTab] = useState("inspection");

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
  const [hasChanges, setHasChanges] = useState(false); // 変更があったかどうかを管理する状態変数


  // 画面切り替え処理
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // 保存して戻る処理
  const handleSaveAndReturn = () => {
    // 変更があれば保存
    if (hasChanges) {
      saveChanges();
    }
    // 運用管理トップに戻る
    navigate("/operations");
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

  // ダイアログを閉じる
  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  // 入力フィールドの変更を処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setNewItem({ ...newItem, [id]: value });
    setHasChanges(true); // 変更があったことを記録
  };

  // 点検項目を保存する
  const saveInspectionItem = () => {
    if (!newItem.category || !newItem.item) {
      alert("部位と点検項目を入力してください");
      return;
    }

    if (isEditMode && editingItemId !== null) {
      // 既存の項目を更新
      const updatedItems = inspectionItems.map(item => {
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
      // 新しい項目を追加
      const newInspectionItem: InspectionItem = {
        id: Date.now(),
        manufacturer: manufacturer,
        model: model,
        category: newItem.category,
        item: newItem.item,
        method: newItem.method || "",
        criteria: newItem.criteria || "",
      };
      setInspectionItems([...inspectionItems, newInspectionItem]);
      toast({
        title: "追加完了",
        description: "新しい点検項目を追加しました",
      });
    }
    setHasChanges(true); // 変更があったことを記録
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
      setHasChanges(true); // 変更があったことを記録
    }
  };

  // 変更を保存する（実際のアプリでは、APIにデータを送信する）
  const saveChanges = () => {
    // ここでデータをサーバーに送信する処理を実装する
    toast({
      title: "保存完了",
      description: "点検項目リストを保存しました",
    });
    setHasChanges(false); // 保存したので変更なしにする
  };

  return (
    <div className="container mx-auto py-8">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">仕業点検</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleSaveAndReturn()}>
            保存して戻る
          </Button>
        </div>
      </div>

      {/* 画面切り替えボタン */}
      <div className="flex space-x-4 mb-6">
        <Button
          variant="default"
          className="flex-1"
          disabled
        >
          仕業点検
        </Button>
        <Button
          variant="outline"
          onClick={() => handleNavigation("/operations/operational-plan")}
          className="flex-1"
        >
          運用計画へ切り替え
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>メーカーと機種の選択</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-[calc(50%-0.5rem)]">
              <Label htmlFor="manufacturer">メーカー</Label>
              <Select value={manufacturer} onValueChange={setManufacturer}>
                <SelectTrigger>
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="トキメック">トキメック</SelectItem>
                  <SelectItem value="丸八">丸八</SelectItem>
                  <SelectItem value="タダノ">タダノ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[calc(50%-0.5rem)]">
              <Label htmlFor="model">機種</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MC300">MC300</SelectItem>
                  <SelectItem value="MR400">MR400</SelectItem>
                  <SelectItem value="MG500">MG500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">点検項目リスト</h2>
        <div className="flex gap-2">
          <Button onClick={openAddDialog} size="sm">
            <Plus className="mr-1 h-4 w-4" /> 追加
          </Button>
          {/*saveChangesボタンは不要になったので削除*/}
          {/*<Button onClick={saveChanges} size="sm" variant="outline">
            <Save className="mr-1 h-4 w-4" /> 保存
          </Button>*/}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部位</TableHead>
                <TableHead>点検項目</TableHead>
                <TableHead>点検方法</TableHead>
                <TableHead>判定基準</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspectionItems.length > 0 ? (
                inspectionItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.item}</TableCell>
                    <TableCell>{item.method}</TableCell>
                    <TableCell>{item.criteria}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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
                          onClick={() => deleteInspectionItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    点検項目がありません。「追加」ボタンから点検項目を追加してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "点検項目の編集" : "新しい点検項目の追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">部位</Label>
              <Select
                value={newItem.category}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="部位を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="エンジン">エンジン</SelectItem>
                  <SelectItem value="駆動系統">駆動系統</SelectItem>
                  <SelectItem value="足回り">足回り</SelectItem>
                  <SelectItem value="油圧系統">油圧系統</SelectItem>
                  <SelectItem value="電気系統">電気系統</SelectItem>
                  <SelectItem value="安全装置">安全装置</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item">点検項目</Label>
              <Input
                id="item"
                value={newItem.item}
                onChange={handleInputChange}
                placeholder="点検項目を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">点検方法</Label>
              <Textarea
                id="method"
                value={newItem.method}
                onChange={handleInputChange}
                placeholder="点検方法を入力"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria">判定基準</Label>
              <Textarea
                id="criteria"
                value={newItem.criteria}
                onChange={handleInputChange}
                placeholder="判定基準を入力"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              キャンセル
            </Button>
            <Button onClick={saveInspectionItem}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}