/**
 * Links de WhatsApp (wa.me) para os avisos do programa de afiliados.
 *
 * A aprovação é manual e os e-mails estão desligados, então quem avisa é a
 * equipe, pelo WhatsApp: o site monta a mensagem pronta e a pessoa só aperta
 * enviar. Sem API, sem custo e sem aprovação de modelo.
 */

const DEFAULT_COUNTRY_CODE = '55'

/** Normaliza um telefone brasileiro para o formato aceito pelo wa.me */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length >= 12) return digits
  return `${DEFAULT_COUNTRY_CODE}${digits}`
}

/** Monta o link do WhatsApp; devolve null quando não há telefone utilizável */
export function whatsappLink(phone: string | null | undefined, message: string): string | null {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface ApprovedParams {
  affiliateName: string
  code: string
  commissionRate: number
  siteUrl: string
}

/** Equipe -> afiliado: cadastro aprovado */
export function affiliateApprovedMessage({
  affiliateName,
  code,
  commissionRate,
  siteUrl,
}: ApprovedParams): string {
  const firstName = affiliateName.split(' ')[0]
  return [
    `Olá, ${firstName}! Aqui é da Amorim Turismo.`,
    '',
    `Seu cadastro de parceiro foi aprovado. Seu código de indicação é ${code} e sua comissão é de ${commissionRate}% por venda.`,
    '',
    `Seu link para divulgar: ${siteUrl}/pacotes?ref=${code}`,
    '',
    `Acompanhe suas indicações e comissões em ${siteUrl}/dashboard/parceiro`,
  ].join('\n')
}

interface SaleParams {
  affiliateName: string
  packageTitle: string
  commissionAmount: number
}

/** Equipe -> afiliado: entrou uma venda pelo código dele */
export function affiliateNewSaleMessage({
  affiliateName,
  packageTitle,
  commissionAmount,
}: SaleParams): string {
  const firstName = affiliateName.split(' ')[0]
  return [
    `Olá, ${firstName}! Entrou uma reserva pelo seu código de indicação.`,
    '',
    `Pacote: ${packageTitle}`,
    `Sua comissão: ${formatBRL(commissionAmount)}`,
    '',
    'A comissão é confirmada assim que o cliente paga a viagem.',
  ].join('\n')
}

/** Equipe -> afiliado: comissão paga */
export function affiliateCommissionPaidMessage({
  affiliateName,
  packageTitle,
  commissionAmount,
}: SaleParams): string {
  const firstName = affiliateName.split(' ')[0]
  return [
    `Olá, ${firstName}! Sua comissão foi paga.`,
    '',
    `Pacote: ${packageTitle}`,
    `Valor: ${formatBRL(commissionAmount)}`,
    '',
    'O PIX foi enviado para a chave cadastrada no seu painel.',
  ].join('\n')
}

interface NewRegistrationParams {
  affiliateName: string
  email: string
  city?: string | null
  state?: string | null
}

/** Afiliado -> equipe: avisa que o cadastro está aguardando aprovação */
export function affiliateRegistrationMessage({
  affiliateName,
  email,
  city,
  state,
}: NewRegistrationParams): string {
  const place = [city, state].filter(Boolean).join(' - ')
  const dados = [`Nome: ${affiliateName}`, `E-mail: ${email}`]
  if (place) dados.push(`Cidade: ${place}`)

  return [
    'Olá! Acabei de me cadastrar como parceiro no site da Amorim Turismo e meu cadastro está aguardando aprovação.',
    '',
    ...dados,
  ].join('\n')
}
