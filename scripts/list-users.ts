import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      clerk_id: true,
      first_name: true,
      last_name: true,
      email: true,
      role: true,
    },
  });

  console.log('👥 Usuários no banco:');
  console.log(JSON.stringify(users, null, 2));
  console.log(`\nTotal: ${users.length} usuários`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
