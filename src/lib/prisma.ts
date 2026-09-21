import type { PrismaClient as PrismaClientType } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// No Cloudflare Workers o Prisma roda com o engine WASM + adapter do Neon (WebSocket).
// O Workers não deixa reusar uma conexão aberta em outra requisição, então lá
// criamos um client por requisição (chaveado pelo ExecutionContext do OpenNext).
// Fora do Workers (next dev, scripts) segue o singleton tradicional.

const isCloudflareWorker =
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'

// O entrypoint padrão do @prisma/client sempre carrega o engine nativo (Node),
// então no Workers importamos explicitamente a build WASM. O __non_webpack_require__
// deixa esse require intacto para o bundler do OpenNext (que resolve o .wasm).
declare const __non_webpack_require__: NodeJS.Require
const { PrismaClient } = (
  isCloudflareWorker ? __non_webpack_require__('@prisma/client/wasm') : require('@prisma/client')
) as typeof import('@prisma/client')
type PrismaClient = PrismaClientType

const cloudflareContextSymbol = Symbol.for('__cloudflare-context__')

function getRequestContext(): object | undefined {
  return (globalThis as Record<symbol, { ctx?: object } | undefined>)[cloudflareContextSymbol]?.ctx
}

const createWorkerClient = () =>
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
  })

const workerClients = new WeakMap<object, PrismaClient>()

declare const globalThis: {
  prismaGlobal: PrismaClient | undefined
} & typeof global

function getClient(): PrismaClient {
  if (isCloudflareWorker) {
    const ctx = getRequestContext()
    if (!ctx) return createWorkerClient()
    let client = workerClients.get(ctx)
    if (!client) {
      client = createWorkerClient()
      workerClients.set(ctx, client)
    }
    return client
  }

  if (!globalThis.prismaGlobal) globalThis.prismaGlobal = new PrismaClient()
  return globalThis.prismaGlobal
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export default prisma
