import { useToast } from '@/components/ui/use-toast';
import {   Table,  // ... other imports
} from 'antd';
import React from 'react'; // React is needed for the functional component
import type { SimplifiedInspectionItem } from '@/types/simplified-inspection-item';

interface Props {
  items: SimplifiedInspectionItem[];
}


const InspectionItems: React.FC<Props> = ({ items }) => {
  const [expandedRows, setExpandedRows] = React.useState<number[]>([]); //useState is now used here without an import statement


  const handleExpandChange = (expanded, record) => {
    setExpandedRows(expanded);
  };


  return (
    <Table
      expandedRowRender={(record) => (
        <p>This is the expanded row for {record.name}</p>
      )}
      onExpand={(expanded, record) => handleExpandChange(expanded, record)}
      expandedRowKeys={expandedRows}
      columns={[
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        // ... more columns
      ]}
      dataSource={items}
    />
  );
};

export default InspectionItems;