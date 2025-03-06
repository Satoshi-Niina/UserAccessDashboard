// APIクライアントユーティリティ
// バックエンドとの通信を抽象化
// REST APIエンドポイントへのリクエストを実装
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const fetchData = async (endpoint: string) => {
  const response = await api.get(endpoint);
  return response.data;
};

export const postData = async (endpoint: string, data: any) => {
  const response = await api.post(endpoint, data);
  return response.data;
};

export default api;