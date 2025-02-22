// ユーティリティ関数
// 共通で使用される汎用的な関数を提供
// クラス名の結合やデータ処理のヘルパー関数を実装
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}