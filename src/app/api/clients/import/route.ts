import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { generalApiLimiter, rateLimitExceededResponse } from '@/lib/rate-limit'

// Cada linha do CSV é validada individualmente. Campos com erro fatal
// (sem nome ou sem email) são reportados em `errors`.
const rowSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().trim().email('E-mail inválido').toLowerCase(),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .optional()
    .nullable(),
  cpf: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v === '' || v.length === 11, 'CPF deve ter 11 dígitos')
    .optional()
    .nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

const bodySchema = z.object({
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, 'Lista vazia')
    .max(5000, 'Limite de 5000 linhas por importação'),
})

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

interface ImportError {
  row: number
  email?: string
  message: string
}

/**
 * POST /api/clients/import
 * Importa clientes em massa via array de objetos (parseados do CSV no client).
 * Dedup por email (e por CPF quando informado): existente → update, novo → create.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const admin = await prisma.user.findUnique({
    where: { clerk_id: userId },
    select: { role: true },
  })
  if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Rate limit — admin-only mas evita loop acidental: cada batch tem até
  // 5000 linhas; 100 req/min limita o impacto em caso de bug no front.
  const limit = generalApiLimiter(`clients:import:${userId}`)
  if (!limit.success) return rateLimitExceededResponse(limit)

  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Payload inválido' },
        { status: 400 },
      )
    }

    let created = 0
    let updated = 0
    let skipped = 0
    const errors: ImportError[] = []

    for (let i = 0; i < parsed.data.rows.length; i++) {
      const raw = parsed.data.rows[i]
      const rowNum = i + 1
      const validation = rowSchema.safeParse(raw)

      if (!validation.success) {
        errors.push({
          row: rowNum,
          email: typeof raw.email === 'string' ? raw.email : undefined,
          message: validation.error.issues[0]?.message || 'Dados inválidos',
        })
        skipped++
        continue
      }

      const { name, email, phone, cpf, notes } = validation.data
      const cpfClean = cpf || null
      const phoneClean = phone || null
      const { first, last } = splitName(name)

      try {
        const existing =
          (await prisma.user.findUnique({ where: { email } })) ||
          (cpfClean ? await prisma.user.findUnique({ where: { cpf: cpfClean } }) : null)

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              name,
              first_name: first,
              last_name: last,
              phone: phoneClean || existing.phone,
              cpf: cpfClean || existing.cpf,
              notes: notes ?? existing.notes,
            },
          })
          updated++
        } else {
          await prisma.user.create({
            data: {
              email,
              name,
              first_name: first,
              last_name: last,
              phone: phoneClean,
              cpf: cpfClean,
              notes: notes || null,
              role: 'USER',
              source: 'import',
            },
          })
          created++
        }
      } catch (e) {
        errors.push({
          row: rowNum,
          email,
          message: e instanceof Error ? e.message : 'Erro ao salvar',
        })
        skipped++
      }
    }

    return NextResponse.json({
      summary: {
        total: parsed.data.rows.length,
        created,
        updated,
        skipped,
      },
      errors,
    })
  } catch (error: unknown) {
    console.error('[API] POST /api/clients/import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 },
    )
  }
}
