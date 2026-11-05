/**
 * Aprovação e aviso do parceiro são manuais, por WhatsApp: os emails do
 * programa estão desligados em produção. Estes testes seguram o que a tela
 * do admin precisa para montar a mensagem pronta.
 */

import { describe, it, assert, assertEqual, assertStatus, call, getRequest, jsonRequest } from '../harness'
import { table } from '../mocks/prisma'
import { setSession } from '../mocks/clerk'
import { seedAffiliate, seedUser, seedAdmin } from '../fixtures'
import {
  whatsappLink,
  normalizePhone,
  affiliateApprovedMessage,
  affiliateNewSaleMessage,
  affiliateCommissionPaidMessage,
} from '@/lib/whatsapp'

import { GET as listAffiliates } from '@/app/api/affiliates/route'
import { GET as getAffiliateById } from '@/app/api/affiliates/[id]/route'
import { POST as postMe } from '@/app/api/affiliates/me/route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

export function register() {
  describe('Aviso manual por WhatsApp', () => {
    it('telefone brasileiro vira número do wa.me com DDI', () => {
      assertEqual(normalizePhone('(31) 98886-2079'), '5531988862079')
      assertEqual(normalizePhone('31988862079'), '5531988862079')
      assertEqual(normalizePhone('5531988862079'), '5531988862079')
      assertEqual(normalizePhone('3133334444'), '553133334444')
    })

    it('telefone inválido não vira link quebrado', () => {
      assertEqual(normalizePhone(''), null)
      assertEqual(normalizePhone(null), null)
      assertEqual(normalizePhone('123'), null)
      assertEqual(whatsappLink('123', 'oi'), null)
      assertEqual(whatsappLink(null, 'oi'), null)
    })

    it('mensagem de aprovação leva código, comissão e link de divulgação', () => {
      const msg = affiliateApprovedMessage({
        affiliateName: 'Maria Souza Oliveira',
        code: 'MARIA01',
        commissionRate: 7,
        siteUrl: 'https://amorimturismo.com.br',
      })

      assert(msg.includes('Maria'), 'faltou o primeiro nome')
      assert(!msg.includes('Oliveira'), 'não precisa do nome inteiro na saudação')
      assert(msg.includes('MARIA01'), 'faltou o código')
      assert(msg.includes('7%'), 'faltou a comissão')
      assert(msg.includes('?ref=MARIA01'), 'faltou o link de divulgação')
      assert(msg.includes('/dashboard/parceiro'), 'faltou o link do painel')
    })

    it('mensagem de venda e de comissão paga trazem o valor em reais', () => {
      const venda = affiliateNewSaleMessage({
        affiliateName: 'Maria Souza',
        packageTitle: 'Caldas Novas',
        commissionAmount: 10430,
      })
      assert(venda.includes('104,30'), `valor errado na mensagem de venda: ${venda}`)
      assert(venda.includes('Caldas Novas'), 'faltou o pacote')

      const paga = affiliateCommissionPaidMessage({
        affiliateName: 'Maria Souza',
        packageTitle: 'Caldas Novas',
        commissionAmount: 10430,
      })
      assert(paga.includes('104,30'), 'valor errado na mensagem de comissão paga')
      assert(paga.toLowerCase().includes('pix'), 'faltou dizer que foi por PIX')
    })

    it('link montado é um wa.me com a mensagem codificada', () => {
      const link = whatsappLink('(31) 98886-2079', 'Olá, tudo bem?')
      assert(link?.startsWith('https://wa.me/5531988862079?text='), `link inesperado: ${link}`)
      assert(link?.includes('Ol%C3%A1'), 'a mensagem não foi codificada para URL')
    })

    it('listagem do painel traz nome e telefone para montar o aviso', async () => {
      const admin = seedAdmin()
      seedAffiliate({ code: 'MARIA01', name: 'Maria Souza', phone: '31988862079', status: 'pending' })

      setSession(admin.clerk_id)
      const res = await call(listAffiliates, getRequest('/api/affiliates'))
      setSession(null)

      assertStatus(res, 200)
      const registro = res.body.affiliates[0]
      assertEqual(registro.name, 'Maria Souza')
      assertEqual(registro.phone, '31988862079')
      assertEqual(registro.code, 'MARIA01')
      assert(typeof registro.commission_rate === 'number', 'faltou a comissão na listagem')
      assert(
        whatsappLink(registro.phone, 'teste') !== null,
        'não dá para montar o link do WhatsApp com o que a listagem devolve',
      )
    })

    it('ficha do afiliado traz telefone para o botão de avisar', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01', name: 'Maria Souza', phone: '31988862079' })

      setSession(admin.clerk_id)
      const res = await call(getAffiliateById, getRequest(`/api/affiliates/${aff.id}`), ctx(aff.id))
      setSession(null)

      assertEqual(res.body.affiliate.phone, '31988862079')
    })

    it('cadastro exige telefone — sem ele não dá para avisar ninguém', async () => {
      const user = seedUser({ email: 'sem-telefone@x.com' })
      setSession(user.clerk_id)
      const semTelefone = await call(postMe, jsonRequest('POST', '/api/affiliates/me', {}))
      const comTelefone = await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '(31) 98886-2079' }))
      setSession(null)

      assertStatus(semTelefone, 400, 'cadastro sem telefone:')
      assertStatus(comTelefone, 201, 'cadastro com telefone:')
      assertEqual(table('affiliate')[0].phone, '31988862079', 'o telefone precisa ser salvo só com dígitos')
    })

    it('nenhum email é disparado no cadastro (o aviso é manual)', async () => {
      const { sentEmails } = await import('../mocks/email')
      const user = seedUser({ email: 'novo@x.com' })
      setSession(user.clerk_id)
      await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '31988862079' }))
      setSession(null)
      await new Promise((r) => setTimeout(r, 10))

      assertEqual(sentEmails.length, 0, 'o cadastro disparou email')
    })
  })
}
