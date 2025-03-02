import { useState, useEffect } from "react";
import { useLocation } from 'wouter';
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

const measurementCriteria = [
  // 測定基準値のサンプルデータ
  { id: 1, itemId: 1, value: 10 },
  { id: 2, itemId: 2, value: 5 },
  { id: 3, itemId: 3, value: 2 },
  // ... more criteria
];


export default function MachineInspection() {
  const [, setLocation] = useLocation();
  const [inspectionItemsState, setInspectionItemsState] = useState(inspectionItems);
  const [measurementCriteriaState, setMeasurementCriteriaState] = useState(measurementCriteria);

  useEffect(() => {
    setLocation('/settings/inspection-items');
  }, [setLocation]);


  const handleEditInspectionItem = (itemId:number, updatedItem:any) => {
    const updatedItems = inspectionItemsState.map(item => item.id === itemId ? updatedItem : item);
    setInspectionItemsState(updatedItems)
  }

  const handleEditMeasurementCriteria = (criteriaId:number, updatedCriteria:any) => {
    const updatedCriteriaList = measurementCriteriaState.map(criteria => criteria.id === criteriaId ? updatedCriteria : criteria);
    setMeasurementCriteriaState(updatedCriteriaList)
  }

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={() => {}} />
      <div className="flex-1 ml-16">
        <main className="p-6">
          <Tabs defaultValue="inspection-items">
            <TabsList>
              <TabsTrigger value="inspection-items">点検項目編集</TabsTrigger>
              <TabsTrigger value="measurement-criteria">測定基準値設定</TabsTrigger>
            </TabsList>

            <TabsContent value="inspection-items" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>点検項目編集</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>カテゴリ</TableHead>
                        <TableHead>点検項目</TableHead>
                        <TableHead>基準</TableHead>
                        <TableHead>編集</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspectionItemsState.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.criteria}</TableCell>
                          <TableCell>
                            <Button onClick={() => alert(`Edit item ${item.id}`)}>編集</Button> {/* Replace with actual edit functionality */}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="measurement-criteria" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>測定基準値設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>点検項目</TableHead>
                        <TableHead>基準値</TableHead>
                        <TableHead>編集</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {measurementCriteriaState.map((criteria) => (
                        <TableRow key={criteria.id}>
                          <TableCell>{criteria.id}</TableCell>
                          <TableCell>{inspectionItemsState.find(item => item.id === criteria.itemId)?.name || "不明"}</TableCell>
                          <TableCell>{criteria.value}</TableCell>
                          <TableCell>
                            <Button onClick={() => alert(`Edit criteria ${criteria.id}`)}>編集</Button> {/* Replace with actual edit functionality */}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}