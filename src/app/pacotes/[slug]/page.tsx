import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';
import Image from 'next/image';
import { MapPin, Calendar, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { PackageSeatsDisplay } from '@/components/packages/package-seats-display';
import { HotelGallery } from '@/components/packages/hotel-gallery';
import { PriceTable } from '@/components/packages/price-table';
import { AttractionsList } from '@/components/packages/attractions-list';
import { PackageGallery } from '@/components/packages/package-gallery';
import { ShareButton } from '@/components/ui/share-button';

interface PackagePageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPackage(slug: string) {
  const pkg = await prisma.package.findFirst({
    where: {
      slug,
      is_active: true,
      status: 'published',
    },
    include: {
      category: true,
      destination_rel: true,
    },
  });

  if (!pkg) return null;

  const transformed = toCamelCase(pkg);
  return {
    ...transformed,
    destinationText: transformed.destination || null, // texto livre
    destination: transformed.destinationRel || null,  // relação
  };
}

export default async function PackagePage({ params }: PackagePageProps) {
  const { slug } = await params;
  const pkg = await getPackage(slug);

  if (!pkg) {
    notFound();
  }

  const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
  const discountPercent = hasDiscount
    ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero com Imagem */}
      <section className="relative h-[400px]">
        <Image
          src={pkg.coverImage}
          alt={pkg.title}
          fill
          unoptimized
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="absolute bottom-8 left-0 right-0">
          <div className="container-custom">
            <Link 
              href="/pacotes"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
            >
              ← Voltar para pacotes
            </Link>

            <div className="flex items-start justify-between">
              <div>
                {/* Badges */}
                {pkg.availableSeats <= 5 && pkg.availableSeats > 0 && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gradient-accent text-accent-foreground border-0 mb-2">
                    Vagas Limitadas
                  </span>
                )}

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {pkg.title}
                </h1>
                
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{pkg.departureLocation} → {pkg.destination?.city}, {pkg.destination?.state}</span>
                </div>
              </div>

              <ShareButton 
                title={pkg.title} 
                description={pkg.shortDescription || `Pacote de viagem: ${pkg.title}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cards de Info Rápida */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pkg.departureDate && (
                <div className="bg-card rounded-xl p-4 shadow-card">
                  <Calendar className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Saída</p>
                  <p className="font-semibold">
                    {new Date(pkg.departureDate).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                    {pkg.departureTime && (
                      <span className="text-muted-foreground"> às {pkg.departureTime}</span>
                    )}
                  </p>
                </div>
              )}
              {pkg.returnDate && (
                <div className="bg-card rounded-xl p-4 shadow-card">
                  <Calendar className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Retorno</p>
                  <p className="font-semibold">
                    {new Date(pkg.returnDate).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                    {pkg.returnTime && (
                      <span className="text-muted-foreground"> às {pkg.returnTime}</span>
                    )}
                  </p>
                </div>
              )}
              <div className="bg-card rounded-xl p-4 shadow-card">
                <Clock className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="font-semibold">{pkg.durationDays} dias / {pkg.durationDays - 1} noites</p>
              </div>
              <div className="bg-card rounded-xl p-4 shadow-card">
                <Users className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Disponível</p>
                <p className="font-semibold">{pkg.availableSeats} vagas</p>
              </div>
            </div>

            {/* Descrição */}
            <section className="bg-card rounded-xl p-6 shadow-card">
              <h2 className="text-2xl font-bold mb-4">Sobre a Viagem</h2>
              <p className="text-muted-foreground leading-relaxed">
                {pkg.description}
              </p>
            </section>

            {/* Galeria de Imagens */}
            {pkg.galleryImages && pkg.galleryImages.length > 0 && (
              <section className="bg-card rounded-xl p-6 shadow-card">
                <h2 className="text-2xl font-bold mb-4">Galeria de Fotos</h2>
                <PackageGallery images={pkg.galleryImages} title={pkg.title} />
              </section>
            )}

            {/* Conforto no Ônibus */}
            <section className="bg-card rounded-xl p-6 shadow-card">
              <h2 className="text-2xl font-bold mb-4">Conforto no Ônibus</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                      <line x1="2" x2="22" y1="12" y2="12"></line>
                      <line x1="12" x2="12" y1="2" y2="22"></line>
                      <path d="m20 16-4-4 4-4"></path>
                      <path d="m4 8 4 4-4 4"></path>
                      <path d="m16 4-4 4-4-4"></path>
                      <path d="m8 20 4-4 4 4"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Ar-condicionado</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                      <rect width="20" height="15" x="2" y="3" rx="2"></rect>
                      <polyline points="17 21 12 16 7 21"></polyline>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">TV e Entretenimento</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Água à bordo</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                      <rect x="3" y="8" width="18" height="4" rx="1"></rect>
                      <path d="M12 8v13"></path>
                      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
                      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Poltronas reclináveis</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                      <rect width="10" height="18" x="7" y="3" rx="2"></rect>
                      <path d="M12 18h.01"></path>
                      <path d="M7 7h10"></path>
                      <path d="M22 11v2"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Carregador USB</span>
                </div>
              </div>
            </section>

            {/* Mapa de Assentos do Ônibus */}
            {pkg.totalSeats && pkg.totalSeats > 0 && (
              <section className="bg-card rounded-xl p-6 shadow-card">
                <PackageSeatsDisplay 
                  packageId={pkg.id} 
                  totalSeats={pkg.totalSeats}
                  variant="full"
                />
              </section>
            )}

            {/* Hospedagem */}
            {pkg.hotelName && (
              <section className="bg-card rounded-xl p-6 shadow-card">
                <h2 className="text-2xl font-bold mb-4">Hospedagem</h2>
                <HotelGallery 
                  hotelName={pkg.hotelName}
                  photos={pkg.hotelPhotos || []}
                />
              </section>
            )}

            {/* Atrações Incluídas */}
            {pkg.attractions && pkg.attractions.length > 0 && (
              <section className="bg-card rounded-xl p-6 shadow-card">
                <h2 className="text-2xl font-bold mb-4">Atrações Incluídas</h2>
                <AttractionsList attractions={pkg.attractions} />
              </section>
            )}

            {/* O que está incluso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pkg.includes && pkg.includes.length > 0 && (
                <section className="bg-card rounded-xl p-6 shadow-card">
                  <h3 className="font-bold mb-4 text-lg">O que está incluído</h3>
                  <ul className="space-y-2">
                    {pkg.includes.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* O que NÃO está incluso */}
              {pkg.notIncludes && pkg.notIncludes.length > 0 && (
                <section className="bg-card rounded-xl p-6 shadow-card">
                  <h3 className="font-bold mb-4 text-lg">O que NÃO está incluído</h3>
                  <ul className="space-y-2">
                    {pkg.notIncludes.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                        </div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Política de Cancelamento */}
            <section className="bg-card rounded-xl p-6 shadow-card">
              <h2 className="text-2xl font-bold mb-4">Política de Cancelamento</h2>
              <p className="text-muted-foreground">
                Cancelamento gratuito até 15 dias antes da viagem. Entre 14 e 7 dias: reembolso de 50%. Menos de 7 dias: sem reembolso.
              </p>
            </section>
          </div>

          {/* Sidebar - Reserva */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Card de Preços */}
              <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                <h3 className="text-lg font-bold mb-4">Valores por Pessoa</h3>
                <PriceTable 
                  price={pkg.price}
                  priceChild610={pkg.priceChild610 || null}
                  priceChild1113={pkg.priceChild1113 || null}
                  maxInstallments={pkg.maxInstallments || 10}
                />
              </div>

              {/* Card de Reserva */}
              <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                {/* Preço */}
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-1">A partir de</p>
                  <p className="text-4xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pkg.price / 100)}
                    <span className="text-lg font-normal text-muted-foreground">/pessoa</span>
                  </p>
                </div>

                {/* Barra de Vagas */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vagas disponíveis</span>
                    <span className="font-semibold text-primary">{pkg.availableSeats} de {pkg.totalSeats}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-accent h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(pkg.availableSeats / pkg.totalSeats) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Botões */}
                <Link 
                  href={`/reserva/${pkg.id}`}
                  className="flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 bg-accent text-accent-foreground shadow-md hover:shadow-lg hover:scale-[1.02] h-14 rounded-xl px-10 text-base w-full mb-3"
                >
                  Reservar Agora
                </Link>
                
                <Link 
                  href="/contato"
                  className="flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 border-2 border-accent text-accent bg-background hover:bg-accent/5 h-14 rounded-xl px-10 text-base w-full"
                >
                  Falar com Suporte
                </Link>

                {/* Info de Segurança */}
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Pagamento seguro • Cancelamento gratuito até 15 dias antes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
