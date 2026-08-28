import axios, { type AxiosRequestConfig } from "axios";

import { env } from "@/lib/env";
import { ApiError, toApiError } from "@/lib/http/errors";

type ApiEnvelope<T> = {
  data: T;
};

const REQUEST_TIMEOUT_MS = 15_000;

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

function unwrapEnvelope<T>(payload: unknown): T {
  if (
    payload === null ||
    typeof payload !== "object" ||
    !("data" in payload)
  ) {
    throw new ApiError({ message: "Invalid API response envelope" });
  }

  return (payload as ApiEnvelope<T>).data;
}

async function request<T>(
  method: AxiosRequestConfig["method"],
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await httpClient.request<ApiEnvelope<T>>({
    method,
    url,
    ...config,
  });

  return unwrapEnvelope<T>(response.data);
}

export const http = {
  get<T>(url: string, config?: AxiosRequestConfig) {
    return request<T>("get", url, config);
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>("post", url, { ...config, data });
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>("put", url, { ...config, data });
  },
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>("patch", url, { ...config, data });
  },
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return request<T>("delete", url, config);
  },
};
