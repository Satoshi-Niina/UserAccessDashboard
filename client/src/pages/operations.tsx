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
import { 
  Calendar as CalendarIcon,
  ClipboardList, 
  CheckSquare, 
  Clock, 
  Settings, 
  FileText, 
  Database, 
  PenTool, 
  BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type InspectionTab = "entry" | "exit" | "periodic";
type InspectionResult = "完了" | "調整" | "補充" | "交換" | "経過観察" | "その他";

interface InspectionItem {
  id: number;
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
  measurementRecord: string;
  diagramRecord: string;
  manufacturer?: string;
  model?: string;
  engineType?: string;
  notes?: string;
}

export default function OperationsPage() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<InspectionTab>("exit");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNotesChange = (id: number, value: string) => {
    setInspectionItems(prevItems => prevItems.map(item =>
      item.id === id ? {...item, notes: value} : item
    ));
  };

  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items');
        if (!response.ok) throw new Error('Failed to fetch inspection items');
        const data = await response.json();
        setInspectionItems(data);
      } catch (err) {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">運用管理</h1>
        </div>

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