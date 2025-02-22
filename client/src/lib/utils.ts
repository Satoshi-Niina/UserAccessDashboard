// ユーティリティ関数
// クラス名の結合やスタイルの制御を行う
// 共通で使用される便利な関数を提供
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}