/**
 * Script para garantir que o email do admin tenha role SUPER_ADMIN
 * Executar com: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/set-admin.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'gabriel.sistemas18@gmail.com'

async function main() {
  console.log('🔍 Procurando usuário com email:', ADMIN_EMAIL)
  
  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  if (!user) {
    console.log('❌ Usuário não encontrado no banco de dados.')
    console.log('   O usuário será criado como SUPER_ADMIN quando fizer login pela primeira vez.')
    return
  }

  console.log('✅ Usuário encontrado:', {
    id: user.id,
    email: user.email,
    name: user.name || `${user.first_name} ${user.last_name}`,
    currentRole: (user as any).role,
  })

  if ((user as any).role === 'SUPER_ADMIN') {
    console.log('✅ Usuário já é SUPER_ADMIN. Nenhuma alteração necessária.')
    return
  }

  // Atualizar para SUPER_ADMIN
  const updated = await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { role: 'SUPER_ADMIN' } as any,
  })

  console.log('✅ Role atualizada para SUPER_ADMIN!')
  console.log('   Novo role:', (updated as any).role)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
