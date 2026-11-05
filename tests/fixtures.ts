/**
 * Dados de apoio das suítes. Nada aqui toca o banco real.
 */

import { seed, table } from './mocks/prisma'

export const PKG_ID = 'pkg_caldas'
export const PRICE = 149000 // R$ 1.490,00 em centavos
export const CHILD_11_13 = 119000
export const CHILD_6_10 = 89000

export function seedPackage(overrides: Record<string, any> = {}) {
  seed('package', [
    {
      id: PKG_ID,
      title: 'Caldas Novas — Villas diRoma',
      slug: 'caldas-novas-villas-diroma',
      price: PRICE,
      price_child_11_13: CHILD_11_13,
      price_child_6_10: CHILD_6_10,
      total_seats: 46,
      available_seats: 46,
      bookings_count: 0,
      departure_date: new Date('2027-03-17T12:00:00Z'),
      return_date: new Date('2027-03-21T12:00:00Z'),
      departure_location: 'Belo Horizonte',
      destination: 'Caldas Novas',
      cover_image: null,
      ...overrides,
    },
  ])
  return table('package')[table('package').length - 1]
}

export function seedAffiliate(overrides: Record<string, any> = {}) {
  const base = {
    name: 'Maria Souza',
    email: `maria${table('affiliate').length}@parceiro.com`,
    code: `MARIA0${table('affiliate').length}`,
    status: 'active',
    commission_rate: 7,
    phone: '31988887777',
  }
  seed('affiliate', [{ ...base, ...overrides }])
  return table('affiliate')[table('affiliate').length - 1]
}

export function seedUser(overrides: Record<string, any> = {}) {
  const n = table('user').length
  const base = {
    id: `usr_seed_${n}`,
    clerk_id: `user_clerk_${n}`,
    email: `pessoa${n}@email.com`,
    first_name: 'Pessoa',
    last_name: `Numero ${n}`,
    role: 'USER',
  }
  seed('user', [{ ...base, ...overrides }])
  return table('user')[table('user').length - 1]
}

export function seedAdmin() {
  return seedUser({
    id: 'usr_admin',
    clerk_id: 'user_admin',
    email: 'admin@amorimturismo.com.br',
    role: 'ADMIN',
    first_name: 'Admin',
    last_name: 'Amorim',
  })
}

let cpfCounter = 0
export function nextCpf(): string {
  cpfCounter = (cpfCounter + 1) % 100000
  return String(10000000000 + cpfCounter)
}

export function passenger(overrides: Record<string, any> = {}) {
  return {
    fullName: 'Fulano de Tal',
    cpf: nextCpf(),
    birthDate: '1990-05-10',
    phone: '31999998888',
    sex: 'M',
    isResponsible: false,
    ...overrides,
  }
}

export function bookingBody(overrides: Record<string, any> = {}) {
  const numPassengers = overrides.numPassengers ?? 1
  const passengers =
    overrides.passengers ?? Array.from({ length: numPassengers }, () => passenger())
  return {
    packageId: PKG_ID,
    customerName: 'Cliente Teste',
    customerEmail: 'cliente@email.com',
    customerPhone: '31977776666',
    numPassengers,
    passengers,
    ...overrides,
  }
}
