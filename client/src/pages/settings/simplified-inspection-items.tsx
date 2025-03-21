
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SimplifiedInspectionItem {
  id: number;
  name: string;
  description: string;
}

export default function SimplifiedInspectionItems() {
  const [items, setItems] = React.useState<SimplifiedInspectionItem[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const sampleData = [
      { id: 1, name: 'Item 1', description: 'Description 1' },
      { id: 2, name: 'Item 2', description: 'Description 2' },
    ];
    setItems(sampleData);
  }, []);

  return (
    <div className="container mx-auto py-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>説明</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
