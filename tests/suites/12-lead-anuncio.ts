/**
 * Lead da página de anúncio (/lp/[slug]): quem passou pelo filtro e foi para o
 * WhatsApp fica salvo na Central de Contatos.
 */

import { describe, it, assert, assertEqual, assertStatus, call, jsonRequest } from '../harness'
import { table } from '../mocks/prisma'
import { POST as createContact } from '@/app/api/contacts/route'

let ip = 9000
const freshIp = () => ({ 'cf-connecting-ip': `100.80.${Math.floor(ip / 255) % 255}.${ip++ % 255}` })

const lead = (over: Record<string, unknown> = {}) => ({
  type: 'lead',
  name: 'Maria Cliente',
  phone: '(31) 97777-6666',
  subject: 'Anúncio: Caldas Novas – Novembro 2026',
  message: 'Olá! Vi o anúncio de Caldas Novas e quero reservar.\nQuem vai: 2 adultos',
  destination: 'Caldas Novas – Novembro 2026',
  departureDate: '2026-11-11T12:00:00.000Z',
  passengersCount: 2,
  website: '',
  ...over,
})

export function register() {
  describe('Lead da página de anúncio', () => {
    it('lead entra na Central de Contatos com prioridade alta', async () => {
      const res = await call(createContact, jsonRequest('POST', '/api/contacts', lead(), freshIp()))

      assertStatus(res, 201)
      const c = table('contact')[0]
      assertEqual(c.type, 'lead')
      assertEqual(c.priority, 'high')
      assertEqual(c.status, 'pending')
      assertEqual(c.phone, '31977776666', 'telefone salvo só com dígitos')
      assertEqual(c.passengers_count, 2)
      assert(c.departure_date instanceof Date, 'faltou a data da viagem')
    })

    it('lead não precisa de e-mail', async () => {
      const res = await call(createContact, jsonRequest('POST', '/api/contacts', lead({ email: undefined }), freshIp()))
      assertStatus(res, 201)
      assertEqual(table('contact')[0].email, '')
    })

    it('sem WhatsApp válido o lead é recusado', async () => {
      for (const phone of [undefined, '', '123', 'abc', '319999999999999']) {
        const res = await call(createContact, jsonRequest('POST', '/api/contacts', lead({ phone }), freshIp()))
        assertStatus(res, 400, `phone=${JSON.stringify(phone)}:`)
      }
      assertEqual(table('contact').length, 0)
    })

    it('nome vazio ou gigante é recusado', async () => {
      for (const name of ['', 'A', 'N'.repeat(500)]) {
        const res = await call(createContact, jsonRequest('POST', '/api/contacts', lead({ name }), freshIp()))
        assertStatus(res, 400, `name com ${name.length} caracteres:`)
      }
    })

    it('robô que preenche o campo-isca não grava nada', async () => {
      const res = await call(
        createContact,
        jsonRequest('POST', '/api/contacts', lead({ website: 'http://spam.example' }), freshIp()),
      )
      assert(res.status < 400, 'o robô não deve perceber que foi barrado')
      assertEqual(table('contact').length, 0)
    })

    it('formulário de contato comum continua exigindo e-mail', async () => {
      const res = await call(
        createContact,
        jsonRequest(
          'POST',
          '/api/contacts',
          { name: 'Fulano', phone: '31977776666', message: 'Quero saber de fretamento para o grupo' },
          freshIp(),
        ),
      )
      assertStatus(res, 400)
    })

    it('rajada de leads do mesmo IP é barrada', async () => {
      const mesmoIp = { 'cf-connecting-ip': '100.99.0.1' }
      let barradas = 0
      for (let i = 0; i < 10; i++) {
        const res = await call(createContact, jsonRequest('POST', '/api/contacts', lead(), mesmoIp))
        if (res.status === 429) barradas++
      }
      assert(barradas > 0, 'dez leads seguidos do mesmo IP passaram todos')
    })
  })
}
