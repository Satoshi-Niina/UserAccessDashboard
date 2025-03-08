import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import OperationsNav from "@/components/OperationsNav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type InspectionTab = "entry" | "exit" | "periodic";
type InspectionResult = "完了" | "調整" | "補充" | "交換" | "経過観察" | "その他";

interface InspectionItem {
  id: number;
  category: string;          // 部位
  equipment: string;         // 装置
  item: string;              // 確認箇所
  criteria: string;          // 判断基準
  method: string;            // 確認要領
  measurementRecord: string; // 測定等記録
  diagramRecord: string;     // 図形記録
  manufacturer?: string;     // 製造メーカー
  model?: string;            // 機種
  engineType?: string;       // エンジン型式
  notes?: string;            //特記事項
}

export default function OperationsPage() {
  const [location, setLocation] = useLocation(); // Use wouter's location hook
  const [activeTab, setActiveTab] = useState<InspectionTab>("exit");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNotesChange = (id: number, value: string) => {
    setInspectionItems(prevItems => prevItems.map(item =>
      item.id === id ? {...item, notes: value} : item
    ));
  }


  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        setLoading(true);
        // 最新のCSVファイルを取得するためにlatestパラメータを追加
        const response = await fetch('/api/inspection-items?latest=true');

        if (!response.ok) {
          throw new Error('点検項目の取得に失敗しました');
        }

        const csvText = await response.text();

        // CSVパース（簡易的な実装）
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');

        // ヘッダーのインデックスを取得
        const categoryIndex = headers.findIndex(h => h === '部位' || h === 'category');
        const equipmentIndex = headers.findIndex(h => h === '装置' || h === 'equipment');
        const itemIndex = headers.findIndex(h => h === '確認箇所' || h === 'item');
        const criteriaIndex = headers.findIndex(h => h === '判断基準' || h === 'criteria');
        const methodIndex = headers.findIndex(h => h === '確認要領' || h === 'method');
        const measurementRecordIndex = headers.findIndex(h => h === '測定等記録' || h === 'measurementRecord');
        const diagramRecordIndex = headers.findIndex(h => h === '図形記録' || h === 'diagramRecord');
        const idIndex = headers.findIndex(h => h === 'id');
        const manufacturerIndex = headers.findIndex(h => h === '製造メーカー' || h === 'manufacturer');
        const modelIndex = headers.findIndex(h => h === '機種' || h === 'model');
        const engineTypeIndex = headers.findIndex(h => h === 'エンジン型式' || h === 'engineType');
        const notesIndex = headers.findIndex(h => h === '特記事項' || h === 'notes');

        // CSVから点検項目を作成
        const items: InspectionItem[] = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // 空行をスキップ

          const values = rows[i].split(',');

          // 各カラムの値を取得（存在しない場合は空文字）
          const getId = () => idIndex >= 0 ? parseInt(values[idIndex]) || i : i;
          const getCategory = () => categoryIndex >= 0 ? values[categoryIndex] || '' : '';
          const getEquipment = () => equipmentIndex >= 0 ? values[equipmentIndex] || '' : '';
          const getItem = () => itemIndex >= 0 ? values[itemIndex] || '' : '';
          const getCriteria = () => criteriaIndex >= 0 ? values[criteriaIndex] || '' : '';
          const getMethod = () => methodIndex >= 0 ? values[methodIndex] || '' : '';
          const getMeasurementRecord = () => measurementRecordIndex >= 0 ? values[measurementRecordIndex] || '' : '';
          const getDiagramRecord = () => diagramRecordIndex >= 0 ? values[diagramRecordIndex] || '' : '';
          const getManufacturer = () => manufacturerIndex >= 0 ? values[manufacturerIndex] || '' : '';
          const getModel = () => modelIndex >= 0 ? values[modelIndex] || '' : '';
          const getEngineType = () => engineTypeIndex >= 0 ? values[engineTypeIndex] || '' : '';
          const getNotes = () => notesIndex >= 0 ? values[notesIndex] || '' : '';

          items.push({
            id: getId(),
            category: getCategory(),
            equipment: getEquipment(),
            item: getItem(),
            criteria: getCriteria(),
            method: getMethod(),
            measurementRecord: getMeasurementRecord(),
            diagramRecord: getDiagramRecord(),
            manufacturer: getManufacturer(),
            model: getModel(),
            engineType: getEngineType(),
            notes: getNotes()
          });
        }

        setInspectionItems(items);
        setLoading(false);
      } catch (err) {
        console.error('点検項目取得エラー:', err);
        setError(err instanceof Error ? err.message : '点検項目の取得に失敗しました');
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  // メイン機能の点検表
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">運用管理</h1>
        </div>
        
        {/* 運用管理ナビゲーションを追加 */}
        <OperationsNav currentPage="other" />

        <Card className="w-full">
          <CardHeader>
            <CardTitle>運用管理システム</CardTitle>
            <CardDescription>保守用車の点検・運用計画を管理するシステムです</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border p-6 flex flex-col items-center justify-center space-y-4">
                <h3 className="text-xl font-medium">仕業点検</h3>
                <p className="text-muted-foreground text-center">
                  保守用車の仕業点検記録を登録・管理します。
                  エンジン、ブレーキなどの各部位の点検結果を記録することができます。
                </p>
                <Button onClick={() => navigate("/operations/inspection")}>
                  仕業点検を開始
                </Button>
              </div>
              
              <div className="rounded-lg border p-6 flex flex-col items-center justify-center space-y-4">
                <h3 className="text-xl font-medium">運用計画</h3>
                <p className="text-muted-foreground text-center">
                  保守用車の運用計画を登録・確認します。
                  作業日時、区間、車両情報などを管理することができます。
                </p>
                <Button onClick={() => navigate("/operations/operational-plan")}>
                  運用計画を作成
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
</div>
</div>
);
}