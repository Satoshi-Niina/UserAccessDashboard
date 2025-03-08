import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash, Save } from "lucide-react";


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
  const { toast } = useToast();

  // 状態変数
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [location, setLocation] = useState("");
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
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [inspector, setInspector] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [vehicleType, setVehicleType] = useState(""); // 機種
  const [vehicleNumber, setVehicleNumber] = useState(""); // 機械番号

  // デバッグ用
  useEffect(() => {
    console.log("Current vehicleType:", vehicleType);
    console.log("Current vehicleNumber:", vehicleNumber);
  }, [vehicleType, vehicleNumber]);

  // 画面切り替え処理
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // 保存して戻る処理
  const saveChanges = () => {
    // 保存処理（実際のAPI呼び出しなど）
    toast({
      title: "保存完了",
      description: "点検データが保存されました",
    });
    setHasChanges(false);
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

  // ダイアログを開く
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

  // ダイアログを閉じる
  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  // 編集モードを開始
  const startEdit = (item: InspectionItem) => {
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

  // 項目を削除
  const deleteItem = (id: number) => {
    setInspectionItems(inspectionItems.filter(item => item.id !== id));
    setHasChanges(true);
    toast({
      title: "削除完了",
      description: "点検項目を削除しました",
    });
  };

  // フォーム入力の変更を処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    setIsDialogOpen(false);
    setHasChanges(true);
  };

  return (
    <div className="container mx-auto py-8">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">仕業点検登録</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleNavigation("/operations/operational-plan")}>
            運用計画へ
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => saveChanges()}>
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
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 1行目：点検日・開始/終了時間・点検場所 */}
            <div className="space-y-2 sm:col-span-1 lg:col-span-2">
              <Label htmlFor="date">点検日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "yyyy年MM月dd日") : <span>日付を選択</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="startTime">開始時間</Label>
              <Input id="startTime" placeholder="開始時間を入力" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="endTime">終了時間</Label>
              <Input id="endTime" placeholder="終了時間を入力" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-1 lg:col-span-2">
              <Label htmlFor="location">点検場所</Label>
              <Input id="location" placeholder="場所を入力" value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            {/* 2行目：責任者・点検者・機種・機械番号 */}
            <div>
              <Label htmlFor="responsiblePerson">責任者</Label>
              <Input 
                id="responsiblePerson" 
                placeholder="責任者名を入力" 
                value={responsiblePerson} 
                onChange={(e) => setResponsiblePerson(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="inspector">点検者</Label>
              <Input 
                id="inspector" 
                placeholder="点検者名を入力" 
                value={inspector} 
                onChange={(e) => setInspector(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vehicleType">機種</Label>
              <Input 
                id="vehicleType" 
                placeholder="機種を入力" 
                value={vehicleType} 
                onChange={(e) => setVehicleType(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vehicleNumber">機械番号</Label>
              <Input 
                id="vehicleNumber" 
                placeholder="機械番号を入力" 
                value={vehicleNumber} 
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
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
                inspectionItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.item}</TableCell>
                    <TableCell>{item.method}</TableCell>
                    <TableCell>{item.criteria}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button onClick={() => startEdit(item)} size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => deleteItem(item.id)} size="sm" variant="ghost">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    点検項目がありません。「追加」ボタンから項目を追加してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 点検項目追加/編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "点検項目の編集" : "点検項目の追加"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">部位 *</Label>
              <Input
                id="category"
                value={newItem.category}
                onChange={handleInputChange}
                placeholder="例: 機体前部"
              />
            </div>
            <div>
              <Label htmlFor="item">点検項目 *</Label>
              <Input
                id="item"
                value={newItem.item}
                onChange={handleInputChange}
                placeholder="例: ブレーキの状態"
              />
            </div>
            <div>
              <Label htmlFor="method">点検方法</Label>
              <Input
                id="method"
                value={newItem.method}
                onChange={handleInputChange}
                placeholder="例: 目視確認"
              />
            </div>
            <div>
              <Label htmlFor="criteria">判定基準</Label>
              <Input
                id="criteria"
                value={newItem.criteria}
                onChange={handleInputChange}
                placeholder="例: 損傷がないこと"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>キャンセル</Button>
            <Button onClick={saveInspectionItem}>{isEditMode ? "更新" : "追加"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}