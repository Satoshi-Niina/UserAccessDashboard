import React, { useState } from 'react';

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
  onChange
}) => {
  const [isOutOfRange, setIsOutOfRange] = useState(false);

  // 初期値と値の変更時に検証を行う
  React.useEffect(() => {
    validateValue(value);
  }, [value, minValue, maxValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const validateValue = (val: string) => {
    if (!val) {
      setIsOutOfRange(false);
      return;
    }

    const numVal = parseFloat(val);
    const min = minValue ? parseFloat(minValue) : null;
    const max = maxValue ? parseFloat(maxValue) : null;

    if (isNaN(numVal)) {
      setIsOutOfRange(false);
      return;
    }

    if (min !== null && max !== null) {
      const isOutside = numVal < min || numVal > max;
      console.log(`Validation: value=${numVal}, min=${min}, max=${max}, outside=${isOutside}`);
      setIsOutOfRange(isOutside);
    }
  };

  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded ${
          isOutOfRange ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
      />
      {isOutOfRange && (
        <div className="text-red-500 text-sm mt-1">
          調整が必要です！（基準値: {minValue} ～ {maxValue}）
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