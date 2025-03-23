
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TableData {
  headers: string[];
  rows: Record<string, string>[];
}

export default function TableEditor() {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<TableData>({ headers: [], rows: [] });
  const [tables] = useState([
    { id: 'inspection_items', name: '点検項目' },
    { id: 'measurement_standards', name: '測定基準値' },
    { id: 'machine_numbers', name: '機械番号' },
    { id: 'manufacturers', name: '製造メーカー' },
    { id: 'models', name: '機種' }
  ]);
  const { toast } = useToast();

  const loadTableData = async (tableName: string) => {
    try {
      const response = await fetch(`/api/inspection/table/${tableName}`);
      if (!response.ok) {
        throw new Error('テーブルデータの取得に失敗しました');
      }
      const data = await response.json();
      if (data && data.length > 0) {
        setTableData({
          headers: Object.keys(data[0]),
          rows: data
        });
      } else {
        setTableData({ headers: [], rows: [] });
        toast({
          title: "警告",
          description: "テーブルにデータが存在しません",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('テーブルデータ取得エラー:', error);
      toast({
        title: "エラー",
        description: "テーブルデータの取得に失敗しました",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/inspection/table/${selectedTable}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: tableData.rows })
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      toast({
        title: "成功",
        description: "データを保存しました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "データの保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>テーブル編集</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="編集するテーブルを選択" />
              </SelectTrigger>
              <SelectContent>
                {tables.map(table => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tableData.headers.length > 0 && (
            <>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableData.headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {tableData.headers.map((header, colIndex) => (
                          <TableCell key={colIndex}>
                            <Input
                              value={row[header] || ''}
                              onChange={(e) => {
                                const newRows = [...tableData.rows];
                                newRows[rowIndex] = {
                                  ...newRows[rowIndex],
                                  [header]: e.target.value
                                };
                                setTableData({ ...tableData, rows: newRows });
                              }}
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newRows = tableData.rows.filter((_, index) => index !== rowIndex);
                              setTableData({ ...tableData, rows: newRows });
                            }}
                          >
                            削除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button onClick={handleSave}>保存</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
