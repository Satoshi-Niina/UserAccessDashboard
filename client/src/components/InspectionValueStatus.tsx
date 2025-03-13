import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import React, { useState, useEffect } from 'react';

interface InspectionValueStatusProps {
  value: string;
  standardValue: string;
}

export const InspectionValueStatus: React.FC<InspectionValueStatusProps> = ({ value, standardValue }) => {
  const [isAbnormal, setIsAbnormal] = useState(false);

  useEffect(() => {
    if (!value || !standardValue) return;

    // 基準値の解析
    try {
      // 数値範囲（例: 10-20）を処理
      if (standardValue.includes('-')) {
        const [min, max] = standardValue.split('-').map(v => parseFloat(v.trim()));
        const numValue = parseFloat(value);

        if (!isNaN(min) && !isNaN(max) && !isNaN(numValue)) {
          setIsAbnormal(numValue < min || numValue > max);
        }
        return;
      }

      // 以上・以下の処理（例: <=20, >=10）
      if (standardValue.includes('<=') || standardValue.includes('>=') || 
          standardValue.includes('<') || standardValue.includes('>')) {

        let operator = '';
        let threshold = 0;

        if (standardValue.includes('<=')) {
          operator = '<=';
          threshold = parseFloat(standardValue.replace('<=', '').trim());
        } else if (standardValue.includes('>=')) {
          operator = '>=';
          threshold = parseFloat(standardValue.replace('>=', '').trim());
        } else if (standardValue.includes('<')) {
          operator = '<';
          threshold = parseFloat(standardValue.replace('<', '').trim());
        } else if (standardValue.includes('>')) {
          operator = '>';
          threshold = parseFloat(standardValue.replace('>', '').trim());
        }

        const numValue = parseFloat(value);

        if (!isNaN(threshold) && !isNaN(numValue)) {
          if (operator === '<=') setIsAbnormal(numValue > threshold);
          else if (operator === '>=') setIsAbnormal(numValue < threshold);
          else if (operator === '<') setIsAbnormal(numValue >= threshold);
          else if (operator === '>') setIsAbnormal(numValue <= threshold);
        }
        return;
      }

      // 単純な数値比較
      const standardNum = parseFloat(standardValue);
      const valueNum = parseFloat(value);

      if (!isNaN(standardNum) && !isNaN(valueNum)) {
        setIsAbnormal(valueNum !== standardNum);
      }
    } catch (error) {
      console.error('測定値の比較中にエラーが発生しました:', error);
    }
  }, [value, standardValue]);

  if (!isAbnormal) return null;

  return (
    <div className="absolute bg-red-500 text-white rounded-lg px-2 py-1 text-xs whitespace-nowrap z-10 mt-1">
      異常値です！
      <div className="absolute w-2 h-2 bg-red-500 rotate-45 -top-1 left-1/2 transform -translate-x-1/2"></div>
    </div>
  );
};

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