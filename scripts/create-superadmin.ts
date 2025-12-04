/**
 * Script para criar um usuário superadmin no banco de dados
 * 
 * Como usar:
 * 1. Substitua os valores abaixo pelos seus dados
 * 2. Execute: npx tsx scripts/create-superadmin.ts
 * 
 * IMPORTANTE: O clerk_id deve corresponder a um usuário real no Clerk
 * Se você não tem um usuário no Clerk, crie um pelo dashboard do Clerk primeiro:
 * https://dashboard.clerk.com -> Users -> Create user
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ⚠️ DADOS DO SUPERADMIN
  const ADMIN_DATA = {
    clerk_id: 'user_36LOOQBaGJmqmKlzdY9kFpV6fz0',
    email: 'admin@admin.com',
    name: 'Super Admin',
    first_name: 'Super',
    last_name: 'Admin',
  };

  console.log('🔧 Criando usuário superadmin...\n');

  try {
    const user = await prisma.user.upsert({
      where: { clerk_id: ADMIN_DATA.clerk_id },
      update: {
        email: ADMIN_DATA.email,
        name: ADMIN_DATA.name,
        first_name: ADMIN_DATA.first_name,
        last_name: ADMIN_DATA.last_name,
      },
      create: {
        clerk_id: ADMIN_DATA.clerk_id,
        email: ADMIN_DATA.email,
        name: ADMIN_DATA.name,
        first_name: ADMIN_DATA.first_name,
        last_name: ADMIN_DATA.last_name,
      },
    });

    console.log('✅ Usuário criado/atualizado com sucesso!');
    console.log('');
    console.log('📋 Dados do usuário:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Clerk ID: ${user.clerk_id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.name}`);
    console.log('');
    console.log('🎉 Agora você pode fazer login no Clerk com esse usuário e acessar o dashboard!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
