import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_URL = "192.168.1.5:5000"; // <-- YOUR IP

const api = axios.create({ baseURL: API_URL, timeout: 60000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.request.use((config) => {
  console.log("➡️", config.method?.toUpperCase(), config.baseURL + config.url);
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log("✅", res.status, res.config.url);
    return res;
  },
  (err) => {
    console.log(
      "❌",
      err.response?.status ?? "NO RESPONSE",
      err.config?.url,
      err.response?.data ?? err.message,
    );
    return Promise.reject(err);
  },
);

export const errorMessage = (e) =>
  e?.response?.data?.error || e?.message || "Something went wrong";

export default api;
