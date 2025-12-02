/**
 * Zod Validation Schemas
 * 
 * Schemas reutilizáveis para validação de inputs em API routes
 */

import { z } from 'zod';

// ============================================
// Helpers
// ============================================

/**
 * Parse seguro com Zod - retorna { success, data, error }
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Formata erros de forma amigável
  const errorMessages = result.error.issues.map(
    (e) => `${e.path.join('.')}: ${e.message}`
  );
  
  return { success: false, error: errorMessages.join(', ') };
}

/**
 * Valida e retorna dados ou lança erro
 */
export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// ============================================
// Schemas Comuns
// ============================================

/** ID genérico (string não vazia) */
export const idSchema = z.string().min(1, 'ID é obrigatório');

/** Email válido */
export const emailSchema = z.string().email('Email inválido').toLowerCase().trim();

/** URL válida */
export const urlSchema = z.string().url('URL inválida');

/** String não vazia com trim */
export const requiredStringSchema = z.string().min(1, 'Campo obrigatório').trim();

/** String opcional com trim */
export const optionalStringSchema = z.string().trim().optional();

// ============================================
// Schemas de Checkout/Stripe
// ============================================

/** Checkout - criar sessão */
export const checkoutSchema = z.object({
  priceId: z.string()
    .min(1, 'Price ID é obrigatório')
    .regex(/^price_/, 'Price ID deve começar com "price_"'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Portal - abrir portal do cliente */
export const portalSchema = z.object({
  returnUrl: z.string().url('URL de retorno inválida').optional(),
});

export type PortalInput = z.infer<typeof portalSchema>;

// ============================================
// Schemas de Chat/IA
// ============================================

/** Mensagem de chat */
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Mensagem não pode estar vazia').max(32000, 'Mensagem muito longa'),
});

/** Chat request */
export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, 'Pelo menos uma mensagem é necessária'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

/** Completion request */
export const completionRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt é obrigatório').max(32000, 'Prompt muito longo'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
});

export type CompletionRequestInput = z.infer<typeof completionRequestSchema>;

/** Image generation request */
export const imageRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt é obrigatório').max(4000, 'Prompt muito longo'),
  size: z.enum(['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  n: z.number().min(1).max(4).optional(),
});

export type ImageRequestInput = z.infer<typeof imageRequestSchema>;

/** Audio transcription request */
export const audioRequestSchema = z.object({
  audioUrl: z.string().url('URL do áudio inválida'),
  language: z.string().length(2, 'Código de idioma deve ter 2 caracteres').optional(),
});

export type AudioRequestInput = z.infer<typeof audioRequestSchema>;

/** Vision request */
export const visionRequestSchema = z.object({
  imageUrl: z.string().url('URL da imagem inválida'),
  prompt: z.string().min(1, 'Prompt é obrigatório').max(4000, 'Prompt muito longo'),
});

export type VisionRequestInput = z.infer<typeof visionRequestSchema>;

// ============================================
// Schemas de User
// ============================================

/** Atualizar perfil */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  email: emailSchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================
// Schemas de Paginação/Query
// ============================================

/** Paginação padrão */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/** Search com paginação */
export const searchSchema = paginationSchema.extend({
  query: z.string().trim().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchInput = z.infer<typeof searchSchema>;
