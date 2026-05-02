/**
 * Helpers de autenticação/autorização para API Routes.
 *
 * Diferente do `requireAdmin` em `src/lib/auth.ts` (que faz `redirect()`
 * — apropriado para Server Components/páginas), estes helpers retornam
 * uma `NextResponse` de erro para ser short-circuited dentro de handlers
 * de rota.
 *
 * Uso típico:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const guard = await requireAdminApi();
 *   if (!guard.ok) return guard.response;
 *   // ...lógica admin-only
 * }
 * ```
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

type AuthRole = 'USER' | 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN'

interface GuardSuccess {
  ok: true
  userId: string
  role: AuthRole
  isSuperAdmin: boolean
  email: string
}

interface GuardFailure {
  ok: false
  response: NextResponse
}

type GuardResult = GuardSuccess | GuardFailure

/**
 * Garante que o requester é ADMIN ou SUPER_ADMIN.
 * Retorna `{ ok: false, response }` com 401/403 já formatado quando falha.
 */
export async function requireAdminApi(): Promise<GuardResult> {
  const { userId } = await auth()
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({
    where: { clerk_id: userId },
    select: { id: true, role: true, email: true },
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }),
    }
  }

  return {
    ok: true,
    userId: user.id,
    role: user.role as AuthRole,
    isSuperAdmin: user.role === 'SUPER_ADMIN',
    email: user.email,
  }
}

/**
 * Garante apenas que o requester está autenticado (qualquer role).
 * Útil para endpoints "do user" (subscription, my-bookings, etc).
 */
export async function requireAuthApi(): Promise<GuardResult> {
  const { userId } = await auth()
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({
    where: { clerk_id: userId },
    select: { id: true, role: true, email: true },
  })

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }),
    }
  }

  return {
    ok: true,
    userId: user.id,
    role: user.role as AuthRole,
    isSuperAdmin: user.role === 'SUPER_ADMIN',
    email: user.email,
  }
}
