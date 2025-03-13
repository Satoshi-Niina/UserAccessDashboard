import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import React, { useState, useEffect } from 'react';

interface InspectionValueStatusProps {
  value: string;
  criteria?: string;
}

export const InspectionValueStatus: React.FC<InspectionValueStatusProps> = ({
  value,
  criteria
}) => {
  const [isAbnormal, setIsAbnormal] = useState(false);

  // 空の値の場合は何も表示しない
  if (!value || value.trim() === '') {
    return null;
  }

  useEffect(() => {
    // 基準値のパターンにマッチするか検証
    const checkValueAgainstCriteria = () => {
      if (!criteria || !value) return false;

      try {
        // 数値の範囲を抽出するパターン
        const rangePattern = /(\d+(\.\d+)?)\s*[~～-]\s*(\d+(\.\d+)?)/;
        const equalPattern = /[=＝]\s*(\d+(\.\d+)?)/;
        const lessThanPattern = /[<＜]\s*(\d+(\.\d+)?)/;
        const greaterThanPattern = /[>＞]\s*(\d+(\.\d+)?)/;
        const lessEqualPattern = /[≤≦]\s*(\d+(\.\d+)?)/;
        const greaterEqualPattern = /[≥≧]\s*(\d+(\.\d+)?)/;

        // 数値かどうかをチェック
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return false;

        // 範囲チェック (10~20, 10～20, 10-20 などの形式)
        const rangeMatch = criteria.match(rangePattern);
        if (rangeMatch) {
          const min = parseFloat(rangeMatch[1]);
          const max = parseFloat(rangeMatch[3]);
          return !(numValue >= min && numValue <= max);
        }

        // 等値チェック (=10, ＝10 などの形式)
        const equalMatch = criteria.match(equalPattern);
        if (equalMatch) {
          const targetValue = parseFloat(equalMatch[1]);
          return numValue !== targetValue;
        }

        // 未満チェック (<10, ＜10 などの形式)
        const lessThanMatch = criteria.match(lessThanPattern);
        if (lessThanMatch) {
          const targetValue = parseFloat(lessThanMatch[1]);
          return !(numValue < targetValue);
        }

        // 超過チェック (>10, ＞10 などの形式)
        const greaterThanMatch = criteria.match(greaterThanPattern);
        if (greaterThanMatch) {
          const targetValue = parseFloat(greaterThanMatch[1]);
          return !(numValue > targetValue);
        }

        // 以下チェック (≤10, ≦10 などの形式)
        const lessEqualMatch = criteria.match(lessEqualPattern);
        if (lessEqualMatch) {
          const targetValue = parseFloat(lessEqualMatch[1]);
          return !(numValue <= targetValue);
        }

        // 以上チェック (≥10, ≧10 などの形式)
        const greaterEqualMatch = criteria.match(greaterEqualPattern);
        if (greaterEqualMatch) {
          const targetValue = parseFloat(greaterEqualMatch[1]);
          return !(numValue >= targetValue);
        }

        return false;
      } catch (error) {
        console.error('基準値チェックエラー:', error);
        return false;
      }
    };

    setIsAbnormal(checkValueAgainstCriteria());
  }, [value, criteria]);

  return (
    <div className={`text-sm ${isAbnormal ? 'text-red-500 font-bold' : 'text-gray-700'}`}>
      {isAbnormal ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <span>{value}</span>
                <span className="ml-2 inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  異常値です！
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>基準値: {criteria}</p>
              <p>入力値: {value}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        value
      )}
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