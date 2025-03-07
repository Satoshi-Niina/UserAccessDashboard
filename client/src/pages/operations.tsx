import React, { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Car, Check, Clipboard, ClipboardCheck, ClipboardList, FileText, PlusCircle, Settings, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {Wrench as WrenchIcon, Replace as ReplaceIcon, Clock as ClockIcon, MoreHorizontal as MoreHorizontalIcon} from "lucide-react";
import {Badge} from "@/components/ui/badge";


// タブのデータ型
type InspectionTab = "entry" | "exit" | "maintenance";

export default function OperationsPage() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<InspectionTab>("entry");
  const [date, setDate] = useState<Date | undefined>(new Date());

  // 検査項目データの例（実際にはAPIから取得）
  const inspectionItems = [
    {
      id: 101,
      manufacturer: "堀川工機",
      model: "MC300",
      category: "車体",
      equipment: "空気圧縮機",
      item: "オイル量",
      criteria: "オイルゲージ中央",
      method: "オイルゲージ確認",
    },
    {
      id: 102,
      manufacturer: "堀川工機",
      model: "MC300",
      category: "車体",
      equipment: "空気圧縮機",
      item: "エアーフィルター",
      criteria: "詰まりなし",
      method: "目視確認",
    },
    {
      id: 103,
      manufacturer: "堀川工機",
      model: "MC300",
      category: "車体",
      equipment: "空気圧縮機",
      item: "ドレンコック",
      criteria: "正常な状態",
      method: "開閉確認",
    },
    {
      id: 104,
      manufacturer: "トランシス",
      model: "MH200",
      category: "エンジン",
      equipment: "潤滑装置",
      item: "エンジンオイル量",
      criteria: "オイルゲージ上限と下限の間",
      method: "オイルゲージ確認",
    },
  ];

  // 仮の製造メーカーと機種のフィルター状態
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");

  // フィルター適用した検査項目
  const filteredItems = inspectionItems.filter(item =>
    (manufacturerFilter === "all" || item.manufacturer === manufacturerFilter) &&
    (modelFilter === "all" || item.model === modelFilter)
  );

  // タブ切り替え処理
  const handleTabChange = (value: string) => {
    setActiveTab(value as InspectionTab);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">仕業点検</h1>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <Settings className="mr-2 h-4 w-4" />
          管理メニュー
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* 左側: フィルター設定 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>点検基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inspection-date">点検日</Label>
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
                      {date ? format(date, "yyyy年MM月dd日") : "日付を選択"}
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

              <div className="space-y-2">
                <Label htmlFor="vehicle-number">車両番号</Label>
                <Input id="vehicle-number" placeholder="例: MC-101" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspector-name">点検者名</Label>
                <Input id="inspector-name" placeholder="例: 山田太郎" />
              </div>

              <div className="space-y-2">
                <Label>製造メーカー</Label>
                <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="メーカーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="堀川工機">堀川工機</SelectItem>
                    <SelectItem value="トランシス">トランシス</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>機種</Label>
                <Select value={modelFilter} onValueChange={setModelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="機種を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="MC300">MC300</SelectItem>
                    <SelectItem value="MH200">MH200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右側: 点検項目表 */}
        <div>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="entry">出庫時点検</TabsTrigger>
              <TabsTrigger value="exit">入庫時点検</TabsTrigger>
              <TabsTrigger value="maintenance">定期点検</TabsTrigger>
            </TabsList>

            <TabsContent value="entry" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>出庫時点検項目</CardTitle>
                  <CardDescription>
                    出庫前に必要な点検項目です
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 divide-y">
                    {filteredItems.map((item) => (
                      <div key={item.id} className="py-4">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium text-sm">{item.item}</h3>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="mb-2 text-sm text-muted-foreground">
                          <p>確認基準: {item.criteria}</p>
                          <p>確認方法: {item.method}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm">
                              <Check className="mr-1 h-3 w-3" /> 完了
                            </Button>
                            <Button variant="outline" size="sm">
                              <WrenchIcon className="mr-1 h-3 w-3" /> 調整
                            </Button>
                            <Button variant="outline" size="sm">
                              <ReplaceIcon className="mr-1 h-3 w-3" /> 補充・交換
                            </Button>
                            <Button variant="outline" size="sm">
                              <ClockIcon className="mr-1 h-3 w-3" /> 経過観察
                            </Button>
                            <Button variant="outline" size="sm">
                              <MoreHorizontalIcon className="mr-1 h-3 w-3" /> その他
                            </Button>
                          </div>
                          <Input placeholder="特記事項（50文字以内）" maxLength={50} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline">一時保存</Button>
                  <Button>点検完了</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="exit">
              {/* 入庫時点検は削除 */}
            </TabsContent>

            <TabsContent value="maintenance">
              <Card>
                <CardHeader>
                  <CardTitle>定期点検項目</CardTitle>
                  <CardDescription>
                    定期点検に必要な項目です
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>点検種別</Label>
                      <RadioGroup defaultValue="monthly">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="monthly" id="monthly" />
                            <Label htmlFor="monthly">月次点検</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="quarterly" id="quarterly" />
                            <Label htmlFor="quarterly">四半期点検</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="annual" id="annual" />
                            <Label htmlFor="annual">年次点検</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline">一時保存</Button>
                  <Button>点検完了</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 進捗状況と送信ボタン */}
      <div className="mt-6 flex justify-end">
        <Button className="w-full md:w-auto">
          点検結果を登録
          <Check className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}