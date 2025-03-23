
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const loadTableData = async (tableName: string) => {
    try {
      const response = await fetch(`/api/inspection/table/${tableName}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setTableData({
          headers: Object.keys(data[0]),
          rows: data
        });
      }
    } catch (error) {
      console.error('テーブルデータ取得エラー:', error);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
