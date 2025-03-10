
import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";
import { format } from 'date-fns';
import Papa from 'papaparse';

interface InspectionRecord {
  fileName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  supervisor: string;
  model: string;
  status: "作業中" | "終了";
  remarks: string[];
}

export default function InspectionRecordsPage() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspectionRecords = async () => {
      try {
        setLoading(true);
        // 点検ファイル一覧を取得
        const response = await fetch('/api/inspection-files');
        if (!response.ok) {
          throw new Error('点検ファイル一覧の取得に失敗しました');
        }
        
        const { files } = await response.json();
        if (!files || !files.length) {
          setRecords([]);
          setLoading(false);
          return;
        }

        // 各ファイルの内容を取得して解析
        const recordsData: InspectionRecord[] = [];
        
        for (const file of files) {
          try {
            const fileResponse = await fetch(`/api/inspection-items?file=${encodeURIComponent(file.name)}`);
            if (!fileResponse.ok) continue;
            
            const csvData = await fileResponse.text();
            const lines = csvData.split('\n');
            
            // ヘッダーコメントから情報を抽出（最初の数行）
            let date = '';
            let startTime = '';
            let endTime = '';
            let location = '';
            let supervisor = '';
            let model = '';
            const remarks: string[] = [];
            
            for (let i = 0; i < Math.min(20, lines.length); i++) {
              const line = lines[i].trim();
              if (line.startsWith('#点検年月日:')) {
                date = line.replace('#点検年月日:', '').trim();
              } else if (line.startsWith('#開始時刻:')) {
                startTime = line.replace('#開始時刻:', '').trim();
              } else if (line.startsWith('#終了時刻:')) {
                endTime = line.replace('#終了時刻:', '').trim();
              } else if (line.startsWith('#実施箇所:')) {
                location = line.replace('#実施箇所:', '').trim();
              } else if (line.startsWith('#責任者:')) {
                supervisor = line.replace('#責任者:', '').trim();
              }
            }
            
            // CSVの本体を解析して機種と記事欄を取得
            const parsedData = Papa.parse(csvData, { header: true });
            if (parsedData.data && parsedData.data.length > 0) {
              // 機種情報を取得
              const modelData = parsedData.data.find((item: any) => item['機種']);
              if (modelData) {
                model = modelData['機種'];
              }
              
              // 記事欄の内容を収集
              parsedData.data.forEach((item: any) => {
                if (item['記事'] && item['記事'].trim()) {
                  remarks.push(item['記事'].trim());
                }
              });
            }
            
            // ステータスを決定（終了時刻があれば「終了」、なければ「作業中」）
            const status = endTime ? "終了" : "作業中";
            
            recordsData.push({
              fileName: file.name,
              date,
              startTime,
              endTime,
              location,
              supervisor,
              model,
              status,
              remarks
            });
          } catch (err) {
            console.error(`${file.name}の解析中にエラーが発生しました:`, err);
          }
        }
        
        setRecords(recordsData);
      } catch (err) {
        console.error('点検実績の取得中にエラーが発生しました:', err);
        setError(err instanceof Error ? err.message : '点検実績の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionRecords();
  }, []);

  // 検索機能
  const filteredRecords = records.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    return (
      record.fileName.toLowerCase().includes(searchLower) ||
      record.date.toLowerCase().includes(searchLower) ||
      record.location.toLowerCase().includes(searchLower) ||
      record.supervisor.toLowerCase().includes(searchLower) ||
      record.model.toLowerCase().includes(searchLower) ||
      record.remarks.some(remark => remark.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">点検実績管理</h1>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>点検実績一覧</CardTitle>
          <CardDescription>仕業点検の実施状況と記録の管理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-6">データを読み込み中...</div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">{error}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-6">点検実績が見つかりません</div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap w-[180px]">ファイル名</TableHead>
                    <TableHead className="whitespace-nowrap w-[100px]">点検日</TableHead>
                    <TableHead className="whitespace-nowrap w-[100px]">機種</TableHead>
                    <TableHead className="whitespace-nowrap w-[120px]">実施箇所</TableHead>
                    <TableHead className="whitespace-nowrap w-[100px]">責任者</TableHead>
                    <TableHead className="whitespace-nowrap w-[80px]">状態</TableHead>
                    <TableHead className="whitespace-nowrap">特記事項</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {record.fileName}
                        </div>
                      </TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.model}</TableCell>
                      <TableCell>{record.location}</TableCell>
                      <TableCell>{record.supervisor}</TableCell>
                      <TableCell>
                        <Badge className={record.status === "終了" ? "bg-green-500" : "bg-blue-500"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-h-24 overflow-y-auto">
                          {record.remarks.length > 0 ? (
                            <ul className="list-disc pl-5 text-sm">
                              {record.remarks.map((remark, idx) => (
                                <li key={idx}>{remark}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted-foreground text-sm">特記事項なし</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
