// マウント状態管理フックコンポーネント
// コンポーネントのマウント状態を追跡
// サーバーサイドレンダリング対応のために使用
import { useEffect, useState } from "react"

export function useMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return isMounted;
}