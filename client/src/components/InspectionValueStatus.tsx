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
    if (isNaN(numValue)) {
      setIsOutOfRange(false);
      return;
    }

    const numMinValue = minValue ? parseFloat(minValue) : null;
    const numMaxValue = maxValue ? parseFloat(maxValue) : null;

    if (numMinValue !== null || numMaxValue !== null) {
      const belowMin = numMinValue !== null && numValue < numMinValue;
      const aboveMax = numMaxValue !== null && numValue > numMaxValue;
      setIsOutOfRange(belowMin || aboveMax);
    }
  }, [value, minValue, maxValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleBlur = () => {
    if (isOutOfRange) {
      alert('入力値が基準範囲外です。確認してください。');
    }
  };

  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 border rounded ${
          isOutOfRange ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {isOutOfRange && (
        <div className="text-red-500 text-sm mt-1 font-bold">
          調整が必要です！（基準値: {minValue || '-'} ～ {maxValue || '-'}）
        </div>
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