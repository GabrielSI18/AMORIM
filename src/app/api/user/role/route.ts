import { auth, currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Email do administrador do sistema
const ADMIN_EMAIL = 'gabriel.sistemas18@gmail.com'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await currentUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress || ''

    // Buscar usuário no banco
    const dbUser = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { id: true, role: true },
    })

    if (!dbUser) {
      // Se não existe, retorna role padrão baseado no email
      const isAdminEmail = userEmail === ADMIN_EMAIL
      return NextResponse.json({
        role: isAdminEmail ? 'SUPER_ADMIN' : 'USER',
        isAdmin: isAdminEmail,
      })
    }

    const isAdmin = dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN'

    return NextResponse.json({
      role: dbUser.role,
      isAdmin,
    })
  } catch (error) {
    console.error('Erro ao buscar role:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
