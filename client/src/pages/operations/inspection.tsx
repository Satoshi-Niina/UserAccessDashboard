
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PenSquare, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// 仕業点検の型定義
interface InspectionItem {
  id: number;
  manufacturer: string;
  model: string;
  category: string;
  item: string;
  method: string;
  criteria: string;
}

// サンプルデータ - 本来はAPIから取得する
const sampleManufacturers = ["コマツ", "日立建機", "キャタピラー", "コベルコ", "住友建機"];
const sampleModels = ["油圧ショベル ZX120", "ブルドーザー D51PX", "ホイールローダー WA100", "クローラクレーン SCX900", "バックホウ PC200"];

export default function Inspection() {
  // タイトルを設定
  useEffect(() => {
    document.title = "運用管理システム - 仕業点検";
  }, []);
  
  // 状態管理
  const [manufacturer, setManufacturer] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState<InspectionItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<InspectionItem>>({
    category: "",
    item: "",
    method: "",
    criteria: "",
  });

  // 初期データロード - 実際のアプリではAPIから取得する
  useEffect(() => {
    const sampleData: InspectionItem[] = [
      {
        id: 1,
        manufacturer: "コマツ",
        model: "油圧ショベル ZX120",
        category: "エンジン",
        item: "エンジンオイル量",
        method: "目視点検",
        criteria: "オイルゲージの範囲内であること",
      },
      {
        id: 2,
        manufacturer: "コマツ",
        model: "油圧ショベル ZX120",
        category: "油圧系統",
        item: "作動油量",
        method: "目視点検",
        criteria: "タンク上部のゲージで確認",
      },
      {
        id: 3,
        manufacturer: "コマツ",
        model: "油圧ショベル ZX120",
        category: "足回り",
        item: "キャタピラの張り具合",
        method: "目視・触診",
        criteria: "適切なテンションがあること",
      },
      {
        id: 4,
        manufacturer: "日立建機",
        model: "ブルドーザー D51PX",
        category: "エンジン",
        item: "冷却水量",
        method: "目視点検",
        criteria: "リザーブタンクの範囲内",
      },
      {
        id: 5,
        manufacturer: "日立建機",
        model: "ブルドーザー D51PX",
        category: "電装品",
        item: "ライト点灯確認",
        method: "操作確認",
        criteria: "すべてのライトが点灯すること",
      },
    ];

    if (manufacturer && model) {
      const filteredItems = sampleData.filter(
        (item) => item.manufacturer === manufacturer && item.model === model
      );
      setInspectionItems(filteredItems);
    } else {
      setInspectionItems([]);
    }
  }, [manufacturer, model]);

  // 点検項目の追加・編集ダイアログを開く
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

  // 点検項目の編集ダイアログを開く
  const openEditDialog = (item: InspectionItem) => {
    setIsEditMode(true);
    setCurrentItem(item);
    setNewItem({
      category: item.category,
      item: item.item,
      method: item.method,
      criteria: item.criteria,
    });
    setIsDialogOpen(true);
  };

  // 点検項目を追加する
  const addInspectionItem = () => {
    if (
      !manufacturer ||
      !model ||
      !newItem.category ||
      !newItem.item ||
      !newItem.method ||
      !newItem.criteria
    ) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
        variant: "destructive",
      });
      return;
    }

    if (isEditMode && currentItem) {
      // 既存項目の編集
      const updatedItems = inspectionItems.map((item) =>
        item.id === currentItem.id
          ? {
              ...item,
              category: newItem.category || "",
              item: newItem.item || "",
              method: newItem.method || "",
              criteria: newItem.criteria || "",
            }
          : item
      );
      setInspectionItems(updatedItems);
      toast({
        title: "更新完了",
        description: "点検項目を更新しました",
      });
    } else {
      // 新規項目の追加
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

  // 変更を保存する（実際のアプリではAPI呼び出し）
  const saveChanges = () => {
    // APIを呼び出して変更を保存する処理
    toast({
      title: "保存完了",
      description: "変更内容を保存しました",
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">仕業点検</h2>
          <p className="text-muted-foreground">
            メーカーと機種を選択して、点検項目を表示します。
          </p>

          {/* 製造メーカーと機種選択 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Select
                value={manufacturer}
                onValueChange={(value) => {
                  setManufacturer(value);
                  setModel(""); // メーカーが変わったら機種をリセット
                }}
              >
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {sampleManufacturers
                    .filter(mfr => mfr && mfr.trim() !== '')
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
                  {sampleModels
                    .filter(mdl => mdl && mdl.trim() !== '')
                    .map((mdl) => (
                    <SelectItem key={mdl} value={mdl}>
                      {mdl}
                    </SelectItem>Item key={mdl} value={mdl}>
                      {mdl}
                    </SelectItem> : null
                  ))}
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
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>カテゴリ</TableHead>
                        <TableHead>点検項目</TableHead>
                        <TableHead>点検方法</TableHead>
                        <TableHead>判定基準</TableHead>
                        <TableHead className="w-[100px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
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
                                onClick={() => deleteInspectionItem(item.id)}
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
                <div className="flex justify-center items-center p-12 border rounded-md">
                  <p className="text-muted-foreground">
                    選択したメーカーと機種の点検項目がありません。
                    <br />
                    「新規追加」から点検項目を登録してください。
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center items-center p-12 border rounded-md">
              <p className="text-muted-foreground">
                メーカーと機種を選択して点検項目を表示します。
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* 点検項目追加・編集ダイアログ */}
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
                placeholder="例: エンジンオイル量、冷却水量など"
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
                placeholder="例: 目視点検、操作確認など"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria">判定基準</Label>
              <Input
                id="criteria"
                value={newItem.criteria}
                onChange={(e) =>
                  setNewItem({ ...newItem, criteria: e.target.value })
                }
                placeholder="例: 正常範囲内、異音がないことなど"
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
            <Button onClick={addInspectionItem}>
              {isEditMode ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
