import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação para criar contato (público)
// Aceita 2 tipos: "general" (formulário padrão) e "charter" (fretamento, com campos extras obrigatórios)
const baseContactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
})

const charterFieldsSchema = z.object({
  type: z.literal('charter'),
  origin: z.string().min(2, 'Informe a cidade de origem'),
  destination: z.string().min(2, 'Informe o destino'),
  departureDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Data de ida inválida'),
  returnDate: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), 'Data de volta inválida'),
  passengersCount: z.coerce
    .number()
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Informe ao menos 1 passageiro'),
  eventType: z.string().optional(),
})

const createContactSchema = z.discriminatedUnion('type', [
  baseContactSchema.extend({ type: z.literal('general').optional().default('general') }),
  baseContactSchema.merge(charterFieldsSchema),
])

// POST /api/contacts - Criar novo contato (público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Default type para 'general' se não informado
    const payload = { ...body, type: body?.type ?? 'general' }

    // Validar dados
    const validation = createContactSchema.safeParse(payload)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const data = validation.data
    const isCharter = data.type === 'charter'

    // Criar contato no banco
    const contact = await prisma.contact.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        origin: isCharter ? data.origin : null,
        destination: isCharter ? data.destination : null,
        departure_date: isCharter ? new Date(data.departureDate) : null,
        return_date: isCharter && data.returnDate ? new Date(data.returnDate) : null,
        passengers_count: isCharter ? data.passengersCount : null,
        event_type: isCharter ? data.eventType ?? null : null,
        status: 'pending',
        priority: isCharter ? 'high' : 'normal', // fretamento tem prioridade alta por default
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso!',
      data: { id: contact.id },
    })
  } catch (error) {
    console.error('Erro ao criar contato:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem. Tente novamente.' },
      { status: 500 }
    )
  }
}

// GET /api/contacts - Listar contatos (admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Parâmetros de busca
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Construir filtros
    const where: Record<string, unknown> = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (priority && priority !== 'all') {
      where.priority = priority
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Buscar contatos com paginação
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: [
          { priority: 'desc' }, // urgent > high > normal > low
          { created_at: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ])

    // Estatísticas
    const stats = await prisma.contact.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const statsMap: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      resolved: 0,
      archived: 0,
    }
    
    for (const s of stats) {
      if (s.status in statsMap) {
        statsMap[s.status] = s._count.id
      }
    }

    return NextResponse.json({
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statsMap,
    })
  } catch (error) {
    console.error('Erro ao listar contatos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contatos' },
      { status: 500 }
    )
  }
}
