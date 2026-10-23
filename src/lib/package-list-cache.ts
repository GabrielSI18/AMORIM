/**
 * Cache da listagem pública de pacotes.
 *
 * A listagem é a tela mais aberta do site e a consulta ao banco (pacotes +
 * soma de passageiros das reservas) acontecia a cada visita. Guardamos a
 * resposta na borda da Cloudflare por alguns minutos e limpamos assim que um
 * pacote é criado, editado ou removido — então o que você publica aparece na
 * hora, sem esperar o tempo do cache.
 *
 * A listagem do admin (status=all) e as buscas por texto nunca são cacheadas.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

const TTL_SEGUNDOS = 300 // 5 minutos

/** Combinações usadas pelo site; são as que limpamos na mão ao salvar */
const COMBINACOES = [
  'status=published',
  'featured=true&status=published',
  'status=published&limit=20',
  'status=PUBLISHED&limit=50',
]

function getCache(): Cache | undefined {
  return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default
}

/** Só cacheia listagem pública e sem busca por texto */
export function podeCachear(url: URL): boolean {
  const status = url.searchParams.get('status')
  if (!status || status.toLowerCase() === 'all') return false
  if (url.searchParams.get('search')) return false
  return true
}

export async function respostaDoCache(req: Request): Promise<Response | null> {
  const cache = getCache()
  if (!cache) return null
  const hit = await cache.match(new Request(req.url))
  return hit ?? null
}

/**
 * Cabeçalho da resposta: o navegador sempre revalida (max-age=0) e quem guarda
 * é a borda (s-maxage). Sem isso a Cloudflare aplicava o padrão da zona —
 * 4 horas de cache no navegador — e um pacote novo demoraria a aparecer.
 */
export function marcarCacheavel(response: Response): void {
  response.headers.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${TTL_SEGUNDOS}, stale-while-revalidate=60`
  )
}

export async function guardarNoCache(req: Request, response: Response): Promise<void> {
  const cache = getCache()
  if (!cache) return

  const copia = new Response(response.clone().body, response)
  copia.headers.set('Cache-Control', `public, max-age=${TTL_SEGUNDOS}`)
  copia.headers.delete('Set-Cookie')

  const gravar = cache.put(new Request(req.url), copia)
  const ctx = getCloudflareContext().ctx
  if (ctx?.waitUntil) ctx.waitUntil(gravar)
  else await gravar
}

/** Chamado ao criar/editar/remover pacote: derruba a listagem cacheada */
export async function limparCacheDaListagem(req: Request): Promise<void> {
  const cache = getCache()
  if (!cache) return

  const base = new URL('/api/packages', req.url)
  const apagar = Promise.all(
    COMBINACOES.map((query) => cache.delete(new Request(`${base.toString()}?${query}`)))
  )

  const ctx = getCloudflareContext().ctx
  if (ctx?.waitUntil) ctx.waitUntil(apagar)
  else await apagar
}
