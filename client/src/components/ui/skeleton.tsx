// スケルトンコンポーネント
// ローディング状態を表現するプレースホルダー
// コンテンツ読み込み中の視覚的フィードバックを提供
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
