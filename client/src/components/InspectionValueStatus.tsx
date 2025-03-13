
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
  let isAbnormal = false;
  
  if (numValue < min) {
    status = '減少';
    statusColor = 'text-blue-600 font-bold';
    isAbnormal = true;
  } else if (numValue > max) {
    status = '増加';
    statusColor = 'text-red-600 font-bold';
    isAbnormal = true;
  } else {
    status = '正常';
    statusColor = 'text-green-600 font-bold';
  }
  
  return (
    <div className="flex items-center gap-2">
      <span>{value}</span>
      {isAbnormal ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`text-sm ${statusColor} inline-flex items-center px-2 py-0.5 rounded bg-opacity-20 ${
                status === '減少' ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                {status} <AlertCircle className="ml-1 h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded shadow-lg">
              <p className="font-bold">異常値です！</p>
              <p className="text-xs">基準値範囲: {minValue} 〜 {maxValue}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className={`text-sm ${statusColor} inline-block px-2 py-0.5 rounded bg-opacity-20 bg-green-100`}>
          {status}
        </span>
      )}
    </div>
  );
}

/**
 * 測定値と基準値を比較してステータスを表示する単純なコンポーネント
 */
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
  let isAbnormal = false;

  if (current > standard * 1.1) { // 10%以上増加
    status = "増加";
    color = "text-red-500";
    isAbnormal = true;
  } else if (current < standard * 0.9) { // 10%以上減少
    status = "減少";
    color = "text-blue-500";
    isAbnormal = true;
  }

  return (
    <div className="flex items-center gap-1">
      {isAbnormal ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`${color} flex items-center text-xs font-semibold`}>
                {status} <AlertCircle className="ml-1 h-3 w-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded shadow-lg">
              <p className="font-bold">異常値です！</p>
              <p className="text-xs">基準値: {standardValue}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className={`${color} text-xs font-semibold`}>{status}</span>
      )}
    </div>
  );
}
