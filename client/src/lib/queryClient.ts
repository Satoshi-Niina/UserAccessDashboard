// APIリクエスト処理とキャッシュ管理を行うクエリクライアント
// React Queryを使用した効率的なデータフェッチングを実装
// エラーハンドリングと認証状態の管理を統合
import { QueryClient, QueryFunction } from "@tanstack/react-query";

// HTTPレスポンスの状態をチェックするヘルパー関数
// ステータスコードが200以外の場合、エラーをスローする
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// APIリクエストを行うための関数
// fetch APIを使用して、指定されたURLとメソッドでリクエストを行う
// ヘッダーとボディを必要に応じて設定する
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// 認証エラーの処理方法を指定するための型
type UnauthorizedBehavior = "returnNull" | "throw";
// React Queryのクエリ関数を作成するための関数
// 認証エラーの処理方法を指定できる
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// React Queryクライアントの設定
// サーバーステート管理とキャッシュの設定を提供
// エラーハンドリングとリトライポリシーを実装
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});