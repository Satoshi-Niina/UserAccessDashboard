import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import Papa from 'papaparse';

interface InspectionItem {
  id: string;
  メーカー: string;
  機種: string;
  'エンジン型式': string;
  部位: string;
  装置: string;
  手順: string;
  確認箇所: string;
  判断基準: string;
  確認要領: string;
  測定等記録: string;
  図形記録: string;
  order: number;
}

export default function OperationalPlan() {
  // タイトルを設定
  useEffect(() => {
    document.title = "運用管理システム - 運用計画";
  }, []);

  const [items, setItems] = useState<InspectionItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // 点検項目データの読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inspection-items?t=' + new Date().getTime());
        const csvText = await response.text();

        const { data } = Papa.parse<InspectionItem>(csvText, {
          header: true,
          skipEmptyLines: true,
        });

        // 項目をIDと順序で強化
        const enhancedItems = data.map((item, index) => ({
          ...item,
          id: `item-${index + 1}`,
          order: index + 1
        }));

        console.log("運用計画: データ読み込み成功", enhancedItems.length, "件");

        // メーカーとモデルタイプのリストを作成（空の値を確実に除外）
        const uniqueManufacturers = [...new Set(enhancedItems.map(item => item.メーカー).filter(value => value && value.trim() !== ''))];
        const uniqueModelTypes = [...new Set(enhancedItems.map(item => item.機種).filter(value => value && value.trim() !== ''))];

        setItems(enhancedItems);
        setManufacturers(uniqueManufacturers);
        setModelTypes(uniqueModelTypes);
      } catch (error) {
        console.error("運用計画: データ読み込みエラー", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">データを読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">運用計画</h2>
        <p className="mb-4">保守用車の運用計画を管理します。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>計画カレンダー</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>登録済み機械一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>メーカー</TableHead>
                  <TableHead>機種</TableHead>
                  <TableHead>作業状態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manufacturers.map((manufacturer, index) => (
                  <TableRow key={index}>
                    <TableCell>{manufacturer}</TableCell>
                    <TableCell>
                      {items
                        .filter(item => item.メーカー === manufacturer)
                        .map(item => item.機種)
                        .filter((value, index, self) => self.indexOf(value) === index)
                        .join(', ')}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search } from 'lucide-react';
import Papa from 'papaparse';

interface Task {
  id: string;
  date: string;
  operator: string;
  status: 'completed' | 'in-progress' | 'pending';
  notes: string;
}

export default function OperationalPlan() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'TK-1234', date: '2023-11-15 08:30', operator: '田中 太郎', status: 'completed', notes: 'すべての確認が完了です。' },
    { id: 'TK-5678', date: '2023-11-15 09:15', operator: '佐藤 次郎', status: 'completed', notes: 'ワイパーブレードの交換が必要です。' },
    { id: 'TK-9012', date: '2023-11-15 10:00', operator: '鈴木 三郎', status: 'pending', notes: 'ブレーキパッドが薄れてきています。早めに交換が必要。' },
    { id: 'TK-3456', date: '2023-11-15 11:30', operator: '高橋 四郎', status: 'completed', notes: 'エンジンオイルを交換しました。' },
    { id: 'TK-7890', date: '2023-11-15 13:00', operator: '伊藤 五郎', status: 'pending', notes: '' },
    { id: 'TK-2345', date: '2023-11-15 14:30', operator: '渡辺 六郎', status: 'pending', notes: '' },
    { id: 'TK-6789', date: '2023-11-15 15:45', operator: '山本 七郎', status: 'completed', notes: 'タイヤの空気圧を調整しました。' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 7;

  // ページネーション用の計算
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  
  // 検索フィルタリング
  const filteredTasks = tasks.filter(task => 
    task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  // 統計情報の計算
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const issuesCount = tasks.filter(task => task.notes && task.notes.length > 0).length;

  // タイトルを設定
  useEffect(() => {
    document.title = "運用管理システム - 運用計画";
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500">完了</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">進行中</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">未完了</Badge>;
      default:
        return <Badge className="bg-gray-500">不明</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* 統計情報カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">本日の点検予定</h3>
            <p className="text-xs text-gray-400">予定された点検の総数</p>
            <h2 className="text-3xl font-bold mt-2">{completedTasks} / {totalTasks}</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div 
                className="bg-black h-2.5 rounded-full" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">残りの作業数が{totalTasks - completedTasks}件です</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">点検完了率</h3>
            <p className="text-xs text-gray-400">今週の点検完了の状況</p>
            <h2 className="text-3xl font-bold mt-2">{completionRate}%</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div 
                className="bg-black h-2.5 rounded-full" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">目標: 95%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">要対応項目</h3>
            <p className="text-xs text-gray-400">指摘された箇所・確認が必要な項目</p>
            <h2 className="text-3xl font-bold mt-2">{issuesCount}</h2>
            <p className="text-xs text-gray-400 mt-6">確認された全ての問題の報告が必要です</p>
          </CardContent>
        </Card>
      </div>

      {/* 仕事点検リスト */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">仕業点検リスト</h2>
              <p className="text-sm text-gray-500">点検が必要な作業の一覧</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="検索..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">フィルター</Button>
              <Button variant="outline">詳細</Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">管理番号</TableHead>
                <TableHead className="w-[180px]">点検日時</TableHead>
                <TableHead className="w-[150px]">点検者</TableHead>
                <TableHead className="w-[100px]">ステータス</TableHead>
                <TableHead>備考</TableHead>
                <TableHead className="w-[100px] text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.id}</TableCell>
                  <TableCell>{task.date}</TableCell>
                  <TableCell>{task.operator}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{task.notes}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-list-x">
                        <path d="M11 12H3"/>
                        <path d="M16 6H3"/>
                        <path d="M16 18H3"/>
                        <path d="M18 9l3 3-3 3"/>
                      </svg>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              前へ
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={indexOfLastTask >= filteredTasks.length}
            >
              次へ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
