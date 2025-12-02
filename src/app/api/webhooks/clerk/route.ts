import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET não configurado')
  }

  // Pegar headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return Response.json({ error: 'Headers inválidos' }, { status: 400 })
  }

  // Pegar body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verificar webhook
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('❌ Erro ao verificar webhook:', err)
    return Response.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  // Processar evento
  const eventType = evt.type

  console.log(`📥 Webhook recebido: ${eventType}`)

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data)
        break

      case 'user.updated':
        await handleUserUpdated(evt.data)
        break

      case 'user.deleted':
        await handleUserDeleted(evt.data)
        break

      default:
        console.log(`⚠️ Evento não tratado: ${eventType}`)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error(`❌ Erro ao processar ${eventType}:`, error)
    return Response.json({ error: 'Erro ao processar evento' }, { status: 500 })
  }
}

// Handler: Criar usuário
async function handleUserCreated(data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data

  const email = email_addresses[0]?.email_address

  if (!email) {
    throw new Error('Email não encontrado')
  }

  const user = await prisma.user.create({
    data: {
      clerk_id: id,
      email,
      first_name: first_name || null,
      last_name: last_name || null,
      name: `${first_name || ''} ${last_name || ''}`.trim() || null,
      image_url: image_url || null,
    },
  })

  console.log('✅ Usuário criado no banco:', user.email)

  // Enviar email de boas-vindas
  await sendWelcomeEmail({
    to: email,
    userName: first_name || 'Usuário',
  })
}

// Handler: Atualizar usuário
async function handleUserUpdated(data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data

  const email = email_addresses[0]?.email_address

  const user = await prisma.user.update({
    where: { clerk_id: id },
    data: {
      email,
      first_name: first_name || null,
      last_name: last_name || null,
      name: `${first_name || ''} ${last_name || ''}`.trim() || null,
      image_url: image_url || null,
    },
  })

  console.log('✅ Usuário atualizado no banco:', user.email)
}

// Handler: Deletar usuário
async function handleUserDeleted(data: any) {
  const { id } = data

  await prisma.user.delete({
    where: { clerk_id: id },
  })

  console.log('✅ Usuário deletado do banco:', id)
}
