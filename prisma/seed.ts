/**
 * Seed do Prisma
 * 
 * Popular banco com dados iniciais:
 * - Plans (Free, Basic, Pro, Enterprise)
 * - Prices (⚠️ Substituir stripe_price_id e stripe_product_id pelos valores reais!)
 * - Addons (⚠️ Substituir stripe_price_id pelos valores reais!)
 * 
 * Executar: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ========================================
  // PLANS
  // ========================================
  console.log('Creating plans...');

  await prisma.plan.upsert({
    where: { id: 'PLAN_FREE' },
    update: {},
    create: {
      id: 'PLAN_FREE',
      name: 'Gratuito',
      description: 'Para começar e testar o produto',
      level: 1,
      is_active: true,
      is_private: false,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'PLAN_BASIC' },
    update: {},
    create: {
      id: 'PLAN_BASIC',
      name: 'Básico',
      description: 'Para indivíduos e pequenos times',
      level: 2,
      is_active: true,
      is_private: false,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'PLAN_PRO' },
    update: {},
    create: {
      id: 'PLAN_PRO',
      name: 'Pro',
      description: 'Para profissionais e times em crescimento',
      level: 3,
      is_active: true,
      is_private: false,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'PLAN_ENTERPRISE' },
    update: {},
    create: {
      id: 'PLAN_ENTERPRISE',
      name: 'Enterprise',
      description: 'Para grandes empresas com necessidades customizadas',
      level: 4,
      is_active: true,
      is_private: false,
    },
  });

  console.log('✅ Plans created');

  // ========================================
  // PRICES
  // ========================================
  console.log('Creating prices...');

  // ⚠️ ATENÇÃO: Substituir os valores abaixo pelos IDs reais do Stripe!
  // Obter em: https://dashboard.stripe.com/test/products

  const prices = [
    // BASIC - Mensal
    {
      plan_id: 'PLAN_BASIC',
      stripe_price_id: 'price_BASIC_MONTH', // ⚠️ MUDAR
      stripe_product_id: 'prod_BASIC', // ⚠️ MUDAR
      interval: 'month',
      interval_count: 1,
      amount: 2900, // R$ 29,00
      currency: 'brl',
    },
    // BASIC - Anual (2 meses grátis)
    {
      plan_id: 'PLAN_BASIC',
      stripe_price_id: 'price_BASIC_YEAR', // ⚠️ MUDAR
      stripe_product_id: 'prod_BASIC', // ⚠️ MUDAR
      interval: 'year',
      interval_count: 1,
      amount: 29000, // R$ 290,00 (10 meses)
      currency: 'brl',
    },
    // PRO - Mensal
    {
      plan_id: 'PLAN_PRO',
      stripe_price_id: 'price_PRO_MONTH', // ⚠️ MUDAR
      stripe_product_id: 'prod_PRO', // ⚠️ MUDAR
      interval: 'month',
      interval_count: 1,
      amount: 7900, // R$ 79,00
      currency: 'brl',
    },
    // PRO - Anual (2 meses grátis)
    {
      plan_id: 'PLAN_PRO',
      stripe_price_id: 'price_PRO_YEAR', // ⚠️ MUDAR
      stripe_product_id: 'prod_PRO', // ⚠️ MUDAR
      interval: 'year',
      interval_count: 1,
      amount: 79000, // R$ 790,00 (10 meses)
      currency: 'brl',
    },
    // ENTERPRISE - Mensal
    {
      plan_id: 'PLAN_ENTERPRISE',
      stripe_price_id: 'price_ENTERPRISE_MONTH', // ⚠️ MUDAR
      stripe_product_id: 'prod_ENTERPRISE', // ⚠️ MUDAR
      interval: 'month',
      interval_count: 1,
      amount: 19900, // R$ 199,00
      currency: 'brl',
    },
    // ENTERPRISE - Anual (2 meses grátis)
    {
      plan_id: 'PLAN_ENTERPRISE',
      stripe_price_id: 'price_ENTERPRISE_YEAR', // ⚠️ MUDAR
      stripe_product_id: 'prod_ENTERPRISE', // ⚠️ MUDAR
      interval: 'year',
      interval_count: 1,
      amount: 199000, // R$ 1.990,00 (10 meses)
      currency: 'brl',
    },
  ];

  for (const price of prices) {
    await prisma.price.upsert({
      where: { stripe_price_id: price.stripe_price_id },
      update: {},
      create: price,
    });
  }

  console.log('✅ Prices created');

  // ========================================
  // ADDONS
  // ========================================
  console.log('Creating addons...');

  const addons = [
    {
      id: 'ADDON_EXTRA_STORAGE_50GB',
      name: 'Armazenamento Extra 50GB',
      description: 'Adicione 50GB de armazenamento ao seu plano',
      stripe_price_id: 'price_STORAGE_50GB', // ⚠️ MUDAR
      amount: 4900, // R$ 49,00
      currency: 'brl',
      level_required: 2, // Basic+
    },
    {
      id: 'ADDON_EXTRA_STORAGE_200GB',
      name: 'Armazenamento Extra 200GB',
      description: 'Adicione 200GB de armazenamento ao seu plano',
      stripe_price_id: 'price_STORAGE_200GB', // ⚠️ MUDAR
      amount: 14900, // R$ 149,00
      currency: 'brl',
      level_required: 2, // Basic+
    },
    {
      id: 'ADDON_PRIORITY_SUPPORT',
      name: 'Suporte Prioritário (1 mês)',
      description: 'Suporte prioritário por 1 mês',
      stripe_price_id: 'price_PRIORITY_SUPPORT', // ⚠️ MUDAR
      amount: 9900, // R$ 99,00
      currency: 'brl',
      level_required: 2, // Basic+
    },
    {
      id: 'ADDON_CUSTOM_DOMAIN',
      name: 'Domínio Customizado',
      description: 'Use seu próprio domínio (ex: app.seusite.com)',
      stripe_price_id: 'price_CUSTOM_DOMAIN', // ⚠️ MUDAR
      amount: 19900, // R$ 199,00 (one-time)
      currency: 'brl',
      level_required: 3, // Pro+
    },
    {
      id: 'ADDON_WHITE_LABEL',
      name: 'White Label',
      description: 'Remova todas as marcas do produto',
      stripe_price_id: 'price_WHITE_LABEL', // ⚠️ MUDAR
      amount: 49900, // R$ 499,00 (one-time)
      currency: 'brl',
      level_required: 4, // Enterprise only
    },
  ];

  for (const addon of addons) {
    await prisma.addon.upsert({
      where: { id: addon.id },
      update: {},
      create: addon,
    });
  }

  console.log('✅ Addons created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
