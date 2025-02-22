// テーマ設定ユーティリティ
// アプリケーションの視覚的なテーマを管理
// ダークモードと配色の切り替えを実装
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

export default theme;