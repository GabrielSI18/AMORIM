/**
 * Retenção da comissão até a viagem acontecer.
 *
 * O cliente paga meses antes de viajar e, se desistir, a Amorim normalmente
 * devolve o dinheiro. Comissão paga antes disso é dinheiro perdido — e abre a
 * porta para o golpe de "vender" para conhecidos que cancelam depois. Por isso
 * a comissão aprovada fica RETIDA e só é liberada para pagamento quando a
 * viagem já saiu.
 *
 * Ciclo de uma indicação:
 *   pending   → o cliente ainda não pagou a reserva
 *   approved  → cliente pagou; fica RETIDA até a liberação
 *               (dia seguinte à saída do pacote, horário de Brasília)
 *   approved  → depois disso, LIBERADA para a equipe pagar o PIX
 *   paid      → PIX enviado
 *   rejected  → reserva cancelada; não paga nunca
 *
 * Este arquivo é puro (sem banco): é usado nas rotas e nas telas.
 */

import { todayCutoff } from '@/lib/package-expiration'

/**
 * Dias depois da data de saída até a comissão poder ser paga.
 * Com 1, o ônibus que sai na quarta à noite libera a comissão na quinta,
 * quando o grupo já chegou. Mudou a política? Altere só aqui.
 */
export const RELEASE_DAYS_AFTER_DEPARTURE = 1

/** Situação da comissão do ponto de vista do pagamento */
export type PayoutState =
  /** cliente ainda não pagou a reserva */
  | 'awaiting_payment'
  /** cliente pagou, viagem ainda não aconteceu */
  | 'retained'
  /** viagem já saiu: pode pagar o afiliado */
  | 'releasable'
  | 'paid'
  | 'rejected'

const DAY_MS = 24 * 60 * 60 * 1000

/** Meia-noite UTC do dia da data — é assim que as datas de pacote são guardadas */
function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

/** Data a partir da qual a comissão pode ser paga; null quando o pacote não tem data de saída */
export function commissionReleaseDate(departureDate: Date | string | null | undefined): Date | null {
  if (!departureDate) return null
  const departure = new Date(departureDate)
  if (Number.isNaN(departure.getTime())) return null
  return new Date(utcDay(departure) + RELEASE_DAYS_AFTER_DEPARTURE * DAY_MS)
}

/**
 * Em que pé está o pagamento da comissão.
 * Sem data de saída a comissão fica retida: liberar é decisão manual da equipe.
 */
export function payoutState(
  commissionStatus: string | null | undefined,
  releaseDate: Date | string | null | undefined,
  now: Date = new Date(),
): PayoutState {
  const status = (commissionStatus || '').toLowerCase()
  if (status === 'paid') return 'paid'
  if (status === 'rejected') return 'rejected'
  if (status !== 'approved') return 'awaiting_payment'
  if (!releaseDate) return 'retained'

  const release = new Date(releaseDate)
  if (Number.isNaN(release.getTime())) return 'retained'
  return todayCutoff(now).getTime() >= release.getTime() ? 'releasable' : 'retained'
}

export const PAYOUT_STATE_LABELS: Record<PayoutState, string> = {
  awaiting_payment: 'Aguardando pagamento do cliente',
  retained: 'Retida até a viagem',
  releasable: 'Liberada para pagamento',
  paid: 'Paga',
  rejected: 'Cancelada',
}

export interface RetentionTotals {
  /** cliente pagou, viagem ainda não saiu */
  retainedCommission: number
  retainedCount: number
  /** viagem já saiu, falta só pagar o PIX */
  releasableCommission: number
  releasableCount: number
}

export function computeRetentionTotals(
  referrals: { commission_amount: number | null; payout_state: PayoutState }[],
): RetentionTotals {
  const sum = (state: PayoutState) =>
    referrals.filter((r) => r.payout_state === state).reduce((total, r) => total + (r.commission_amount || 0), 0)
  const count = (state: PayoutState) => referrals.filter((r) => r.payout_state === state).length

  return {
    retainedCommission: sum('retained'),
    retainedCount: count('retained'),
    releasableCommission: sum('releasable'),
    releasableCount: count('releasable'),
  }
}

/** "17/03/2027" — datas de pacote são dia UTC, então formata em UTC */
export function formatReleaseDate(date: Date | string | null | undefined): string | null {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}
