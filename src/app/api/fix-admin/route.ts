import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// API temporária para corrigir role - REMOVER APÓS USO
export async function GET() {
  try {
    const result = await prisma.user.updateMany({
      data: { role: 'SUPER_ADMIN' }
    })
    
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true }
    })
    
    return NextResponse.json({ 
      message: 'Atualizado!', 
      updated: result.count,
      users 
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
