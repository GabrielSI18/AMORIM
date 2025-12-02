import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de dados turísticos...');

  // Limpar dados existentes
  await prisma.booking.deleteMany();
  await prisma.package.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.category.deleteMany();

  // Criar categorias
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Praias',
        slug: 'praias',
        description: 'Destinos litorâneos com sol e mar',
        icon: 'Waves',
        color: '#0ea5e9',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Montanhas',
        slug: 'montanhas',
        description: 'Destinos de altitude e natureza',
        icon: 'Mountain',
        color: '#10b981',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Cidades Históricas',
        slug: 'cidades-historicas',
        description: 'Patrimônios culturais e históricos',
        icon: 'Landmark',
        color: '#f59e0b',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Compras',
        slug: 'compras',
        description: 'Destinos ideais para fazer compras',
        icon: 'ShoppingBag',
        color: '#8b5cf6',
      },
    }),
  ]);

  console.log('✅ Categorias criadas:', categories.length);

  // Criar destinos
  const destinations = await Promise.all([
    prisma.destination.create({
      data: {
        name: 'Búzios, RJ',
        slug: 'buzios-rj',
        city: 'Búzios',
        state: 'RJ',
        description: 'Península charmosa com praias paradisíacas',
        image_url: '/destinations/buzios.jpg',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'Ouro Preto, MG',
        slug: 'ouro-preto-mg',
        city: 'Ouro Preto',
        state: 'MG',
        description: 'Cidade histórica com arquitetura colonial',
        image_url: '/destinations/ouro-preto.jpg',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'Monte Verde, MG',
        slug: 'monte-verde-mg',
        city: 'Monte Verde',
        state: 'MG',
        description: 'Clima de montanha com gastronomia',
        image_url: '/destinations/monte-verde.jpg',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'Aparecida, SP',
        slug: 'aparecida-sp',
        city: 'Aparecida',
        state: 'SP',
        description: 'Centro religioso e turístico',
        image_url: '/destinations/aparecida.jpg',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'Rio de Janeiro, RJ',
        slug: 'rio-de-janeiro-rj',
        city: 'Rio de Janeiro',
        state: 'RJ',
        description: 'Cidade maravilhosa',
        image_url: '/destinations/rio.jpg',
      },
    }),
    prisma.destination.create({
      data: {
        name: 'São Paulo, SP',
        slug: 'sao-paulo-sp',
        city: 'São Paulo',
        state: 'SP',
        description: 'Metrópole cultural e gastronômica',
        image_url: '/destinations/sao-paulo.jpg',
      },
    }),
  ]);

  console.log('✅ Destinos criados:', destinations.length);

  // Criar pacotes
  const packages = await Promise.all([
    // Pacote 1: Búzios
    prisma.package.create({
      data: {
        title: 'Fim de Semana em Búzios',
        slug: 'fim-de-semana-em-buzios',
        description: 'Aproveite 3 dias nas praias mais bonitas do Rio de Janeiro! Hospedagem inclusa, café da manhã e passeios opcionais pelas principais praias.',
        short_description: '3 dias de sol, mar e muito charme na península',
        category_id: categories[0].id, // Praias
        destination_id: destinations[0].id,
        price: 45000, // R$ 450,00
        original_price: 55000, // R$ 550,00
        duration_days: 3,
        departure_location: 'Belo Horizonte, MG',
        departure_time: '06:00',
        departure_date: new Date('2025-12-15'),
        return_date: new Date('2025-12-17'),
        available_seats: 8,
        total_seats: 45,
        min_participants: 20,
        includes: ['Transporte ida e volta', 'Hospedagem (2 noites)', 'Café da manhã', 'Seguro viagem'],
        not_includes: ['Almoço', 'Jantar', 'Passeios extras'],
        cover_image: '/packages/buzios-hero.jpg',
        gallery_images: [],
        status: 'published',
        is_featured: true,
      },
    }),

    // Pacote 2: Ouro Preto
    prisma.package.create({
      data: {
        title: 'Cidades Históricas de Minas',
        slug: 'cidades-historicas-de-minas',
        description: 'Conheça Ouro Preto, Mariana e Congonhas em uma viagem cultural completa. Guia especializado, ingressos inclusos e muita história!',
        short_description: 'Imersão na história colonial brasileira',
        category_id: categories[2].id, // Cidades Históricas
        destination_id: destinations[1].id,
        price: 28000, // R$ 280,00
        duration_days: 2,
        departure_location: 'Belo Horizonte, MG',
        departure_time: '07:00',
        departure_date: new Date('2025-12-20'),
        return_date: new Date('2025-12-21'),
        available_seats: 15,
        total_seats: 45,
        min_participants: 15,
        includes: ['Transporte', 'Guia turístico', 'Ingressos em museus', 'Almoço (dia 1)'],
        not_includes: ['Hospedagem', 'Jantar', 'Compras pessoais'],
        cover_image: '/packages/ouro-preto-hero.jpg',
        gallery_images: [],
        status: 'published',
        is_featured: true,
      },
    }),

    // Pacote 3: Monte Verde
    prisma.package.create({
      data: {
        title: 'Aventura na Serra da Mantiqueira',
        slug: 'aventura-serra-mantiqueira',
        description: 'Clima de montanha, gastronomia excepcional e muita natureza! Ideal para casais e famílias que buscam tranquilidade.',
        short_description: 'Frio, fondue e natureza exuberante',
        category_id: categories[1].id, // Montanhas
        destination_id: destinations[2].id,
        price: 52000, // R$ 520,00
        original_price: 65000, // R$ 650,00
        duration_days: 3,
        departure_location: 'Belo Horizonte, MG',
        departure_time: '06:30',
        departure_date: new Date('2025-12-28'),
        return_date: new Date('2025-12-30'),
        available_seats: 5,
        total_seats: 40,
        min_participants: 20,
        includes: ['Transporte', 'Hospedagem (2 noites)', 'Café da manhã', 'Jantar com fondue'],
        not_includes: ['Almoço', 'Passeios extras', 'Bebidas'],
        cover_image: '/packages/monte-verde-hero.jpg',
        gallery_images: [],
        status: 'published',
        is_featured: true,
      },
    }),

    // Pacote 4: Rio de Janeiro
    prisma.package.create({
      data: {
        title: 'Rio de Janeiro Completo',
        slug: 'rio-de-janeiro-completo',
        description: 'Cristo Redentor, Pão de Açúcar, praias de Copacabana e Ipanema. Conheça os principais pontos turísticos da Cidade Maravilhosa!',
        short_description: 'O melhor do Rio em 4 dias',
        category_id: categories[0].id, // Praias
        destination_id: destinations[4].id,
        price: 68000, // R$ 680,00
        duration_days: 4,
        departure_location: 'Belo Horizonte, MG',
        departure_time: '05:00',
        departure_date: new Date('2026-01-10'),
        return_date: new Date('2026-01-13'),
        available_seats: 20,
        total_seats: 45,
        min_participants: 25,
        includes: ['Transporte', 'Hospedagem (3 noites)', 'Café da manhã', 'City tour'],
        not_includes: ['Almoço', 'Jantar', 'Ingressos em atrações'],
        cover_image: '/packages/rio-hero.jpg',
        gallery_images: [],
        status: 'published',
        is_featured: false,
      },
    }),

    // Pacote 5: São Paulo
    prisma.package.create({
      data: {
        title: 'São Paulo: Cultura e Gastronomia',
        slug: 'sao-paulo-cultura-gastronomia',
        description: 'Explore a metrópole paulista! Museus, parques, gastronomia internacional e vida noturna agitada.',
        short_description: 'A cidade que nunca para',
        category_id: categories[3].id, // Compras
        destination_id: destinations[5].id,
        price: 42000, // R$ 420,00
        duration_days: 2,
        departure_location: 'Belo Horizonte, MG',
        departure_time: '07:00',
        departure_date: new Date('2026-01-15'),
        return_date: new Date('2026-01-16'),
        available_seats: 30,
        total_seats: 45,
        min_participants: 20,
        includes: ['Transporte', 'Guia turístico', 'Almoço'],
        not_includes: ['Hospedagem', 'Jantar', 'Ingressos'],
        cover_image: '/packages/sao-paulo-hero.jpg',
        gallery_images: [],
        status: 'published',
        is_featured: false,
      },
    }),

    // Pacote 6: Aparecida
    prisma.package.create({
      data: {
        title: 'Romaria a Aparecida',
        slug: 'romaria-aparecida',
        description: 'Visite o Santuário Nacional de Nossa Senhora Aparecida, o maior templo católico do Brasil. Inclui visita ao Morro do Cruzeiro.',
        short_description: 'Fé e devoção em um dia especial',
        category_id: categories[2].id, // Cidades Históricas
        destination_id: destinations[3].id,
        price: 15000, // R$ 150,00
        duration_days: 1,
        departure_location: 'Belo Horizonte, MG',
        departure_time: '04:00',
        departure_date: new Date('2025-12-12'),
        return_date: new Date('2025-12-12'),
        available_seats: 40,
        total_seats: 45,
        min_participants: 30,
        includes: ['Transporte', 'Lanche no ônibus'],
        not_includes: ['Almoço', 'Jantar', 'Compras pessoais'],
        cover_image: '/packages/aparecida-hero.jpg',
        gallery_images: [],
        status: 'published',
        is_featured: false,
      },
    }),
  ]);

  console.log('✅ Pacotes criados:', packages.length);
  console.log('🎉 Seed completo! Acesse o site para ver os pacotes.');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
