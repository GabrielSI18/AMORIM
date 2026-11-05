/**
 * Cadastro, aprovação, exclusão — o ciclo de vida do parceiro.
 */

import { describe, it, assert, assertEqual, assertStatus, call, jsonRequest, getRequest } from '../harness'
import { table, seed } from '../mocks/prisma'
import { sentEmails } from '../mocks/email'
import { setSession } from '../mocks/clerk'
import { seedAffiliate, seedUser, seedAdmin } from '../fixtures'

import { POST as postMe, GET as getMe } from '@/app/api/affiliates/me/route'
import { DELETE as deleteAffiliate, PATCH as patchAffiliate } from '@/app/api/affiliates/route'
import { DELETE as deleteAffiliateById, PATCH as patchAffiliateById } from '@/app/api/affiliates/[id]/route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

const ref = (over: Record<string, any> = {}) => ({
  package_title: 'Caldas',
  customer_email: 'c@c.com',
  sale_amount: 149000,
  commission_amount: 10430,
  commission_status: 'paid',
  ...over,
})

export function register() {
  describe('Cadastro e ciclo de vida', () => {
    it('cadastro novo nasce pendente, com 7% e código próprio', async () => {
      const user = seedUser({ email: 'joao@parceiro.com', first_name: 'João', last_name: 'Silva' })
      setSession(user.clerk_id)
      const res = await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '31988887777' }))
      setSession(null)

      assertStatus(res, 201)
      const aff = table('affiliate')[0]
      assertEqual(aff.status, 'pending')
      assertEqual(aff.commission_rate, 7)
      assertEqual(aff.email, 'joao@parceiro.com')
      assert(/^[A-Z]{1,6}[A-Z0-9]{4}$/.test(aff.code), `código fora do padrão: ${aff.code}`)
    })

    it('nome sem letras ainda gera código utilizável', async () => {
      const user = seedUser({ email: 'z@z.com', first_name: '123', last_name: '456' })
      setSession(user.clerk_id)
      await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '31988887777' }))
      setSession(null)

      const code = table('affiliate')[0].code
      assert(code.length >= 4, `código curto demais: "${code}"`)
    })

    it('dois parceiros com o mesmo nome não repetem código', async () => {
      for (let i = 0; i < 6; i++) {
        const user = seedUser({ email: `joao${i}@x.com`, first_name: 'João', last_name: 'Silva' })
        setSession(user.clerk_id)
        await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '31988887777' }))
        setSession(null)
      }
      const codes = table('affiliate').map((a) => a.code)
      assertEqual(new Set(codes).size, codes.length, `códigos repetidos: ${codes.join(', ')}`)
    })

    it('CPF já cadastrado em outro parceiro responde erro tratado, não 500', async () => {
      seedAffiliate({ code: 'OUTRO01', email: 'outro@x.com', cpf: '11122233344' })
      const user = seedUser({ email: 'novo@x.com' })

      setSession(user.clerk_id)
      const res = await call(
        postMe,
        jsonRequest('POST', '/api/affiliates/me', { phone: '31988887777', cpf: '111.222.333-44' }),
      )
      setSession(null)

      assert(res.status < 500, `CPF duplicado deu HTTP ${res.status}`)
      assert(
        typeof res.body.error === 'string' && res.body.error.length > 0,
        'faltou mensagem explicando o conflito',
      )
    })

    it('cadastro órfão com o mesmo email é vinculado, sem virar duplicata', async () => {
      seedAffiliate({ code: 'ORFAO01', email: 'orfao@x.com', user_id: null, status: 'active' })
      const user = seedUser({ email: 'orfao@x.com' })

      setSession(user.clerk_id)
      const res = await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '31988887777' }))
      setSession(null)

      assertStatus(res, 200)
      assertEqual(table('affiliate').length, 1)
      assertEqual(table('affiliate')[0].user_id, user.id)
      assertEqual(table('affiliate')[0].code, 'ORFAO01', 'o código do parceiro não pode mudar')
    })

    it('vinculação não transfere afiliado que já é de outra conta', async () => {
      const dono = seedUser({ email: 'dono@x.com' })
      seedAffiliate({ code: 'DONO01', email: 'dono@x.com', user_id: dono.id })
      const invasor = seedUser({ email: 'dono@x.com'.replace('dono', 'invasor') })

      setSession(invasor.clerk_id)
      await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '31988887777' }))
      setSession(null)

      const doDono = table('affiliate').find((a) => a.code === 'DONO01')
      assertEqual(doDono?.user_id, dono.id, 'o afiliado trocou de dono')
    })

    it('aprovação dispara um email só, mesmo salvando de novo', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01', status: 'pending', email: 'maria@parceiro.com' })

      setSession(admin.clerk_id)
      await call(patchAffiliateById, jsonRequest('PATCH', `/api/affiliates/${aff.id}`, { status: 'active' }), ctx(aff.id))
      await call(patchAffiliateById, jsonRequest('PATCH', `/api/affiliates/${aff.id}`, { status: 'active' }), ctx(aff.id))
      await call(patchAffiliateById, jsonRequest('PATCH', `/api/affiliates/${aff.id}`, { commission_rate: 8 }), ctx(aff.id))
      setSession(null)
      await new Promise((r) => setTimeout(r, 10))

      const aprovacoes = sentEmails.filter((e) => e.kind === 'affiliate.approved')
      assertEqual(aprovacoes.length, 1, `foram ${aprovacoes.length} emails de aprovação`)
      assert(table('affiliate')[0].approved_at instanceof Date, 'faltou data de aprovação')
    })

    it('suspender parceiro corta a comissão na hora', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01', status: 'active' })

      setSession(admin.clerk_id)
      await call(patchAffiliateById, jsonRequest('PATCH', `/api/affiliates/${aff.id}`, { status: 'suspended' }), ctx(aff.id))
      setSession(null)

      const { seedPackage, bookingBody } = await import('../fixtures')
      const { POST: createBooking } = await import('@/app/api/bookings/route')
      seedPackage()
      const res = await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), {
          'cf-connecting-ip': '198.18.0.1',
        }),
      )

      assertEqual(res.body.affiliateApplied, null)
      assertEqual(table('affiliateReferral').length, 0)
    })

    it('não dá para apagar parceiro com histórico de comissão', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01' })
      seed('affiliateReferral', [ref({ affiliate_id: aff.id })])

      setSession(admin.clerk_id)
      const porId = await call(deleteAffiliateById, getRequest(`/api/affiliates/${aff.id}`), ctx(aff.id))
      const coletivo = await call(deleteAffiliate, getRequest(`/api/affiliates?id=${aff.id}`))
      setSession(null)

      assertStatus(porId, 400, 'DELETE /api/affiliates/[id]:')
      assert(coletivo.status >= 400, `DELETE /api/affiliates?id= devolveu ${coletivo.status}`)
      assertEqual(table('affiliate').length, 1, 'o parceiro foi apagado')
      assertEqual(table('affiliateReferral').length, 1, 'o histórico de comissão foi apagado junto')
    })

    it('parceiro sem histórico pode ser apagado', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'VAZIO01' })

      setSession(admin.clerk_id)
      const res = await call(deleteAffiliateById, getRequest(`/api/affiliates/${aff.id}`), ctx(aff.id))
      setSession(null)

      assertStatus(res, 200)
      assertEqual(table('affiliate').length, 0)
    })

    it('quem não é afiliado recebe isAffiliate=false, não erro', async () => {
      const user = seedUser({ email: 'ninguem@x.com' })
      setSession(user.clerk_id)
      const res = await call(getMe, getRequest('/api/affiliates/me'))
      setSession(null)

      assertStatus(res, 200)
      assertEqual(res.body.isAffiliate, false)
    })

    it('PATCH coletivo não apaga a chave PIX sem querer', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01', pix_key: 'maria@pix.com' })

      setSession(admin.clerk_id)
      await call(patchAffiliate, jsonRequest('PATCH', '/api/affiliates', { id: aff.id, status: 'active' }))
      setSession(null)

      assertEqual(table('affiliate')[0].pix_key, 'maria@pix.com')
    })
  })
}
