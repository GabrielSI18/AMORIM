/**
 * Faixas de comissão do programa de afiliados.
 *
 * A página pública promete comissão de 7% a 10% conforme o volume de vendas,
 * mas quem muda a taxa é a equipe, na ficha do afiliado — não existe promoção
 * automática. Este arquivo é a tabela oficial usada para avisar o admin quando
 * um parceiro já passou de faixa e continua com a comissão antiga.
 *
 * Mudou a política comercial? Altere só a lista abaixo.
 */

export interface AffiliateTier {
  /** Nome exibido */
  name: string
  /** Mínimo de vendas concluídas para entrar na faixa */
  minSales: number
  /** Comissão em % */
  rate: number
}

export const AFFILIATE_TIERS: AffiliateTier[] = [
  { name: 'Iniciante', minSales: 0, rate: 7 },
  { name: 'Bronze', minSales: 6, rate: 8 },
  { name: 'Prata', minSales: 16, rate: 9 },
  { name: 'Ouro', minSales: 31, rate: 10 },
]

/** Vendas que contam para a faixa: indicação confirmada pelo admin ou já paga */
export const TIER_QUALIFYING_STATUSES = ['approved', 'paid']

export function tierForSales(salesCount: number): AffiliateTier {
  return [...AFFILIATE_TIERS].reverse().find((tier) => salesCount >= tier.minSales) ?? AFFILIATE_TIERS[0]
}

export function nextTier(salesCount: number): AffiliateTier | null {
  return AFFILIATE_TIERS.find((tier) => tier.minSales > salesCount) ?? null
}

export interface TierSuggestion {
  /** Vendas que contaram */
  qualifyingSales: number
  currentTier: AffiliateTier
  nextTier: AffiliateTier | null
  /** Quantas vendas faltam para a próxima faixa */
  salesToNextTier: number | null
  /** true quando a comissão cadastrada está abaixo da faixa alcançada */
  needsUpgrade: boolean
}

export function buildTierSuggestion(
  referrals: { commission_status: string | null }[],
  commissionRate: number
): TierSuggestion {
  const qualifyingSales = referrals.filter((r) =>
    TIER_QUALIFYING_STATUSES.includes((r.commission_status || '').toLowerCase())
  ).length

  const current = tierForSales(qualifyingSales)
  const next = nextTier(qualifyingSales)

  return {
    qualifyingSales,
    currentTier: current,
    nextTier: next,
    salesToNextTier: next ? next.minSales - qualifyingSales : null,
    needsUpgrade: commissionRate < current.rate,
  }
}
