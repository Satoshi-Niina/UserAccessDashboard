// マウント状態管理フックコンポーネント
// コンポーネントのマウント状態を追跡
// サーバーサイドレンダリング対応のために使用
import { useState } from "react"

export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted;
}

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return isMounted;
}