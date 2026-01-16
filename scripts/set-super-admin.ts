const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'amorimturismo@ymail.com' }
  });
  
  if (!user) {
    console.log('Usuário não encontrado');
    return;
  }
  
  console.log('Usuário encontrado:', user.email, '- Role atual:', user.role);
  
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'SUPER_ADMIN' }
  });
  
  console.log('Usuário atualizado para SUPER_ADMIN:', updated.email, '- Novo role:', updated.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
