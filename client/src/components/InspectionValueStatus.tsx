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

export function SimpleInspectionValueStatus({ currentValue, standardValue }: {currentValue: string; standardValue: string}) {
  if (!currentValue || !standardValue) {
    return null;
  }

  // 数値変換
  const current = parseFloat(currentValue);
  const standard = parseFloat(standardValue);

  if (isNaN(current) || isNaN(standard)) {
    return null;
  }

  // 増加・減少・正常の判定
  let status = "正常";
  let color = "text-green-500";

  if (current > standard * 1.1) { // 10%以上増加
    status = "増加";
    color = "text-red-500";
  } else if (current < standard * 0.9) { // 10%以上減少
    status = "減少";
    color = "text-yellow-500";
  }

  return (
    <span className={`font-medium ${color}`}>
      {status}
    </span>
  );
}


export default InspectionValueStatus;