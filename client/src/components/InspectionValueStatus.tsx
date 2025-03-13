
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

interface InspectionValueStatusProps {
  value: string;
  minValue?: string;
  maxValue?: string;
  onChange: (value: string) => void;
}

export const InspectionValueStatus: React.FC<InspectionValueStatusProps> = ({
  value,
  minValue,
  maxValue,
  onChange,
}) => {
  const [isOutOfRange, setIsOutOfRange] = useState(false);

  useEffect(() => {
    if (!value) {
      setIsOutOfRange(false);
      return;
    }

    const numValue = parseFloat(value);

    // 入力値が数値でない場合は比較しない
    if (isNaN(numValue)) {
      setIsOutOfRange(false);
      return;
    }

    // 最小値と最大値の確認
    const numMinValue = minValue ? parseFloat(minValue) : null;
    const numMaxValue = maxValue ? parseFloat(maxValue) : null;

    // 最小値または最大値のどちらかが設定されている場合のみチェック
    if (numMinValue !== null || numMaxValue !== null) {
      // 最小値より小さい、または最大値より大きい場合は範囲外
      const belowMin = numMinValue !== null && numValue < numMinValue;
      const aboveMax = numMaxValue !== null && numValue > numMaxValue;

      setIsOutOfRange(belowMin || aboveMax);
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
              <p className="text-xs">基準値: {minValue || '-'} 〜 {maxValue || '-'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

  // 基準値と比較して異なる場合に警告表示
  const isDifferent = current !== standard;

  return isDifferent ? (
    <div className="text-red-500 text-xs">異常値</div>
  ) : null;
}

// デフォルトエクスポートも追加して両方の使い方をサポート
export default InspectionValueStatus;
