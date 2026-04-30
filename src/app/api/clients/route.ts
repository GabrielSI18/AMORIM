import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { emailSchema, optionalPhoneSchema } from '@/lib/validations'

// Aceita CPF parcial: vazio = sem CPF; ou string com 11 dígitos
const optionalCpfSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v === '' || v.length === 11, 'CPF deve ter 11 dígitos')
  .optional()

const createClientSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: emailSchema,
  phone: optionalPhoneSchema,
  cpf: optionalCpfSchema,
  notes: z.string().trim().max(2000).optional(),
})

async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) {
    return { ok: false as const, response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
  }
  const user = await prisma.user.findUnique({
    where: { clerk_id: userId },
    select: { role: true },
  })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return { ok: false as const, response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { ok: true as const }
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

/**
 * POST /api/clients
 * Cria cliente manualmente (admin). Reutiliza modelo User com `source = 'manual'`.
 * Se já existir cliente com mesmo email/cpf, atualiza com novos dados.
 */
export async function POST(req: NextRequest) {
  console.log('[API] POST /api/clients — start')
  const guard = await requireAdmin()
  if (!guard.ok) {
    console.log('[API] POST /api/clients — admin guard rejected')
    return guard.response
  }

  try {
    const body = await req.json()
    console.log('[API] POST /api/clients — body received', { name: body?.name, email: body?.email })

    const validation = createClientSchema.safeParse(body)
    if (!validation.success) {
      console.log('[API] POST /api/clients — validation failed', validation.error.issues)
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 },
      )
    }

    const { name, email, phone, cpf, notes } = validation.data
    const { first, last } = splitName(name)

    // Dedup por email primeiro, depois por CPF (se preenchido)
    const existing =
      (await prisma.user.findUnique({ where: { email } })) ||
      (cpf ? await prisma.user.findUnique({ where: { cpf } }) : null)

    if (existing) {
      console.log('[API] POST /api/clients — updating existing user', existing.id)
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          first_name: first,
          last_name: last,
          phone: phone || existing.phone,
          cpf: cpf || existing.cpf,
          notes: notes ?? existing.notes,
        },
      })
      return NextResponse.json({ data: updated, updated: true })
    }

    console.log('[API] POST /api/clients — creating new user', email)
    const created = await prisma.user.create({
      data: {
        email,
        name,
        first_name: first,
        last_name: last,
        phone: phone || null,
        cpf: cpf || null,
        notes: notes || null,
        role: 'USER',
        source: 'manual',
      },
    })
    console.log('[API] POST /api/clients — created', created.id)

    return NextResponse.json({ data: created, updated: false }, { status: 201 })
  } catch (error: unknown) {
    console.error('[API] POST /api/clients error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: `Erro ao criar cliente: ${message}` }, { status: 500 })
  }
}

// ============================================================
// GET /api/clients
// Lista unificada de clientes: usuários (User com role USER) + guests (bookings sem user_id).
// Paginação, busca (nome/email/telefone/cpf) e ordenação (name/date/bookings) feitas em memória
// após unificar as duas fontes — volume esperado é compatível (centenas a baixos milhares).
// ============================================================

interface UnifiedClient {
  id: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  imageUrl: string | null
  source: 'user' | 'booking' // origem do registro (cadastro vs apenas reserva guest)
  userSource: string | null // User.source quando aplicável: clerk/manual/import
  bookingsCount: number
  createdAt: string // ISO
  clerkId: string | null
  notes: string | null
}

const querySchema = z.object({
  search: z.string().trim().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['name', 'date', 'bookings']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  source: z.enum(['all', 'user', 'booking']).optional().default('all'),
})

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Parâmetros inválidos' },
        { status: 400 },
      )
    }

    const { search, page, limit, sortBy, sortOrder, source } = parsed.data

    // 1. Carregar todos os Users com role USER + count de bookings via _count
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { bookings: true } },
      },
    })

    // 2. Carregar bookings guest (user_id null, não cancelados) para construir clientes-de-reserva
    const guestBookings = await prisma.booking.findMany({
      where: {
        user_id: null,
        status: { not: 'canceled' },
      },
      select: {
        customer_name: true,
        customer_email: true,
        customer_phone: true,
        customer_cpf: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    })

    // 3. Unificar
    const userEmails = new Set(users.map((u) => u.email.toLowerCase()))
    const clients: UnifiedClient[] = users.map((u) => ({
      id: u.id,
      name: (u.name && u.name.trim()) ||
        `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
        u.email,
      email: u.email,
      phone: u.phone,
      cpf: u.cpf,
      imageUrl: u.image_url,
      source: 'user',
      userSource: u.source,
      bookingsCount: u._count.bookings,
      createdAt: u.created_at.toISOString(),
      clerkId: u.clerk_id,
      notes: u.notes,
    }))

    const guestMap = new Map<
      string,
      { name: string; email: string; phone: string; cpf: string | null; bookingsCount: number; firstCreatedAt: Date }
    >()
    for (const b of guestBookings) {
      if (!b.customer_email) continue
      const key = b.customer_email.toLowerCase()
      if (userEmails.has(key)) continue // já está nos users
      const existing = guestMap.get(key)
      if (existing) {
        existing.bookingsCount++
        if (b.created_at < existing.firstCreatedAt) existing.firstCreatedAt = b.created_at
      } else {
        guestMap.set(key, {
          name: b.customer_name || 'Cliente',
          email: b.customer_email,
          phone: b.customer_phone || '',
          cpf: b.customer_cpf,
          bookingsCount: 1,
          firstCreatedAt: b.created_at,
        })
      }
    }
    for (const [, g] of guestMap) {
      clients.push({
        id: `guest-${g.email}`,
        name: g.name,
        email: g.email,
        phone: g.phone || null,
        cpf: g.cpf,
        imageUrl: null,
        source: 'booking',
        userSource: null,
        bookingsCount: g.bookingsCount,
        createdAt: g.firstCreatedAt.toISOString(),
        clerkId: null,
        notes: null,
      })
    }

    // 4. Filtro por origem
    let filtered =
      source === 'all' ? clients : clients.filter((c) => c.source === source)

    // 5. Busca (nome, email, telefone, CPF — case-insensitive, sem acentos)
    if (search) {
      const q = normalize(search)
      const qDigits = search.replace(/\D/g, '')
      filtered = filtered.filter((c) => {
        const phoneDigits = (c.phone || '').replace(/\D/g, '')
        const cpfDigits = (c.cpf || '').replace(/\D/g, '')
        return (
          normalize(c.name).includes(q) ||
          normalize(c.email).includes(q) ||
          (qDigits.length > 0 && phoneDigits.includes(qDigits)) ||
          (qDigits.length > 0 && cpfDigits.includes(qDigits))
        )
      })
    }

    // 6. Ordenação
    const dir = sortOrder === 'asc' ? 1 : -1
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'pt-BR') * dir
      }
      if (sortBy === 'bookings') {
        return (a.bookingsCount - b.bookingsCount) * dir
      }
      // date (default)
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
    })

    // 7. Estatísticas (sobre TODOS os clientes, não apenas página atual)
    const allClients: UnifiedClient[] =
      source === 'all' ? clients : clients.filter((c) => c.source === source)
    const now = new Date()
    const stats = {
      total: allClients.length,
      thisMonth: allClients.filter((c) => {
        const d = new Date(c.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length,
      withBookings: allClients.filter((c) => c.bookingsCount > 0).length,
    }

    // 8. Paginação
    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const start = (page - 1) * limit
    const data = filtered.slice(start, start + limit)

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages },
      stats,
    })
  } catch (error: unknown) {
    console.error('[API] GET /api/clients error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 },
    )
  }
}

