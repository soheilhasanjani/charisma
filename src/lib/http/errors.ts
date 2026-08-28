import { isAxiosError } from "axios";

type ApiErrorInit = {
  message: string;
  status?: number;
  code?: string;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  isCanceled?: boolean;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;
  readonly isCanceled: boolean;
  override readonly cause: unknown;

  constructor(init: ApiErrorInit) {
    super(init.message, { cause: init.cause });
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.isNetworkError = init.isNetworkError ?? false;
    this.isTimeout = init.isTimeout ?? false;
    this.isCanceled = init.isCanceled ?? false;
    this.cause = init.cause;
  }
}

function messageFromBody(data: unknown): string | undefined {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
    if (typeof body.error === "string" && body.error.trim()) {
      return body.error;
    }
  }

  return undefined;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const code = error.code;
    const isCanceled =
      code === "ERR_CANCELED" || error.name === "CanceledError";
    const isTimeout =
      code === "ECONNABORTED" ||
      code === "ETIMEDOUT" ||
      error.message.toLowerCase().includes("timeout");

    return new ApiError({
      message:
        messageFromBody(error.response?.data) ??
        error.message ??
        "Request failed",
      status,
      code,
      isNetworkError: !error.response && !isCanceled,
      isTimeout: isTimeout && !isCanceled,
      isCanceled,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ message: error.message, cause: error });
  }

  return new ApiError({ message: "Unexpected error", cause: error });
}

export function getUserFacingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isTimeout) {
      return "زمان پاسخ سرور به پایان رسید. دوباره تلاش کنید.";
    }
    if (error.isNetworkError) {
      return "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.";
    }
    if (error.status === 429) {
      return "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.";
    }
    if (error.status !== undefined && error.status >= 500) {
      return "خطای سرور رخ داد. دوباره تلاش کنید.";
    }
  }

  return "بارگذاری اطلاعات ناموفق بود. دوباره تلاش کنید.";
}
