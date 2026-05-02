import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidateTag } from 'next/cache'
import { getSiteConfig } from '@/lib/site-config'

// GET público — retorna config do site (com cache)
export async function GET() {
  const config = await getSiteConfig()
  return NextResponse.json(config)
}

// Helper para validar URL opcional (string vazia também aceita).
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//i.test(v), 'URL deve começar com http:// ou https://')
  .optional()
  .nullable()

const optionalString = (max = 200) =>
  z.string().trim().max(max).optional().nullable()

// Schema de atualização do SiteConfig.
// Todos os campos são opcionais — admin pode editar parcialmente.
// Limites de tamanho previnem payloads abusivos; URLs são validadas para
// impedir vetores como `javascript:...` em links/iframes.
const siteConfigUpdateSchema = z.object({
  site_name: optionalString(120),
  site_description: optionalString(500),
  phone_primary: optionalString(40),
  phone_secondary: optionalString(40),
  whatsapp_number: optionalString(40),
  email: z.string().trim().email('E-mail inválido').max(200).optional().nullable(),
  email_affiliates: z
    .string()
    .trim()
    .email('E-mail inválido')
    .max(200)
    .optional()
    .nullable()
    .or(z.literal('')),
  address_street: optionalString(200),
  address_city: optionalString(100),
  address_state: optionalString(40),
  address_zip: optionalString(20),
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,
  maps_embed_url: optionalUrl,
  maps_link: optionalUrl,
  meta_pixel_id: optionalString(40),
})

// PUT admin — atualiza config do site
export async function PUT(req: Request) {
  await requireAdmin()

  const rawBody = await req.json()
  const validation = siteConfigUpdateSchema.safeParse(rawBody)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || 'Dados inválidos' },
      { status: 400 },
    )
  }

  const data = validation.data

  // Filtra apenas campos definidos (undefined === "não enviar update").
  const updateData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) updateData[key] = value
  }

  const config = await prisma.siteConfig.update({
    where: { id: 'default' },
    data: updateData,
  })

  // Revalidar cache do site-config
  revalidateTag('site-config', 'default')

  return NextResponse.json(config)
}
