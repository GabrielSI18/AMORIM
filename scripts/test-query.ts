import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testando query com Prisma...\n');

  const packages = await prisma.package.findMany({
    where: {
      is_active: true,
      status: 'published',
    },
    include: {
      category: true,
      destination: true,
    },
    orderBy: [
      { is_featured: 'desc' },
      { created_at: 'desc' },
    ],
    take: 3,
  });

  console.log(`✅ Encontrados ${packages.length} pacotes:\n`);
  
  packages.forEach((pkg) => {
    console.log(`📦 ${pkg.title}`);
    console.log(`   Categoria: ${pkg.category?.name || 'N/A'}`);
    console.log(`   Destino: ${pkg.destination?.name || 'N/A'}`);
    console.log(`   Preço: R$ ${pkg.price / 100}`);
    console.log(`   Vagas: ${pkg.available_seats}/${pkg.total_seats}`);
    console.log(`   Destaque: ${pkg.is_featured ? 'Sim' : 'Não'}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
