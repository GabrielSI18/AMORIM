import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { parseDateInput } from '@/lib/date-input';
import { activeBookingsWhere, RELEASED_BOOKING_STATUSES } from '@/lib/booking-status';
import { syncPackageAvailability } from '@/lib/package-availability';
import { isPackageExpired } from '@/lib/package-expiration';
import { generalApiLimiter, enforceRateLimit } from '@/lib/rate-limit';
import { toCamelCase } from '@/lib/case-transform';
import { passengersSchema, safeParse, emailSchema, phoneSchema } from '@/lib/validations';
import { sendAffiliateNewSaleEmail } from '@/lib/email';
import { requireAdminApi } from '@/lib/api-auth';
import type { Prisma } from '@prisma/client';
import type { CreateBookingDto } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://amorimturismo.com.br';

/**
 * Teto de reservas em aberto (não pagas) do mesmo email no mesmo pacote.
 * Sem isso, um script com o mesmo email reserva o ônibus inteiro sem pagar
 * nada e tira o pacote do ar para quem ia comprar de verdade.
 */
const MAX_RESERVAS_ABERTAS_POR_EMAIL = 3;

/** Dados do titular da reserva — o resto do corpo é validado adiante. */
const customerSchema = z.object({
  customerName: z.string().trim().min(2, 'Informe o nome do responsável').max(120, 'Nome muito longo'),
  customerEmail: emailSchema.max(254, 'Email muito longo'),
  customerPhone: phoneSchema,
  customerCpf: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v === '' || v.length === 11, 'CPF deve ter 11 dígitos')
    .optional()
    .nullable(),
  customerNotes: z.string().trim().max(1000, 'Observação muito longa').optional().nullable(),
  numPassengers: z
    .number({ message: 'Número de passageiros inválido' })
    .int('Número de passageiros inválido')
    .min(1, 'Informe ao menos um passageiro')
    .max(100, 'Número de passageiros acima do permitido'),
  packageId: z.string().trim().min(1, 'Pacote obrigatório').max(64),
  affiliateCode: z
    .string()
    .trim()
    .max(32)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toUpperCase() : null)),
  selectedSeats: z.array(z.number().int('Assento inválido').positive('Assento inválido')).max(100).optional(),
});

function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

/** Erro de serialização do Postgres (duas reservas disputando o mesmo assento) */
function isSerializationError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === 'P2034' || code === '40001';
}

/** Recusa decidida dentro da transação (vaga acabou, assento ocupado) */
class BookingConflict extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.name = 'BookingConflict';
    this.status = status;
  }
}

/**
 * Indicação de si mesmo: o afiliado comprando com o próprio código.
 * Confere email, CPF e a conta logada — é o jeito mais simples de o parceiro
 * virar "desconto de 7%" para si, para a família e para quem ele quiser.
 */
function isSelfReferral(
  affiliate: { email: string | null; cpf: string | null; user_id: string | null },
  buyer: { customerEmail: string; customerCpf?: string | null; dbUserId: string | null },
): boolean {
  const affiliateEmail = (affiliate.email || '').trim().toLowerCase();
  const buyerEmail = (buyer.customerEmail || '').trim().toLowerCase();
  if (affiliateEmail && affiliateEmail === buyerEmail) return true;

  const affiliateCpf = (affiliate.cpf || '').replace(/\D/g, '');
  const buyerCpf = (buyer.customerCpf || '').replace(/\D/g, '');
  if (affiliateCpf && affiliateCpf === buyerCpf) return true;

  if (affiliate.user_id && buyer.dbUserId && affiliate.user_id === buyer.dbUserId) return true;

  return false;
}

/**
 * GET /api/bookings
 * Lista reservas (filtradas por usuário ou todas se admin)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');
    const bookingId = searchParams.get('id');

    // GET por ID (público — usado pela página de confirmação após reserva).
    // Como o ID é cuid (já difícil de adivinhar) mas não é segredo de fato,
    // retornamos SOMENTE campos não-sensíveis. CPF, telefone e dados detalhados
    // dos passageiros (nome, CPF, RG, data de nascimento) ficam fora — só admin
    // (via /dashboard/reservas) tem acesso a esses.
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          customer_name: true,
          customer_email: true,
          num_passengers: true,
          total_amount: true,
          selected_seats: true,
          status: true,
          payment_status: true,
          created_at: true,
          package: {
            select: {
              id: true,
              title: true,
              slug: true,
              cover_image: true,
              departure_date: true,
              return_date: true,
              departure_location: true,
              destination: true,
              destination_rel: { select: { name: true } },
              category: { select: { name: true, slug: true } },
            },
          },
          passengers: {
            select: { id: true, is_responsible: true, seat_number: true },
            orderBy: { created_at: 'asc' },
          },
        },
      });

      if (!booking) {
        return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
      }

      const transformedBooking = toCamelCase(booking);
      const bookingResult = {
        ...transformedBooking,
        package: transformedBooking.package ? {
          ...transformedBooking.package,
          destination: transformedBooking.package.destinationRel || null,
        } : null,
      };

      return NextResponse.json({ data: bookingResult });
    }

    // Listagem completa (com CPF/passengers detalhados) é admin-only.
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const where: any = {};
    if (packageId) where.package_id = packageId;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        package: {
          include: {
            destination_rel: true,
            category: true,
          },
        },
        passengers: {
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Transforma e mapeia destination_rel para destination nos pacotes
    const transformedBookings = toCamelCase(bookings).map((booking: any) => ({
      ...booking,
      package: booking.package ? {
        ...booking.package,
        destination: booking.package.destinationRel || null,
      } : null,
    }));

    return NextResponse.json({ data: transformedBookings });
  } catch (error) {
    console.error('[API] GET /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar reservas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Cria nova reserva
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Rate limiting por usuário logado ou, se anônimo, por IP
    // (antes todos os anônimos caíam na mesma chave 'anonymous')
    const ip =
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0] ??
      'anonymous';
    const limited = await enforceRateLimit(
      'BOOKING_LIMITER',
      `bookings:${userId || ip}`,
      generalApiLimiter
    );
    if (limited) return limited;

    const body: CreateBookingDto & {
      selectedSeats?: number[];
      totalPrice?: number;
      passengerDetails?: {
        adults: number;
        children_11_13: number;
        children_6_10: number;
        children_free: number;
      };
      passengers?: unknown;
    } = await req.json();

    // Validação dos dados do titular. Antes só checava "campo existe", então
    // entrava email sem @, telefone com letra e nome de 5 mil caracteres —
    // e aí a confirmação da reserva nunca chegava em ninguém.
    const customer = customerSchema.safeParse(body);
    if (!customer.success) {
      return NextResponse.json(
        { error: customer.error.issues[0]?.message || 'Dados do responsável inválidos' },
        { status: 400 }
      );
    }
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerCpf,
      customerNotes,
      numPassengers,
      packageId,
      affiliateCode,
      selectedSeats,
    } = customer.data;

    // Validação de passageiros (obrigatório)
    const passengersResult = safeParse(passengersSchema, body.passengers);
    if (!passengersResult.success || !passengersResult.data) {
      return NextResponse.json(
        { error: passengersResult.error || 'Lista de passageiros inválida' },
        { status: 400 }
      );
    }
    const passengers = passengersResult.data;

    if (passengers.length !== numPassengers) {
      return NextResponse.json(
        { error: `Cadastre exatamente ${numPassengers} passageiro(s)` },
        { status: 400 }
      );
    }

    // Verificar se pacote existe e está aberto
    const package_ = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!package_) {
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
    }

    if (isPackageExpired(package_)) {
      return NextResponse.json({ error: 'Este pacote já foi encerrado' }, { status: 400 });
    }

    // Quem está logado é identificado pelo id INTERNO do User. O `userId` do
    // Clerk não existe na tabela de usuários: gravá-lo aqui estourava a chave
    // estrangeira e derrubava com erro 500 toda reserva de cliente logado.
    let dbUserId: string | null = null;
    if (userId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerk_id: userId },
        select: { id: true },
      });
      dbUserId = dbUser?.id ?? null;
    }

    // Freio contra reserva-fantasma: o mesmo email não pode acumular reservas
    // não pagas no mesmo pacote. Sem isso dá para travar o ônibus inteiro de
    // graça — e derrubar a venda de quem ia pagar.
    const reservasEmAberto = await prisma.booking.count({
      where: {
        package_id: packageId,
        customer_email: customerEmail,
        payment_status: { not: 'paid' },
        ...activeBookingsWhere,
      },
    });
    if (reservasEmAberto >= MAX_RESERVAS_ABERTAS_POR_EMAIL) {
      return NextResponse.json(
        {
          error:
            'Você já tem reservas em aberto para este pacote. Finalize o pagamento ou fale com a equipe.',
        },
        { status: 429 }
      );
    }

    // Assentos: quantidade e numeração são conferidas antes da transação
    // (não dependem de concorrência). A disputa por assento ocupado é
    // resolvida dentro dela, mais abaixo.
    if (selectedSeats && selectedSeats.length > 0) {
      if (selectedSeats.length !== numPassengers) {
        return NextResponse.json(
          { error: `Número de assentos (${selectedSeats.length}) deve ser igual ao número de passageiros (${numPassengers})` },
          { status: 400 }
        );
      }

      const totalSeats = package_.total_seats || 0;
      const invalidSeats = selectedSeats.filter((seat) => seat < 1 || seat > totalSeats);
      if (invalidSeats.length > 0) {
        return NextResponse.json(
          { error: `Assento(s) inválido(s): ${invalidSeats.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Calcular valor total NO SERVIDOR — nunca confiar no `totalPrice` enviado
    // pelo cliente (era o vetor clássico de price tampering: o atacante
    // editava o body e pagava R$1 por um pacote de R$5.000).
    //
    // Fonte da verdade: preços do pacote no banco × breakdown de passageiros.
    //   - Se o pacote tem priceChild610 ou priceChild1113 e o frontend mandou
    //     `passengerDetails`, usamos o breakdown (adultos + crianças por faixa).
    //     Crianças de 0-5 anos (children_free) não pagam.
    //   - Caso contrário, fallback: package.price × numPassengers.
    //
    // O `body.totalPrice` é IGNORADO. Se ele veio diferente do calculado, logamos
    // pra ajudar a detectar tentativas de fraude.
    const hasChildPrices = !!(
      (package_.price_child_6_10 && package_.price_child_6_10 > 0) ||
      (package_.price_child_11_13 && package_.price_child_11_13 > 0)
    );
    const details = body.passengerDetails;

    let computedAmount: number;
    if (hasChildPrices && details) {
      const adults = Math.max(0, Math.floor(details.adults || 0));
      const children1113 = Math.max(0, Math.floor(details.children_11_13 || 0));
      const children610 = Math.max(0, Math.floor(details.children_6_10 || 0));
      // children_free (0-5 anos no colo) não paga.

      // Sanity check: total pagantes precisa bater com numPassengers.
      const payingTotal = adults + children1113 + children610;
      if (payingTotal !== numPassengers) {
        return NextResponse.json(
          {
            error: `Quantidade de passageiros pagantes (${payingTotal}) não bate com numPassengers (${numPassengers})`,
          },
          { status: 400 },
        );
      }

      computedAmount =
        package_.price * adults +
        (package_.price_child_11_13 || package_.price) * children1113 +
        (package_.price_child_6_10 || package_.price) * children610;
    } else {
      computedAmount = package_.price * numPassengers;
    }

    if (typeof body.totalPrice === 'number' && body.totalPrice !== computedAmount) {
      console.warn(
        `[booking.price] cliente enviou totalPrice=${body.totalPrice} mas servidor calculou ${computedAmount} (pkg=${package_.id}, n=${numPassengers}) — usando valor calculado`,
      );
    }
    const totalAmount = computedAmount;

    // Verificar se há código de afiliado.
    // Buscamos só pelo código (que é unique) e toleramos status em qualquer
    // caixa — basta o admin ter aprovado com 'ACTIVE' para o lookup estrito
    // devolver null e a indicação nunca ser gravada.
    let affiliate = null;
    let affiliateWarning: string | null = null;
    if (affiliateCode) {
      const affiliateRecord = await prisma.affiliate.findUnique({
        where: { code: affiliateCode },
      });

      if (!affiliateRecord) {
        affiliateWarning = 'not_found';
        console.warn(`[booking.affiliate] código ${affiliateCode} não encontrado — ignorando atribuição`);
      } else if (affiliateRecord.status?.toLowerCase() !== 'active') {
        affiliateWarning = 'inactive';
        console.warn(
          `[booking.affiliate] código ${affiliateCode} encontrado, mas status="${affiliateRecord.status}" não é "active" — ignorando atribuição`
        );
      } else if (isSelfReferral(affiliateRecord, { customerEmail, customerCpf, dbUserId })) {
        // Comissão por indicar a si mesmo não é indicação, é desconto
        // disfarçado — e bancado pela operação. A reserva continua valendo.
        affiliateWarning = 'self_referral';
        console.warn(
          `[booking.affiliate] código ${affiliateCode} usado pelo próprio afiliado (${affiliateRecord.email}) — ignorando atribuição`
        );
      } else {
        affiliate = affiliateRecord;
      }
    }

    // Criar reserva + passageiros em transação serializável: a conferência de
    // vagas e de assento ocupado acontece DENTRO dela. Antes era ler-e-depois-
    // gravar sem trava, então dois cliques simultâneos levavam o mesmo assento
    // (foi assim que os assentos 1 e 2 de Caldas Novas foram vendidos duas vezes).
    let booking;
    try {
      booking = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const ativos = await tx.booking.findMany({
            where: { package_id: packageId, ...activeBookingsWhere },
            select: { num_passengers: true, selected_seats: true },
          });

          const totalSeats = package_.total_seats || 0;
          const ocupadas = ativos.reduce(
            (soma: number, b: { num_passengers: number | null }) => soma + (b.num_passengers || 0),
            0,
          );
          const disponiveis = Math.max(totalSeats - ocupadas, 0);

          if (totalSeats > 0 && disponiveis < numPassengers) {
            throw new BookingConflict(
              disponiveis > 0 ? `Apenas ${disponiveis} vaga(s) disponível(is)` : 'Este pacote está esgotado',
              400,
            );
          }

          if (selectedSeats && selectedSeats.length > 0) {
            const occupiedSeats = new Set<number>();
            for (const b of ativos) {
              if (Array.isArray(b.selected_seats)) {
                for (const seat of b.selected_seats as number[]) occupiedSeats.add(seat);
              }
            }
            const conflitantes = selectedSeats.filter((seat) => occupiedSeats.has(seat));
            if (conflitantes.length > 0) {
              throw new BookingConflict(
                `Assento(s) ${conflitantes.join(', ')} já está(ão) ocupado(s). Por favor, escolha outro(s).`,
                409,
              );
            }
          }

          return tx.booking.create({
            data: {
              package_id: packageId,
              user_id: dbUserId ?? undefined,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              customer_cpf: customerCpf || null,
              num_passengers: numPassengers,
              total_amount: totalAmount,
              customer_notes: customerNotes || null,
              selected_seats: selectedSeats ?? undefined,
              passengers: {
                create: passengers.map((p, idx) => ({
                  full_name: p.fullName,
                  cpf: p.cpf,
                  birth_date: parseDateInput(p.birthDate) as Date,
                  phone: p.phone,
                  sex: p.sex,
                  rg: p.rg || null,
                  emergency_contact_name: p.emergencyContactName || null,
                  emergency_contact_phone: p.emergencyContactPhone || null,
                  is_responsible: p.isResponsible ?? false,
                  seat_number: p.seatNumber ?? selectedSeats?.[idx] ?? null,
                })),
              },
            },
            include: {
              package: {
                include: {
                  destination_rel: true,
                },
              },
              passengers: {
                orderBy: { created_at: 'asc' },
              },
            },
          });
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
    } catch (error) {
      if (error instanceof BookingConflict) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      if (isSerializationError(error)) {
        return NextResponse.json(
          { error: 'Alguém reservou esse lugar agora mesmo. Atualize a página e escolha outro assento.' },
          { status: 409 },
        );
      }
      throw error;
    }

    // Se há afiliado válido, criar registro de indicação + notificar afiliado
    if (affiliate) {
      const commissionAmount = Math.floor(totalAmount * (affiliate.commission_rate / 100));

      await prisma.affiliateReferral.create({
        data: {
          affiliate_id: affiliate.id,
          booking_id: booking.id,
          package_title: package_.title,
          customer_email: customerEmail,
          sale_amount: totalAmount,
          commission_amount: commissionAmount,
          commission_status: 'pending', // Aguarda aprovação manual
        },
      });

      // Notifica afiliado em fire-and-forget — falha de email não derruba a reserva
      if (affiliate.email) {
        sendAffiliateNewSaleEmail({
          to: affiliate.email,
          affiliateName: affiliate.name,
          packageTitle: package_.title,
          saleAmount: formatBRL(totalAmount),
          commissionAmount: formatBRL(commissionAmount),
          panelUrl: `${APP_URL}/dashboard/parceiro`,
        }).catch((err) => {
          console.error('[booking.affiliate] email error:', err);
        });
      }
    }

    // Recalcula vagas a partir das reservas (antes decrementava o contador,
    // que ficava errado se algo falhasse no meio)
    await syncPackageAvailability(packageId, package_.total_seats);

    return NextResponse.json({
      data: booking,
      affiliateApplied: affiliate ? affiliate.code : null,
      affiliateWarning,
    }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar reserva' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bookings (admin-only)
 * Atualiza status, payment_status e notes de uma reserva.
 * Antes só checava `auth()` — qualquer cliente logado podia editar
 * qualquer reserva (IDOR). Agora exige role admin/super_admin.
 */
export async function PUT(req: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { id, status, paymentStatus, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da reserva é obrigatório' }, { status: 400 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (paymentStatus) {
      data.payment_status = paymentStatus;
      if (paymentStatus === 'paid') data.paid_at = new Date();
    }
    if (notes !== undefined) data.notes = notes;

    // Buscar reserva atual para verificar se está sendo cancelada
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      select: {
        status: true,
        num_passengers: true,
        package_id: true,
        selected_seats: true,
        payment_status: true,
      },
    });

    if (!currentBooking) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: {
        package: true,
      },
    });

    // Cancelou (ou reativou): recalcula as vagas do pacote pelas reservas ativas
    if (status && status !== currentBooking.status) {
      await syncPackageAvailability(currentBooking.package_id, booking.package?.total_seats);
    }

    // Quando o admin marca a reserva como paga, aprovar a comissão do afiliado
    // (caso exista AffiliateReferral pendente vinculada a esse booking).
    // Só dispara na transição: estava pendente/falha → agora paid.
    if (
      paymentStatus === 'paid' &&
      currentBooking.payment_status !== 'paid'
    ) {
      try {
        await prisma.affiliateReferral.updateMany({
          where: {
            booking_id: id,
            commission_status: 'pending',
          },
          data: {
            commission_status: 'approved',
            updated_at: new Date(),
          },
        });
      } catch (err) {
        console.error('[booking.PUT] erro ao aprovar comissão do afiliado:', err);
      }
    }

    // Reserva cancelada não gera comissão. Antes a indicação continuava
    // "aprovada para pagamento" depois do cancelamento, e a equipe só
    // descobria na hora de pagar o PIX. Comissão já PAGA não é mexida aqui —
    // essa é decisão de caixa, e fica registrada no log.
    const cancelou =
      !!status &&
      status !== currentBooking.status &&
      (RELEASED_BOOKING_STATUSES as readonly string[]).includes(String(status).toLowerCase());

    if (cancelou) {
      try {
        const jaPagas = await prisma.affiliateReferral.count({
          where: { booking_id: id, commission_status: 'paid' },
        });
        if (jaPagas > 0) {
          console.warn(
            `[booking.PUT] reserva ${id} cancelada, mas ${jaPagas} comissão(ões) já paga(s) — reverter manualmente se for o caso`,
          );
        }

        const revertidas = await prisma.affiliateReferral.updateMany({
          where: {
            booking_id: id,
            commission_status: { in: ['pending', 'approved'] },
          },
          data: { commission_status: 'rejected', updated_at: new Date() },
        });
        if (revertidas.count > 0) {
          console.info(`[booking.PUT] reserva ${id} cancelada — ${revertidas.count} comissão(ões) rejeitada(s)`);
        }
      } catch (err) {
        console.error('[booking.PUT] erro ao reverter comissão do afiliado:', err);
      }
    }

    return NextResponse.json({ data: booking });
  } catch (error) {
    console.error('[API] PUT /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar reserva' },
      { status: 500 }
    );
  }
}
