import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação para atualizar contato
const updateContactSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved', 'archived']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  assigned_to: z.string().optional().nullable(),
})

// GET /api/contacts/[id] - Buscar contato específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params

    const contact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    // Marcar como lido se ainda não foi
    if (!contact.read_at) {
      await prisma.contact.update({
        where: { id },
        data: { read_at: new Date() },
      })
    }

    return NextResponse.json({ data: contact })
  } catch (error) {
    console.error('Erro ao buscar contato:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contato' },
      { status: 500 }
    )
  }
}

// PATCH /api/contacts/[id] - Atualizar contato
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Validar dados
    const validation = updateContactSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { status, priority, notes, assigned_to } = validation.data

    // Verificar se contato existe
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}
    
    if (status !== undefined) {
      updateData.status = status
      // Marcar data de resolução quando status mudar para resolved
      if (status === 'resolved' && existingContact.status !== 'resolved') {
        updateData.resolved_at = new Date()
      }
    }
    
    if (priority !== undefined) {
      updateData.priority = priority
    }
    
    if (notes !== undefined) {
      updateData.notes = notes
    }
    
    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to
    }

    // Atualizar contato
    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Contato atualizado com sucesso',
      data: contact,
    })
  } catch (error) {
    console.error('Erro ao atualizar contato:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar contato' },
      { status: 500 }
    )
  }
}

// DELETE /api/contacts/[id] - Deletar contato (apenas SUPER_ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { role: true },
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params

    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Contato excluído com sucesso',
    })
  } catch (error) {
    console.error('Erro ao excluir contato:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir contato' },
      { status: 500 }
    )
  }
}
