import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Bus, CalendarDays, Check, CreditCard, X } from 'lucide-react'
import prisma from '@/lib/prisma'
import { notExpiredWhere } from '@/lib/package-expiration'
import { getPackageAvailability } from '@/lib/package-availability'
import { getSiteConfig } from '@/lib/site-config'
import { LeadFunnel, type FunnelPackage } from './lead-funnel'
import { MetaPixel } from './meta-pixel'
import './lp.css'

/**
 * Página de anúncio de um pacote (/lp/<slug do pacote>).
 *
 * O anúncio do Meta manda para cá, e não direto para o WhatsApp: antes de
 * conversar, a pessoa confirma as datas, o embarque, quem vai (vendo o total)
 * e como pretende pagar. Quem passa chega no WhatsApp com tudo escrito; quem
 * não pode ir nas datas sai daqui sem ocupar o atendimento.
 *
 * Tudo vem do cadastro do pacote — preço, datas e o panfleto da galeria —,
 * então a mesma página serve para a próxima viagem.
 */

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://amorimturismo.com.br'

async function getPackage(slug: string) {
  const pkg = await prisma.package.findFirst({
    where: { slug, is_active: true, status: 'published', ...notExpiredWhere() },
    select: {
      id: true,
      slug: true,
      title: true,
      destination: true,
      price: true,
      price_child_6_10: true,
      price_child_11_13: true,
      departure_date: true,
      return_date: true,
      departure_time: true,
      return_time: true,
      departure_location: true,
      hotel_name: true,
      includes: true,
      not_includes: true,
      max_installments: true,
      total_seats: true,
      available_seats: true,
      cover_image: true,
      gallery_images: true,
    },
  })
  if (!pkg) return null

  const availability = await getPackageAvailability(pkg.id, pkg.total_seats)
  return {
    ...pkg,
    availableSeats: pkg.total_seats ? availability.availableSeats : pkg.available_seats,
  }
}

/** O panfleto é a imagem da galeria com "flyer" no nome; sem ele, a capa */
function flyerOf(pkg: { gallery_images: string[]; cover_image: string | null }): string | null {
  return pkg.gallery_images.find((src) => /flyer|panfleto/i.test(src)) ?? pkg.cover_image ?? null
}

/** Datas de pacote são guardadas como dia UTC */
function dia(date: Date | null, opts: Intl.DateTimeFormatOptions): string | null {
  if (!date) return null
  return date.toLocaleDateString('pt-BR', { ...opts, timeZone: 'UTC' })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const pkg = await getPackage(slug)
  if (!pkg) return { title: 'Pacote não encontrado' }

  const flyer = flyerOf(pkg)
  const periodo = `${dia(pkg.departure_date, { day: 'numeric' })} a ${dia(pkg.return_date, { day: 'numeric', month: 'long' })}`
  return {
    title: `${pkg.destination?.split(/[,–-]/)[0].trim() || pkg.title}, ${periodo}`,
    description: `Saída de ${pkg.departure_location || 'Belo Horizonte'}. Veja o valor para o seu grupo e fale com a Amorim Turismo no WhatsApp.`,
    // Página de campanha: não disputa busca com a página do pacote
    robots: { index: false, follow: true },
    alternates: { canonical: `${BASE_URL}/pacotes/${pkg.slug}` },
    openGraph: flyer ? { images: [{ url: flyer.startsWith('http') ? flyer : `${BASE_URL}${flyer}` }] } : undefined,
  }
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [pkg, siteConfig] = await Promise.all([getPackage(slug), getSiteConfig()])
  if (!pkg) notFound()

  const flyer = flyerOf(pkg)
  const destino = pkg.destination?.split(/[,–-]/)[0].trim() || pkg.title
  const saidaDia = dia(pkg.departure_date, { day: 'numeric' })
  const voltaDia = dia(pkg.return_date, { day: 'numeric', month: 'long' })
  const saidaSemana = dia(pkg.departure_date, { weekday: 'long' })
  const embarque = pkg.departure_location || 'Belo Horizonte'
  const parcelas = pkg.max_installments || 1
  const brl = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  const funnelPackage: FunnelPackage = {
    id: pkg.id,
    slug: pkg.slug,
    title: pkg.title,
    destination: destino,
    price: pkg.price,
    priceChild1113: pkg.price_child_11_13 || null,
    priceChild610: pkg.price_child_6_10 || null,
    departureDateIso: pkg.departure_date?.toISOString() ?? null,
    departureLabel: dia(pkg.departure_date, { weekday: 'long', day: 'numeric', month: 'long' }),
    returnLabel: dia(pkg.return_date, { weekday: 'long', day: 'numeric', month: 'long' }),
    periodLabel: saidaDia && voltaDia ? `${saidaDia} a ${voltaDia}` : null,
    departureTime: pkg.departure_time,
    departureLocation: embarque,
    maxInstallments: parcelas,
    availableSeats: pkg.availableSeats ?? null,
  }

  const inclui = pkg.includes.slice(0, 6)
  const naoInclui = pkg.not_includes.slice(0, 3)

  return (
    <main className="lp">
      <MetaPixel />
      <header className="bg-[var(--lp-azul)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Amorim Turismo, página inicial">
            <Image src="/amorim-logo.png" alt="Amorim Turismo" width={132} height={32} className="h-8 w-auto brightness-0 invert" priority />
          </Link>
          <Link
            href={`/pacotes/${pkg.slug}`}
            className="rounded-md px-2 py-1 text-sm text-white/85 underline-offset-4 hover:text-white hover:underline"
          >
            Ver o pacote completo
          </Link>
        </div>
      </header>

      {/* Primeira tela: o mesmo panfleto do anúncio e a pergunta que filtra */}
      {/* Quem chega pelo anúncio já viu o panfleto: no celular a primeira
          pergunta vem logo depois do título e o panfleto desce para conferir.
          No computador o panfleto fica à esquerda e o filtro à direita. */}
      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-10 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-x-10 md:gap-y-6 md:pt-10">
        <div className="md:col-start-1 md:row-start-1">
          <h1 className="lp-titulo text-[2rem] font-extrabold leading-[1.05] text-[var(--lp-azul)] md:text-5xl">
            {destino}, de {saidaDia} a {voltaDia}
          </h1>
          <p className="mt-3 text-base text-[var(--lp-tinta-suave)] md:text-lg">
            Sai de {embarque.split(/[–-]/)[0].trim()} na {saidaSemana}
            {pkg.departure_time ? ` às ${pkg.departure_time.replace(':00', 'h')}` : ''}. A partir de {brl(pkg.price)}, em até {parcelas}x.
          </p>
        </div>

        <div id="filtro" className="md:sticky md:top-6 md:col-start-2 md:row-span-2 md:row-start-1">
          <LeadFunnel pkg={funnelPackage} whatsappNumber={siteConfig.whatsapp_number} />
        </div>

        {flyer && (
          <figure className="overflow-hidden rounded-2xl border border-[var(--lp-linha)] bg-[var(--lp-cartao)] shadow-sm md:col-start-1 md:row-start-2">
            <Image
              src={flyer}
              alt={`Panfleto da viagem para ${destino}: preços, datas e o que está incluso`}
              width={1080}
              height={1620}
              sizes="(min-width: 768px) 480px, 100vw"
              className="h-auto w-full"
            />
          </figure>
        )}
      </section>

      {/* O que entra e o que não entra no preço: também filtra */}
      <section className="border-t border-[var(--lp-linha)] bg-[var(--lp-cartao)]">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h2 className="lp-titulo text-2xl font-bold text-[var(--lp-azul)]">O que está no preço</h2>
            <ul className="mt-4 space-y-3">
              {inclui.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base">
                  <Check className="mt-0.5 h-5 w-5 flex-none text-[var(--lp-verde)]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {naoInclui.length > 0 && (
              <>
                <h3 className="mt-6 text-base font-semibold text-[var(--lp-tinta)]">Não incluso</h3>
                <ul className="mt-2 space-y-2">
                  {naoInclui.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-base text-[var(--lp-tinta-suave)]">
                      <X className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <dl className="grid content-start gap-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 flex-none text-[var(--lp-azul)]" aria-hidden />
              <div>
                <dt className="text-sm text-[var(--lp-tinta-suave)]">Saída</dt>
                <dd className="text-base font-semibold">
                  {funnelPackage.departureLabel}
                  {pkg.departure_time ? `, ${pkg.departure_time.replace(':00', 'h')}` : ''}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bus className="mt-0.5 h-5 w-5 flex-none text-[var(--lp-azul)]" aria-hidden />
              <div>
                <dt className="text-sm text-[var(--lp-tinta-suave)]">Embarque</dt>
                <dd className="text-base font-semibold">{embarque}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 flex-none text-[var(--lp-azul)]" aria-hidden />
              <div>
                <dt className="text-sm text-[var(--lp-tinta-suave)]">Volta</dt>
                <dd className="text-base font-semibold">{funnelPackage.returnLabel}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 flex-none text-[var(--lp-azul)]" aria-hidden />
              <div>
                <dt className="text-sm text-[var(--lp-tinta-suave)]">Pagamento</dt>
                <dd className="text-base font-semibold">PIX ou cartão em até {parcelas}x sem juros</dd>
              </div>
            </div>
          </dl>
        </div>
      </section>

      <footer className="bg-[var(--lp-azul-escuro)] text-white/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <p>Amorim Turismo</p>
          <Link href="/pacotes" className="underline-offset-4 hover:text-white hover:underline">
            Outras viagens
          </Link>
        </div>
      </footer>
    </main>
  )
}
