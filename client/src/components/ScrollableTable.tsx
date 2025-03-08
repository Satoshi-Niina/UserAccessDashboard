
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface ScrollableTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
}

export function ScrollableTable({ headers, data, renderRow }: ScrollableTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-full overflow-x-auto border rounded-md">
        <div style={{ minWidth: '100%', width: 'max-content' }}>
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, i) => (
                  <TableHead 
                    key={i} 
                    className={header === '装置' ? 'min-w-[20ch] w-[20ch]' : ''}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="max-h-[4.5rem] overflow-y-auto">
              {data.map((item, i) => renderRow(item, i))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
