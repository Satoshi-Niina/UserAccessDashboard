
import React, { useState } from "react";
import { useLocation } from "wouter"; // Using wouter's useLocation
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type InspectionTab = "entry" | "exit" | "maintenance";
type InspectionResult = "完了" | "調整" | "補充" | "交換" | "経過観察" | "その他";

export default function OperationsPage() {
  const [location, setLocation] = useLocation(); // Use wouter's location hook
  const [activeTab, setActiveTab] = useState<InspectionTab>("exit");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Mock inspection items - this would be fetched from an API in a real application
  const inspectionItems = [
    { id: 1, category: "エンジン", item: "エンジンオイル量", criteria: "オイルレベルゲージの範囲内" },
    { id: 2, category: "エンジン", item: "冷却水量", criteria: "リザーバタンクの規定値" },
    { id: 3, category: "電気系統", item: "バッテリー液量", criteria: "UPPER/LOWERの範囲内" },
    { id: 4, category: "電気系統", item: "充電表示灯", criteria: "エンジン始動後消灯" },
    { id: 5, category: "制動装置", item: "ブレーキペダル", criteria: "遊び10～15mm" },
    { id: 6, category: "制動装置", item: "駐車ブレーキ", criteria: "引きしろの確認" },
    { id: 7, category: "走行装置", item: "前輪タイヤ空気圧", criteria: "規定値550kPa" },
    { id: 8, category: "走行装置", item: "後輪タイヤ空気圧", criteria: "規定値550kPa" },
    { id: 9, category: "その他", item: "警音器", criteria: "正常に鳴る" },
    { id: 10, category: "その他", item: "ワイパー", criteria: "作動と拭き取り状態の確認" },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">運用管理</h1>
        <Button variant="outline" onClick={() => setLocation("/")}> {/*Using wouter setLocation*/}
          <Settings className="mr-2 h-4 w-4" />
          管理メニュー
        </Button>
      </div>

      {/* 基本情報 - 3 items in a row at the top */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>点検基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="space-y-2">
              <Label htmlFor="inspectionDate">点検日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'yyyy年MM月dd日') : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleId">車両番号</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="車両番号を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mc301">MC301</SelectItem>
                  <SelectItem value="mc302">MC302</SelectItem>
                  <SelectItem value="mc303">MC303</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspector">点検者</Label>
              <Input id="inspector" placeholder="点検者名を入力" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 点検タブ */}
      <Tabs defaultValue="exit" className="w-full" onValueChange={(value) => setActiveTab(value as InspectionTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exit" disabled={activeTab === "entry"}>仕業点検</TabsTrigger>
          <TabsTrigger value="maintenance">保守点検</TabsTrigger>
          <TabsTrigger value="entry" disabled={activeTab === "exit"}>格納時点検</TabsTrigger>
        </TabsList>

        <TabsContent value="exit">
          <Card>
            <CardHeader>
              <CardTitle>仕業点検表</CardTitle>
              <CardDescription>保守用車の仕業点検を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">点検箇所</TableHead>
                    <TableHead className="w-[300px]">判断基準</TableHead>
                    <TableHead className="w-[150px]">結果</TableHead>
                    <TableHead>特記</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectionItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item}</TableCell>
                      <TableCell>{item.criteria}</TableCell>
                      <TableCell>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="結果" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="完了">完了</SelectItem>
                            <SelectItem value="調整">調整</SelectItem>
                            <SelectItem value="補充">補充</SelectItem>
                            <SelectItem value="交換">交換</SelectItem>
                            <SelectItem value="経過観察">経過観察</SelectItem>
                            <SelectItem value="その他">その他</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input placeholder="特記事項（50文字以内）" maxLength={50} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">保存</Button>
              <Button>提出</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>保守点検表</CardTitle>
              <CardDescription>保守用車の定期保守点検を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">点検箇所</TableHead>
                    <TableHead className="w-[300px]">判断基準</TableHead>
                    <TableHead className="w-[150px]">結果</TableHead>
                    <TableHead>特記</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectionItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item}</TableCell>
                      <TableCell>{item.criteria}</TableCell>
                      <TableCell>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="結果" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="完了">完了</SelectItem>
                            <SelectItem value="調整">調整</SelectItem>
                            <SelectItem value="補充">補充</SelectItem>
                            <SelectItem value="交換">交換</SelectItem>
                            <SelectItem value="経過観察">経過観察</SelectItem>
                            <SelectItem value="その他">その他</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input placeholder="特記事項（50文字以内）" maxLength={50} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">保存</Button>
              <Button>提出</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="entry">
          <Card>
            <CardHeader>
              <CardTitle>格納時点検表</CardTitle>
              <CardDescription>保守用車の格納時点検を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">点検箇所</TableHead>
                    <TableHead className="w-[300px]">判断基準</TableHead>
                    <TableHead className="w-[150px]">結果</TableHead>
                    <TableHead>特記</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectionItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item}</TableCell>
                      <TableCell>{item.criteria}</TableCell>
                      <TableCell>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="結果" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="完了">完了</SelectItem>
                            <SelectItem value="調整">調整</SelectItem>
                            <SelectItem value="補充">補充</SelectItem>
                            <SelectItem value="交換">交換</SelectItem>
                            <SelectItem value="経過観察">経過観察</SelectItem>
                            <SelectItem value="その他">その他</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input placeholder="特記事項（50文字以内）" maxLength={50} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">保存</Button>
              <Button>提出</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
