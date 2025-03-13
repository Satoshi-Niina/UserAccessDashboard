import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input'; // Added import statement


interface InspectionValueStatusProps {
  value: string;
  minValue?: string;
  maxValue?: string;
  onChange: (value: string) => void;
}

const InspectionValueStatus: React.FC<InspectionValueStatusProps> = ({
  value,
  minValue,
  maxValue,
  onChange,
}) => {
  const [isOutOfRange, setIsOutOfRange] = useState(false);

  useEffect(() => {
    // 数値をチェック
    if (value && minValue && maxValue) {
      const numValue = parseFloat(value);
      const numMinValue = parseFloat(minValue);
      const numMaxValue = parseFloat(maxValue);

      // 数値として有効かつ範囲外の場合のみ警告を表示
      if (!isNaN(numValue) && !isNaN(numMinValue) && !isNaN(numMaxValue)) {
        setIsOutOfRange(numValue < numMinValue || numValue > numMaxValue);
      } else {
        setIsOutOfRange(false);
      }
    } else {
      setIsOutOfRange(false);
    }
  }, [value, minValue, maxValue]);

  return (
    <div className="relative">
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full text-xs p-1 h-7 ${isOutOfRange ? 'border-red-500' : ''}`}
        placeholder="数値を入力"
        step="0.1"
      />
      {isOutOfRange && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>異常値です！</p>
              <p className="text-xs">基準値: {minValue} 〜 {maxValue}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default InspectionValueStatus;


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