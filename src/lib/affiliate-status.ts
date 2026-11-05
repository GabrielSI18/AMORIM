/**
 * Status possíveis de um afiliado — lista única usada por todas as rotas.
 *
 * Só `active` recebe comissão (ver POST /api/bookings). Status fora desta
 * lista deixava o parceiro invisível para os filtros do painel e para o
 * lookup da reserva, sem erro nenhum na tela.
 *
 * Gravado sempre em minúsculas.
 */
export const AFFILIATE_STATUSES = ['pending', 'active', 'rejected', 'suspended', 'blocked'] as const

export type AffiliateStatus = (typeof AFFILIATE_STATUSES)[number]

export function isAffiliateStatus(value: unknown): value is AffiliateStatus {
  return typeof value === 'string' && (AFFILIATE_STATUSES as readonly string[]).includes(value.toLowerCase())
}

/** Status de comissão de uma indicação */
export const COMMISSION_STATUSES = ['pending', 'approved', 'paid', 'rejected'] as const

export type CommissionStatus = (typeof COMMISSION_STATUSES)[number]
