/**
 * Script para listar usuários e corrigir roles incorretas
 * Executar com: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/fix-users-roles.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'gabriel.sistemas18@gmail.com'

async function main() {
  console.log('📋 Listando todos os usuários...\n')
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      created_at: true,
    } as any,
    orderBy: { created_at: 'asc' },
  }) as any[]

  console.log('Total de usuários:', users.length)
  console.log('---')
  
  for (const user of users) {
    const isAdmin = user.email === ADMIN_EMAIL
    const expectedRole = isAdmin ? 'SUPER_ADMIN' : 'USER'
    const needsFix = user.role !== expectedRole && !isAdmin && user.role !== 'USER' && user.role !== 'AFFILIATE'
    
    console.log(`${needsFix ? '⚠️' : '✅'} ${user.email}`)
    console.log(`   Role atual: ${user.role}`)
    console.log(`   Nome: ${user.first_name} ${user.last_name}`)
    
    // Corrigir se não for admin e tiver role incorreta
    if (needsFix) {
      console.log(`   🔧 Corrigindo para: USER`)
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'USER' } as any,
      })
      console.log(`   ✅ Corrigido!`)
    }
    console.log('')
  }
  
  console.log('---')
  console.log('✅ Verificação concluída!')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
