'use client'

/**
 * Configurações do site (admin)
 *
 * Telefone, WhatsApp, e-mails, endereço, redes e mapa que aparecem no site
 * público. Antes esses dados só podiam ser mudados direto no banco.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AdminGuard } from '@/components/dashboard/admin-guard'
import { DashboardShell } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Save, ExternalLink } from 'lucide-react'

interface SiteConfigForm {
  site_name: string
  site_description: string
  phone_primary: string
  phone_secondary: string
  whatsapp_number: string
  email: string
  email_affiliates: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
  instagram_url: string
  facebook_url: string
  maps_link: string
  maps_embed_url: string
  meta_pixel_id: string
}

const EMPTY: SiteConfigForm = {
  site_name: '',
  site_description: '',
  phone_primary: '',
  phone_secondary: '',
  whatsapp_number: '',
  email: '',
  email_affiliates: '',
  address_street: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  instagram_url: '',
  facebook_url: '',
  maps_link: '',
  maps_embed_url: '',
  meta_pixel_id: '',
}

const inputClass =
  'w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#004a80]/30 focus:border-[#004a80] transition'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0]">{title}</h2>
        {description && <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** (31) 98886-2079 */
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export default function ConfiguracoesSitePage() {
  const [form, setForm] = useState<SiteConfigForm>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config')
      if (!res.ok) throw new Error('Erro ao carregar configurações')
      const data = await res.json()
      const next = { ...EMPTY }
      for (const key of Object.keys(EMPTY) as (keyof SiteConfigForm)[]) {
        next[key] = data?.[key] ?? ''
      }
      next.phone_primary = next.phone_primary ? formatPhone(next.phone_primary) : ''
      next.phone_secondary = next.phone_secondary ? formatPhone(next.phone_secondary) : ''
      setForm(next)
    } catch {
      toast.error('Não foi possível carregar as configurações')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const update = (field: keyof SiteConfigForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value
    const value =
      field === 'phone_primary' || field === 'phone_secondary'
        ? formatPhone(raw)
        : field === 'whatsapp_number'
          ? raw.replace(/\D/g, '').slice(0, 15)
          : field === 'address_state'
            ? raw.toUpperCase().slice(0, 2)
            : raw
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = Object.fromEntries(
        (Object.keys(form) as (keyof SiteConfigForm)[]).map((key) => [key, form[key].trim() || null]),
      )

      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar')

      toast.success('Configurações salvas. O site já mostra os novos dados.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminGuard>
      <DashboardShell title="Configurações do Site">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard/configuracoes"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-[#A0A0A0] hover:text-gray-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#004a80] hover:underline"
          >
            Ver site
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pb-24">
            <Section title="Identidade" description="Aparece no topo do site e nos resultados de busca">
              <Field label="Nome do site">
                <input className={inputClass} value={form.site_name} onChange={update('site_name')} maxLength={120} />
              </Field>
              <Field label="Descrição" hint="Frase curta que o Google mostra abaixo do nome">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.site_description}
                  onChange={update('site_description')}
                  maxLength={500}
                />
              </Field>
            </Section>

            <Section title="Contato" description="Usado nas páginas públicas e nos botões de WhatsApp">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Telefone principal">
                  <input className={inputClass} value={form.phone_primary} onChange={update('phone_primary')} placeholder="(31) 98886-2079" />
                </Field>
                <Field label="Telefone secundário">
                  <input className={inputClass} value={form.phone_secondary} onChange={update('phone_secondary')} placeholder="(31) 3333-4444" />
                </Field>
              </div>
              <Field
                label="Número do WhatsApp"
                hint="Só números, com 55 na frente. Ex.: 5531988862079"
              >
                <input className={inputClass} value={form.whatsapp_number} onChange={update('whatsapp_number')} inputMode="numeric" placeholder="5531988862079" />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="E-mail principal">
                  <input className={inputClass} type="email" value={form.email} onChange={update('email')} placeholder="contato@amorimturismo.com.br" />
                </Field>
                <Field label="E-mail de afiliados">
                  <input className={inputClass} type="email" value={form.email_affiliates} onChange={update('email_affiliates')} placeholder="afiliados@amorimturismo.com.br" />
                </Field>
              </div>
            </Section>

            <Section title="Endereço" description="Mostrado no rodapé e na página de contato">
              <Field label="Rua e número">
                <input className={inputClass} value={form.address_street} onChange={update('address_street')} />
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Cidade">
                  <input className={inputClass} value={form.address_city} onChange={update('address_city')} />
                </Field>
                <Field label="UF">
                  <input className={inputClass} value={form.address_state} onChange={update('address_state')} placeholder="MG" maxLength={2} />
                </Field>
                <Field label="CEP">
                  <input className={inputClass} value={form.address_zip} onChange={update('address_zip')} placeholder="32240-080" />
                </Field>
              </div>
            </Section>

            <Section title="Redes e mapa" description="Links completos, começando com https://">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Instagram">
                  <input className={inputClass} value={form.instagram_url} onChange={update('instagram_url')} placeholder="https://instagram.com/amorimturismo" />
                </Field>
                <Field label="Facebook">
                  <input className={inputClass} value={form.facebook_url} onChange={update('facebook_url')} placeholder="https://facebook.com/amorimturismo" />
                </Field>
              </div>
              <Field label="Link do Google Maps" hint="O endereço que abre o mapa ao clicar">
                <input className={inputClass} value={form.maps_link} onChange={update('maps_link')} placeholder="https://maps.app.goo.gl/..." />
              </Field>
              <Field
                label="Mapa incorporado"
                hint="No Google Maps: Compartilhar, Incorporar um mapa, e copie só o endereço que está em src=..."
              >
                <input className={inputClass} value={form.maps_embed_url} onChange={update('maps_embed_url')} placeholder="https://www.google.com/maps/embed?pb=..." />
              </Field>
            </Section>

            <Section title="Rastreamento" description="Opcional, para anúncios">
              <Field label="ID do Meta Pixel" hint="Só o número, encontrado no Gerenciador de Anúncios">
                <input className={inputClass} value={form.meta_pixel_id} onChange={update('meta_pixel_id')} maxLength={40} />
              </Field>
            </Section>

            <div className="fixed bottom-20 left-0 right-0 px-4 md:static md:px-0">
              <Button type="submit" className="w-full" disabled={isSaving}>
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </div>
          </form>
        )}
      </DashboardShell>
    </AdminGuard>
  )
}
