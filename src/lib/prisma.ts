import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // No Cloudflare Workers, usa o adapter HTTP do Neon via WebSocket
  // Ativado via variável de ambiente CF_PAGES=1 (setada automaticamente pelo Cloudflare)
  if (process.env.CF_PAGES === '1' || process.env.CLOUDFLARE === '1') {
    const { PrismaNeon } = require('@prisma/adapter-neon')
    const { Pool, neonConfig } = require('@neondatabase/serverless')
    if (typeof WebSocket !== 'undefined') {
      neonConfig.webSocketConstructor = WebSocket
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  }

  // Node.js padrão (local, Vercel, etc.)
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
