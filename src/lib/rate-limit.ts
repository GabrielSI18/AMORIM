/**
 * Rate Limiter
 * 
 * Rate limiting in-memory simples para proteção de API routes.
 * Para produção em escala, considere usar Redis (Upstash) ou similar.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  /** Número máximo de requests permitidos no intervalo */
  limit: number;
  /** Janela de tempo em segundos */
  windowInSeconds: number;
}

// Store in-memory (limpa automaticamente entradas expiradas)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpa entradas expiradas periodicamente (a cada 60s)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

/**
 * Verifica se um identificador está dentro do limite de rate
 * 
 * @param identifier - Identificador único (userId, IP, etc)
 * @param options - Configurações de limite
 * @returns Objeto com status e informações de limite
 * 
 * @example
 * ```ts
 * const result = checkRateLimit(userId, { limit: 10, windowInSeconds: 60 });
 * if (!result.success) {
 *   return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimiterOptions
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetIn: number;
} {
  const { limit, windowInSeconds } = options;
  const now = Date.now();
  const windowMs = windowInSeconds * 1000;
  
  const entry = rateLimitStore.get(identifier);
  
  // Primeira requisição ou janela expirada
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetIn: windowInSeconds,
    };
  }
  
  // Incrementa contador
  entry.count += 1;
  
  // Verifica se excedeu limite
  if (entry.count > limit) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      resetIn,
    };
  }
  
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Cria um rate limiter com configurações predefinidas
 * 
 * @example
 * ```ts
 * const apiLimiter = createRateLimiter({ limit: 100, windowInSeconds: 60 });
 * 
 * export async function POST(req: Request) {
 *   const userId = await getUserId();
 *   const { success, remaining } = apiLimiter(userId);
 *   
 *   if (!success) {
 *     return Response.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 *   
 *   // ... processo normal
 * }
 * ```
 */
export function createRateLimiter(options: RateLimiterOptions) {
  return (identifier: string) => checkRateLimit(identifier, options);
}

// ============================================
// Rate Limiters Predefinidos
// ============================================

/**
 * Rate limiter para APIs gerais
 * 100 requests por minuto
 */
export const generalApiLimiter = createRateLimiter({
  limit: 100,
  windowInSeconds: 60,
});

/**
 * Rate limiter para operações de checkout/pagamento
 * 10 requests por minuto (mais restritivo)
 */
export const checkoutLimiter = createRateLimiter({
  limit: 10,
  windowInSeconds: 60,
});

/**
 * Rate limiter para chat/IA
 * 30 requests por minuto
 */
export const chatLimiter = createRateLimiter({
  limit: 30,
  windowInSeconds: 60,
});

/**
 * Rate limiter para geração de imagens
 * 5 requests por minuto (caro computacionalmente)
 */
export const imageLimiter = createRateLimiter({
  limit: 5,
  windowInSeconds: 60,
});

/**
 * Rate limiter para webhooks
 * 1000 requests por minuto (webhooks podem vir em rajadas)
 */
export const webhookLimiter = createRateLimiter({
  limit: 1000,
  windowInSeconds: 60,
});

// ============================================
// Helper para API Routes
// ============================================

/**
 * Retorna headers de rate limit para a resposta
 */
export function getRateLimitHeaders(result: ReturnType<typeof checkRateLimit>) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetIn.toString(),
  };
}

/**
 * Resposta padrão para rate limit excedido
 */
export function rateLimitExceededResponse(result: ReturnType<typeof checkRateLimit>) {
  return Response.json(
    { 
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${result.resetIn} seconds.`,
      retryAfter: result.resetIn,
    },
    { 
      status: 429,
      headers: {
        ...getRateLimitHeaders(result),
        'Retry-After': result.resetIn.toString(),
      },
    }
  );
}
