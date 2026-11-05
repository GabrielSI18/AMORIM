/**
 * Camada de email falsa: nada sai daqui, só fica registrado para os testes
 * conferirem quem seria notificado.
 */

export interface SentEmail {
  kind: string
  to: string
  payload: Record<string, unknown>
}

export const sentEmails: SentEmail[] = []

export function resetEmails() {
  sentEmails.length = 0
}

const record = (kind: string) => async (params: any) => {
  sentEmails.push({ kind, to: params?.to, payload: params })
  return { success: true, messageId: `fake-${sentEmails.length}` }
}

export const sendEmail = record('raw')
export const sendEmailWithTemplate = record('template')
export const sendWelcomeEmail = record('welcome')
export const sendAffiliateApprovedEmail = record('affiliate.approved')
export const sendAffiliateNewSaleEmail = record('affiliate.newSale')
export const sendAffiliateCommissionPaidEmail = record('affiliate.commissionPaid')
export const renderEmailTemplate = async () => ({ html: '', text: '' })
