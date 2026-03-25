import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidateTag } from 'next/cache'
import { getSiteConfig } from '@/lib/site-config'

// GET público — retorna config do site (com cache)
export async function GET() {
  const config = await getSiteConfig()
  return NextResponse.json(config)
}

// PUT admin — atualiza config do site
export async function PUT(req: Request) {
  await requireAdmin()

  const body = await req.json()

  const config = await prisma.siteConfig.update({
    where: { id: 'default' },
    data: {
      site_name: body.site_name,
      site_description: body.site_description,
      phone_primary: body.phone_primary,
      phone_secondary: body.phone_secondary,
      whatsapp_number: body.whatsapp_number,
      email: body.email,
      email_affiliates: body.email_affiliates,
      address_street: body.address_street,
      address_city: body.address_city,
      address_state: body.address_state,
      address_zip: body.address_zip,
      instagram_url: body.instagram_url,
      facebook_url: body.facebook_url,
      maps_embed_url: body.maps_embed_url,
      maps_link: body.maps_link,
      meta_pixel_id: body.meta_pixel_id,
    },
  })

  // Revalidar cache do site-config
  revalidateTag('site-config')

  return NextResponse.json(config)
}
