import { env } from '@/lib/env'
import { ApiError, toApiError } from '@/lib/http/errors'

type ApiEnvelope<T> = {
  data: T
}

export type HttpRequestConfig = {
  signal?: AbortSignal
  headers?: Record<string, string>
}

const REQUEST_TIMEOUT_MS = 15_000

function resolveUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  const base = env.apiBaseUrl || ''
  return `${base}${path}`
}

function mergeSignal(
  external: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  if (!external) return timeoutSignal
  return AbortSignal.any([external, timeoutSignal])
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload === null || typeof payload !== 'object' || !('data' in payload)) {
    throw new ApiError({ message: 'Invalid API response envelope' })
  }

  return (payload as ApiEnvelope<T>).data
}

async function readErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

async function request<T>(
  method: string,
  url: string,
  config?: HttpRequestConfig & { body?: unknown },
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...config?.headers,
  }

  let body: string | undefined
  if (config?.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(resolveUrl(url), {
      method,
      headers,
      body,
      signal: mergeSignal(config?.signal, REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      const body = await readErrorBody(response)
      throw new ApiError({
        message:
          (typeof body === 'object' &&
          body &&
          'message' in body &&
          typeof body.message === 'string'
            ? body.message
            : undefined) ?? 'Request failed',
        status: response.status,
        cause: body,
      })
    }

    const payload: unknown = await response.json()
    return unwrapEnvelope<T>(payload)
  } catch (error) {
    throw toApiError(error)
  }
}

export const http = {
  get<T>(url: string, config?: HttpRequestConfig) {
    return request<T>('GET', url, config)
  },
  post<T>(url: string, data?: unknown, config?: HttpRequestConfig) {
    return request<T>('POST', url, { ...config, body: data })
  },
  put<T>(url: string, data?: unknown, config?: HttpRequestConfig) {
    return request<T>('PUT', url, { ...config, body: data })
  },
  patch<T>(url: string, data?: unknown, config?: HttpRequestConfig) {
    return request<T>('PATCH', url, { ...config, body: data })
  },
  delete<T>(url: string, config?: HttpRequestConfig) {
    return request<T>('DELETE', url, config)
  },
}
