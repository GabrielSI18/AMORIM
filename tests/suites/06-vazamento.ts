/**
 * O que cada endpoint devolve para quem não deveria ver.
 */

import { describe, it, assert, assertEqual, assertStatus, call, getRequest, jsonRequest } from '../harness'
import { setSession } from '../mocks/clerk'
import { seedPackage, seedAffiliate, seedUser, seedAdmin, bookingBody } from '../fixtures'
import { table } from '../mocks/prisma'

import { GET as validateCode } from '@/app/api/affiliates/validate/route'
import { GET as listAffiliates } from '@/app/api/affiliates/route'
import { GET as listBookings, POST as createBooking } from '@/app/api/bookings/route'

const SEGREDOS = ['11122233344', 'pix-ultra-secreto', '31999990000', 'maria@parceiro.com']

let ip = 4000
const freshIp = () => ({ 'cf-connecting-ip': `172.16.${Math.floor(ip / 255) % 255}.${ip++ % 255}` })

export function register() {
  describe('Vazamento de dados', () => {
    it('validate devolve só o primeiro nome do parceiro', async () => {
      seedAffiliate({
        code: 'MARIA01',
        name: 'Maria Souza Oliveira',
        email: 'maria@parceiro.com',
        cpf: '11122233344',
        phone: '31999990000',
        pix_key: 'pix-ultra-secreto',
        commission_rate: 10,
      })

      const res = await call(validateCode, getRequest('/api/affiliates/validate?code=MARIA01'))
      assertStatus(res, 200)
      assertEqual(res.body.valid, true)
      assertEqual(res.body.firstName, 'Maria')

      const corpo = JSON.stringify(res.body)
      for (const segredo of SEGREDOS) {
        assert(!corpo.includes(segredo), `validate vazou "${segredo}"`)
      }
      assert(!corpo.includes('"commissionRate"') && !corpo.includes('"commission_rate"'), 'vazou a comissão')
      assert(!corpo.includes('Oliveira'), 'vazou o sobrenome completo')
    })

    it('validate não confirma a existência de afiliado inativo', async () => {
      seedAffiliate({ code: 'PEND01', status: 'pending', name: 'Pedro Pendente' })
      const res = await call(validateCode, getRequest('/api/affiliates/validate?code=PEND01'))
      assertEqual(res.body.valid, false)
      assert(!JSON.stringify(res.body).includes('Pedro'), 'vazou o nome do afiliado inativo')
    })

    it('consulta pública de reserva não devolve CPF nem dados dos passageiros', async () => {
      seedPackage()
      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ customerCpf: '11122233344' }), freshIp()),
      )
      const bookingId = table('booking')[0].id

      const res = await call(listBookings, getRequest(`/api/bookings?id=${bookingId}`))
      assertStatus(res, 200)
      const corpo = JSON.stringify(res.body)
      assert(!corpo.includes('11122233344'), 'consulta pública vazou CPF do titular')
      assert(!corpo.includes('customerCpf'), 'consulta pública expôs o campo de CPF')
      assert(!corpo.includes('fullName'), 'consulta pública vazou nome dos passageiros')
      assert(!corpo.includes('customerPhone'), 'consulta pública vazou telefone')
    })

    it('busca de afiliado por id devolve o afiliado pedido, não outro', async () => {
      const admin = seedAdmin()
      const primeiro = seedAffiliate({ code: 'PRIM01', name: 'Primeiro Afiliado', email: 'p@x.com' })
      const alvo = seedAffiliate({ code: 'ALVO01', name: 'Alvo Certo', email: 'a@x.com' })

      setSession(admin.clerk_id)
      const res = await call(listAffiliates, getRequest(`/api/affiliates?id=${alvo.id}`))
      setSession(null)

      assertStatus(res, 200)
      assertEqual(res.body.data?.code, 'ALVO01', 'busca por id trouxe o afiliado errado')
      assert(primeiro.id !== res.body.data?.id || alvo.id === primeiro.id, 'retornou o primeiro da tabela')
    })

    it('busca por código inexistente devolve 404, não o primeiro da lista', async () => {
      const admin = seedAdmin()
      seedAffiliate({ code: 'PRIM01', name: 'Primeiro', email: 'p@x.com' })

      setSession(admin.clerk_id)
      const res = await call(listAffiliates, getRequest('/api/affiliates?code=NAOEXISTE'))
      setSession(null)

      assertStatus(res, 404, 'código inexistente:')
    })

    it('busca por email inexistente devolve 404', async () => {
      const admin = seedAdmin()
      seedAffiliate({ code: 'PRIM01', email: 'p@x.com' })

      setSession(admin.clerk_id)
      const res = await call(listAffiliates, getRequest('/api/affiliates?email=ninguem@lugar.com'))
      setSession(null)

      assertStatus(res, 404)
    })

    it('mensagem de erro não devolve stack trace nem connection string', async () => {
      const res = await call(validateCode, getRequest('/api/affiliates/validate?code=' + 'A'.repeat(300)))
      const corpo = JSON.stringify(res.body)
      assert(!corpo.includes('postgres'), 'vazou connection string')
      assert(!corpo.includes('prisma'), 'vazou detalhe do ORM')
      assert(!corpo.includes('at Object'), 'vazou stack trace')
    })
  })
}
