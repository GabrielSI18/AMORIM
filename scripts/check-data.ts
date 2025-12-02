import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.count();
  const destinations = await prisma.destination.count();
  const packages = await prisma.package.count();

  console.log('📊 Dados no banco:');
  console.log(`  Categorias: ${categories}`);
  console.log(`  Destinos: ${destinations}`);
  console.log(`  Pacotes: ${packages}`);

  if (packages > 0) {
    console.log('\n📦 Pacotes encontrados:');
    const allPackages = await prisma.package.findMany({
      select: {
        title: true,
        price: true,
        available_seats: true,
        status: true,
      },
    });
    allPackages.forEach((pkg) => {
      console.log(`  - ${pkg.title} (R$ ${pkg.price / 100}) - ${pkg.available_seats} vagas - ${pkg.status}`);
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
