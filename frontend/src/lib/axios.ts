import axios from "axios";
import { apiConfig } from "@/config/api.config";
import { storage } from "./storage";

const TOKEN_KEY = "wealthwise-token";

export const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: apiConfig.headers,
});

api.interceptors.request.use(
  (config) => {
    const token = storage.get<string>(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      storage.remove(TOKEN_KEY);
      storage.remove("wealthwise-user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
