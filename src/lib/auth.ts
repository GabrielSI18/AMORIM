import { auth, currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

// Email do administrador do sistema
const ADMIN_EMAIL = 'gabriel.sistemas18@gmail.com'

type UserRole = 'USER' | 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN'

interface AuthResult {
  userId: string
  clerkId: string
  email: string
  role: UserRole
  isAdmin: boolean
}

/**
 * Verifica autenticação e retorna informações do usuário
 * Redireciona para /sign-in se não autenticado
 */
export async function getAuthUser(): Promise<AuthResult> {
  const { userId: clerkId } = await auth()
  
  if (!clerkId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress || ''
  const isAdminEmail = email === ADMIN_EMAIL

  // Buscar ou criar usuário no banco
  // Tenta por clerk_id primeiro; se não existir, verifica se email já existe (ex: transição dev→prod)
  let dbUser = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: { id: true, role: true } as any,
  }) as any

  if (!dbUser) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingByEmail) {
      dbUser = await prisma.user.update({
        where: { email },
        data: {
          clerk_id: clerkId,
          first_name: user?.firstName,
          last_name: user?.lastName,
          image_url: user?.imageUrl,
          role: isAdminEmail ? 'SUPER_ADMIN' : existingByEmail.role,
        },
        select: { id: true, role: true } as any,
      }) as any
    } else {
      dbUser = await prisma.user.create({
        data: {
          clerk_id: clerkId,
          email,
          first_name: user?.firstName,
          last_name: user?.lastName,
          image_url: user?.imageUrl,
          role: isAdminEmail ? 'SUPER_ADMIN' : 'USER',
        } as any,
        select: { id: true, role: true } as any,
      }) as any
    }
  }

  const role = dbUser.role as UserRole
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

  return {
    userId: dbUser.id,
    clerkId,
    email,
    role,
    isAdmin,
  }
}

/**
 * Verifica se o usuário é admin
 * Redireciona para /dashboard se não for admin
 */
export async function requireAdmin(): Promise<AuthResult> {
  const authResult = await getAuthUser()
  
  if (!authResult.isAdmin) {
    redirect('/dashboard')
  }

  return authResult
}

/**
 * Verifica se o usuário é super admin
 * Redireciona para /dashboard se não for super admin
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const authResult = await getAuthUser()
  
  if (authResult.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return authResult
}
