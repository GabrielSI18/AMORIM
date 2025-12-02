/**
 * API Route: GET /api/invoices
 * 
 * Lista as faturas (invoices) do usuário autenticado via Stripe
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar usuário para pegar stripe_customer_id
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { stripe_customer_id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!user.stripe_customer_id) {
      // Usuário sem customer no Stripe = sem faturas
      return NextResponse.json({ invoices: [] });
    }

    // Parâmetros de paginação
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const startingAfter = searchParams.get('starting_after') || undefined;

    // Buscar invoices do Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit,
      starting_after: startingAfter,
    });

    // Mapear para formato mais limpo
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      description: invoice.description,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      created: new Date(invoice.created * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      paidAt: invoice.status_transitions?.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000) 
        : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      // Linha de itens (produtos/planos)
      lines: invoice.lines.data.map((line) => ({
        description: line.description,
        amount: line.amount,
        quantity: line.quantity,
      })),
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      hasMore: invoices.has_more,
    });
  } catch (error) {
    console.error('Erro ao buscar invoices:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
