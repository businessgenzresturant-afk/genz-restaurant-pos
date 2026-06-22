/**
 * Enhanced API Client with automatic retries, error handling, and request deduplication
 * Optimized for high-volume operations (1000+ orders/day)
 */

import { toast } from 'sonner';

interface RequestConfig extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  dedupe?: boolean;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Rate limiting tracker (client-side)
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 50; // Conservative client-side limit

/**
 * Check if we're rate limited (client-side check)
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Remove old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }
  
  return requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE;
}

/**
 * Create a unique key for request deduplication
 */
function getRequestKey(url: string, options: RequestInit): string {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

/**
 * Sleep utility for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced fetch with automatic retries, timeout, and error handling
 */
async function fetchWithRetry(
  url: string,
  config: RequestConfig = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    dedupe = true,
    ...fetchOptions
  } = config;

  // Request deduplication for GET requests
  if (dedupe && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const key = getRequestKey(url, fetchOptions);
    const pending = pendingRequests.get(key);
    if (pending) {
      return pending;
    }
  }

  // Client-side rate limiting
  if (checkRateLimit()) {
    throw new Error('Too many requests. Please wait a moment.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const attemptFetch = async (attemptNumber: number): Promise<Response> => {
    try {
      requestTimestamps.push(Date.now());

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on 5xx errors or 429 (rate limit)
      if (response.status >= 500 || response.status === 429) {
        if (attemptNumber < retries) {
          const delay = retryDelay * Math.pow(2, attemptNumber); // Exponential backoff
          console.warn(`Request failed with ${response.status}, retrying in ${delay}ms... (attempt ${attemptNumber + 1}/${retries})`);
          await sleep(delay);
          return attemptFetch(attemptNumber + 1);
        }
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (attemptNumber < retries && error.name !== 'AbortError') {
        const delay = retryDelay * Math.pow(2, attemptNumber);
        console.warn(`Request failed, retrying in ${delay}ms... (attempt ${attemptNumber + 1}/${retries})`);
        await sleep(delay);
        return attemptFetch(attemptNumber + 1);
      }

      throw error;
    }
  };

  const request = attemptFetch(0);

  // Cache GET requests for deduplication
  if (dedupe && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const key = getRequestKey(url, fetchOptions);
    pendingRequests.set(key, request);
    request.finally(() => {
      setTimeout(() => pendingRequests.delete(key), 1000); // Clear after 1s
    });
  }

  return request;
}

/**
 * API Client class with typed methods
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorData: any = null;

      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Response is not JSON
      }

      const error = new Error(errorMessage) as ApiError;
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    try {
      return JSON.parse(text);
    } catch {
      return text as any;
    }
  }

  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const response = await fetchWithRetry(`${this.baseUrl}${url}`, {
      method: 'GET',
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await fetchWithRetry(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      dedupe: false, // Don't dedupe POST requests
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await fetchWithRetry(`${this.baseUrl}${url}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      dedupe: false,
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await fetchWithRetry(`${this.baseUrl}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      dedupe: false,
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const response = await fetchWithRetry(`${this.baseUrl}${url}`, {
      method: 'DELETE',
      dedupe: false,
      ...config,
    });
    return this.handleResponse<T>(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient('/api');

/**
 * Wrapper with toast notifications for common operations
 */
export async function apiWithToast<T>(
  promise: Promise<T>,
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  }
): Promise<T> {
  const loadingToast = messages?.loading ? toast.loading(messages.loading) : null;

  try {
    const result = await promise;
    if (loadingToast) toast.dismiss(loadingToast);
    if (messages?.success) toast.success(messages.success);
    return result;
  } catch (error: any) {
    if (loadingToast) toast.dismiss(loadingToast);
    const errorMessage = messages?.error || error.message || 'Operation failed';
    toast.error(errorMessage);
    throw error;
  }
}

export default apiClient;
