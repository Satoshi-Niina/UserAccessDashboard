// トースト通知フックコンポーネント
// アプリケーション全体で一貫したトースト通知を提供
// 通知の表示、非表示、キュー管理を実装
import { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000