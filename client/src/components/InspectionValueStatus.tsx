
import React from 'react';

interface InspectionValueStatusProps {
  value: string;
  minValue?: string;
  maxValue?: string;
}

/**
 * 測定値が基準値内に収まっているかを表示するコンポーネント
 */
export function InspectionValueStatus({ value, minValue, maxValue }: InspectionValueStatusProps) {
  // 測定値がない場合は何も表示しない
  if (!value || value.trim() === '') return null;
  // 基準値がない場合は値だけを表示
  if (!minValue || !maxValue) return <span>{value}</span>;
  
  const numValue = parseFloat(value);
  const min = parseFloat(minValue);
  const max = parseFloat(maxValue);
  
  // 数値に変換できない場合は値だけを表示
  if (isNaN(numValue) || isNaN(min) || isNaN(max)) return <span>{value}</span>;
  
  let status = '';
  let statusColor = '';
  
  if (numValue < min) {
    status = '減少';
    statusColor = 'text-blue-600 font-bold';
  } else if (numValue > max) {
    status = '増加';
    statusColor = 'text-red-600 font-bold';
  } else {
    status = '正常';
    statusColor = 'text-green-600 font-bold';
  }
  
  return (
    <div className="flex items-center gap-2">
      <span>{value}</span>
      <span className={`text-sm ${statusColor} inline-block px-2 py-0.5 rounded bg-opacity-20 ${
        status === '減少' ? 'bg-blue-100' : 
        status === '増加' ? 'bg-red-100' : 'bg-green-100'
      }`}>
        {status}
      </span>
    </div>
  );
}

export default InspectionValueStatus;
