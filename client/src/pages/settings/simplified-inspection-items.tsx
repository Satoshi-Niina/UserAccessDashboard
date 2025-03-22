
import { type FC } from 'react';
import { SimplifiedInspectionTable } from '@/components/simplified-inspection-table';

const SimplifiedInspectionItems: FC = () => {
  return (
    <div className="container mx-auto py-10">
      <SimplifiedInspectionTable />
    </div>
  );
}

export default SimplifiedInspectionItems;
