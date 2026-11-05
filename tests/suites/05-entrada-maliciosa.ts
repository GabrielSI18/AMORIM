/**
 * Entrada torta: injeção, payload gigante, tipo errado, unicode, vazio.
 * Nada aqui pode virar 500 nem gravar lixo no banco.
 */

import { describe, it, assert, assertEqual, assertStatus, call, jsonRequest, getRequest } from '../harness'
import { table } from '../mocks/prisma'
import { setSession } from '../mocks/clerk'
import { seedPackage, seedAffiliate, seedUser, seedAdmin, bookingBody } from '../fixtures'

import { POST as createBooking } from '@/app/api/bookings/route'
import { GET as validateCode } from '@/app/api/affiliates/validate/route'
import { POST as postMe } from '@/app/api/affiliates/me/route'
import { POST as adminCreateAffiliate } from '@/app/api/affiliates/route'

let ip = 3000
const freshIp = () => ({ 'cf-connecting-ip': `10.1.${Math.floor(ip / 255) % 255}.${ip++ % 255}` })

const PAYLOADS: [string, string][] = [
  ['sql', "' OR 1=1 --"],
  ['sql2', "MARIA01'; DROP TABLE affiliates; --"],
  ['xss', '<script>alert(1)</script>'],
  ['template', '${process.env.DATABASE_URL}'],
  ['path', '../../../etc/passwd'],
  ['nulo', 'MARIA\u000001'],
  ['unicode', '𝐌𝐀𝐑𝐈𝐀𝟎𝟏'],
  ['rtl', 'MARIA‮01'],
  ['gigante', 'A'.repeat(10000)],
  ['espacos', '                    '],
]

export function register() {
  describe('Entrada maliciosa', () => {
    it('validate não quebra com nenhum payload torto', async () => {
      seedAffiliate({ code: 'MARIA01' })

      for (const [nome, valor] of PAYLOADS) {
        const res = await call(validateCode, getRequest(`/api/affiliates/validate?code=${encodeURIComponent(valor)}`))
        assert(res.status < 500, `payload "${nome}" derrubou a rota (HTTP ${res.status})`)
        assert(res.body.valid !== true, `payload "${nome}" foi aceito como código válido`)
      }
    })

    it('validate sem parâmetro responde 400 limpo', async () => {
      const res = await call(validateCode, getRequest('/api/affiliates/validate'))
      assertStatus(res, 400)
      assertEqual(res.body.valid, false)
    })

    it('código de indicação torto na reserva não cria comissão nem erro 500', async () => {
      for (const [nome, valor] of PAYLOADS) {
        seedPackage()
        const res = await call(
          createBooking,
          jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: valor }), freshIp()),
        )
        assert(res.status < 500, `payload "${nome}" derrubou a reserva (HTTP ${res.status})`)
        assertEqual(table('affiliateReferral').length, 0, `payload "${nome}" gerou comissão`)
        table('booking').length = 0
        table('package').length = 0
      }
    })

    it('código de indicação com tipo errado não derruba a reserva', async () => {
      seedPackage()
      for (const valor of [123, true, { code: 'X' }, ['MARIA01'], null]) {
        const res = await call(
          createBooking,
          jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: valor as any }), freshIp()),
        )
        assert(res.status < 500, `affiliateCode=${JSON.stringify(valor)} deu HTTP ${res.status}`)
      }
    })

    it('corpo inválido (JSON quebrado) responde erro tratado', async () => {
      seedPackage()
      const req = new Request('https://amorimturismo.com.br/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ isso não é json',
      })
      const res = await call(createBooking, req)
      assert(res.status >= 400 && res.status < 600, 'deveria responder erro')
      assertEqual(table('booking').length, 0)
    })

    it('nome e email gigantes não entram na reserva', async () => {
      seedPackage()
      const res = await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({
            customerName: 'N'.repeat(5000),
            customerEmail: 'e'.repeat(5000) + '@x.com',
          }),
          freshIp(),
        ),
      )

      if (res.status === 201) {
        const b = table('booking')[0]
        assert(b.customer_name.length <= 200, `nome gravado com ${b.customer_name.length} caracteres`)
        assert(b.customer_email.length <= 254, `email gravado com ${b.customer_email.length} caracteres`)
      }
    })

    it('email inválido não entra na reserva', async () => {
      seedPackage()
      const res = await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ customerEmail: 'nao-e-email' }), freshIp()),
      )
      assertStatus(res, 400, 'email sem @ deveria ser recusado:')
    })

    it('cadastro de afiliado recusa telefone e CPF inválidos', async () => {
      const user = seedUser()
      setSession(user.clerk_id)

      for (const body of [
        { phone: '123' },
        { phone: '31988887777', cpf: '123' },
        { phone: '31988887777', state: 'MINAS' },
        { phone: '31988887777', instagramHandle: 'tem espaço' },
      ]) {
        const res = await call(postMe, jsonRequest('POST', '/api/affiliates/me', body))
        assertStatus(res, 400, `body ${JSON.stringify(body)}:`)
      }
      setSession(null)
      assertEqual(table('affiliate').length, 0)
    })

    it('cadastro de afiliado pelo painel recusa email inválido', async () => {
      const admin = seedAdmin()
      setSession(admin.clerk_id)
      const res = await call(
        adminCreateAffiliate,
        jsonRequest('POST', '/api/affiliates', { name: 'Fulano', email: 'invalido' }),
      )
      setSession(null)
      assertStatus(res, 400)
    })

    it('assento fora do ônibus é recusado', async () => {
      seedPackage({ total_seats: 46 })
      for (const assentos of [[0], [-1], [999], [1.5]]) {
        const res = await call(
          createBooking,
          jsonRequest(
            'POST',
            '/api/bookings',
            bookingBody({ numPassengers: 1, selectedSeats: assentos }),
            freshIp(),
          ),
        )
        assert(res.status !== 201, `assento ${JSON.stringify(assentos)} foi aceito`)
      }
    })

    it('número de passageiros absurdo é recusado', async () => {
      seedPackage({ total_seats: 46 })
      for (const n of [0, -3, 9999, 1.5]) {
        const res = await call(
          createBooking,
          jsonRequest('POST', '/api/bookings', bookingBody({ numPassengers: n }), freshIp()),
        )
        assert(res.status !== 201, `numPassengers=${n} foi aceito`)
      }
      assertEqual(table('booking').length, 0)
    })
  })
}
