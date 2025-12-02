import prisma from '../src/lib/prisma';

async function main() {
  // Usar a mesma query da API /api/plans
  const plans = await prisma.plan.findMany({
    where: {
      is_private: false,
      is_active: true,
    },
    include: {
      prices: {
        where: {
          is_active: true,
        },
        orderBy: {
          amount: 'asc',
        },
      },
    },
    orderBy: {
      level: 'asc',
    },
  });
  
  console.log('=== Plans with Prices (same as API) ===');
  console.log(JSON.stringify(plans, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
