/**
 * API Error Handling Utilities
 * 
 * Helpers para tratamento consistente de erros em API calls
 */

import { toast } from 'sonner';

// Tipos de erro conhecidos
export type ApiErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  status?: number;
}

// Mensagens padrão por código de erro
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: 'Você precisa estar logado para realizar esta ação.',
  FORBIDDEN: 'Você não tem permissão para realizar esta ação.',
  NOT_FOUND: 'O recurso solicitado não foi encontrado.',
  VALIDATION_ERROR: 'Os dados enviados são inválidos.',
  RATE_LIMITED: 'Muitas requisições. Aguarde um momento e tente novamente.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNKNOWN: 'Ocorreu um erro inesperado.',
};

/**
 * Converte status HTTP para código de erro
 */
function statusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 400:
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMITED';
    case 500:
    case 502:
    case 503:
      return 'SERVER_ERROR';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Processa resposta de erro da API
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  const code = statusToErrorCode(response.status);
  
  try {
    const data = await response.json();
    return {
      code,
      message: data.error || data.message || ERROR_MESSAGES[code],
      details: data.details,
      status: response.status,
    };
  } catch {
    return {
      code,
      message: ERROR_MESSAGES[code],
      status: response.status,
    };
  }
}

/**
 * Wrapper para fetch com tratamento de erros
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await parseApiError(response);
      return { data: null, error };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    // Erro de rede (sem internet, CORS, etc)
    const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
    
    return {
      data: null,
      error: {
        code: isNetworkError ? 'NETWORK_ERROR' : 'UNKNOWN',
        message: isNetworkError 
          ? ERROR_MESSAGES.NETWORK_ERROR 
          : (err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN),
      },
    };
  }
}

/**
 * Wrapper para POST requests
 */
export async function apiPost<T, B = unknown>(
  url: string,
  body: B,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<{ data: T | null; error: ApiError | null }> {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Mostra toast de erro baseado no ApiError
 */
export function showErrorToast(error: ApiError, customMessage?: string) {
  toast.error(customMessage || error.message, {
    description: error.code !== 'UNKNOWN' ? `Código: ${error.code}` : undefined,
  });
}

/**
 * Mostra toast de sucesso
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, { description });
}

/**
 * Mostra toast de loading (retorna ID para dismiss)
 */
export function showLoadingToast(message: string) {
  return toast.loading(message);
}

/**
 * Remove toast por ID
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

/**
 * Hook-like helper para operações async com feedback visual
 * 
 * @example
 * const result = await withToast(
 *   () => apiPost('/api/checkout', { priceId }),
 *   {
 *     loading: 'Processando pagamento...',
 *     success: 'Redirecionando para checkout!',
 *     error: 'Erro ao processar pagamento',
 *   }
 * );
 */
export async function withToast<T>(
  fn: () => Promise<{ data: T | null; error: ApiError | null }>,
  messages: {
    loading: string;
    success: string;
    error?: string;
  }
): Promise<{ data: T | null; error: ApiError | null }> {
  const toastId = showLoadingToast(messages.loading);
  
  try {
    const result = await fn();
    
    dismissToast(toastId);
    
    if (result.error) {
      showErrorToast(result.error, messages.error);
    } else {
      showSuccessToast(messages.success);
    }
    
    return result;
  } catch (err) {
    dismissToast(toastId);
    
    const error: ApiError = {
      code: 'UNKNOWN',
      message: err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN,
    };
    
    showErrorToast(error, messages.error);
    
    return { data: null, error };
  }
}

/**
 * Trata erro e redireciona se não autorizado
 */
export function handleUnauthorized(error: ApiError) {
  if (error.code === 'UNAUTHORIZED') {
    window.location.href = '/sign-in';
    return true;
  }
  return false;
}
