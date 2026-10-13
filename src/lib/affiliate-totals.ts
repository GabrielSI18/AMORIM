/**
 * Totais do afiliado calculados a partir das indicações.
 *
 * Os campos `total_sales`, `total_earned` e `total_bookings` na tabela de
 * afiliados só eram incrementados quando a comissão era marcada como PAGA —
 * então um parceiro com vendas aguardando pagamento aparecia zerado no painel.
 * Agora a fonte da verdade são as próprias indicações; os campos da tabela
 * continuam existindo (histórico/compatibilidade) e são recalculados a partir
 * daqui, nunca mais por incremento.
 */

export interface ReferralTotalsInput {
  sale_amount: number
  commission_amount: number
  commission_status: string | null
}

export interface AffiliateTotals {
  /** Quantidade de indicações (exclui as rejeitadas) */
  totalReferrals: number
  /** Soma das vendas indicadas, em centavos */
  totalSales: number
  /** Comissão de vendas ainda não confirmadas pelo admin */
  pendingCommission: number
  /** Comissão confirmada e ainda não paga */
  approvedCommission: number
  /** Comissão já paga ao afiliado */
  paidCommission: number
  /** Tudo que o afiliado tem a receber (pendente + aprovado) */
  receivableCommission: number
  /** Comissão total gerada (pendente + aprovada + paga) */
  totalCommission: number
}

const statusOf = (referral: ReferralTotalsInput) => (referral.commission_status || '').toLowerCase()

export function computeAffiliateTotals(referrals: ReferralTotalsInput[]): AffiliateTotals {
  const valid = referrals.filter((r) => statusOf(r) !== 'rejected')
  const sumCommission = (status: string) =>
    valid.filter((r) => statusOf(r) === status).reduce((total, r) => total + (r.commission_amount || 0), 0)

  const pendingCommission = sumCommission('pending')
  const approvedCommission = sumCommission('approved')
  const paidCommission = sumCommission('paid')

  return {
    totalReferrals: valid.length,
    totalSales: valid.reduce((total, r) => total + (r.sale_amount || 0), 0),
    pendingCommission,
    approvedCommission,
    paidCommission,
    receivableCommission: pendingCommission + approvedCommission,
    totalCommission: pendingCommission + approvedCommission + paidCommission,
  }
}
