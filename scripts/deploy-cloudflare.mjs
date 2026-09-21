// Deploy de produção no Cloudflare Workers (OpenNext).
//
// O build do OpenNext embute os arquivos .env da pasta dentro do Worker, então
// os .env de desenvolvimento (chaves de teste) saem da frente durante o build.
// Só o .env.production (variáveis NÃO secretas) entra no bundle; os segredos
// vão como `wrangler secret` a partir do .secrets.production.json.
//
// Uso: npm run deploy            (build + deploy + secrets)
//      npm run deploy -- --build (só o build, sem publicar)

import { existsSync, renameSync } from 'node:fs'
import { execSync } from 'node:child_process'

const DEV_ENV_FILES = ['.env', '.env.local', '.env.development', '.env.development.local', '.dev.vars']
const BACKUP_SUFFIX = '.deploy-bak'
const buildOnly = process.argv.includes('--build')

const run = (cmd) => execSync(cmd, { stdio: 'inherit' })

if (!existsSync('.env.production')) {
  console.error('Faltando .env.production (variáveis públicas de produção).')
  process.exit(1)
}

const moved = []
try {
  for (const file of DEV_ENV_FILES) {
    if (existsSync(file)) {
      renameSync(file, file + BACKUP_SUFFIX)
      moved.push(file)
    }
  }
  run('npx opennextjs-cloudflare build')
} finally {
  for (const file of moved) renameSync(file + BACKUP_SUFFIX, file)
}

if (buildOnly) process.exit(0)

run('npx opennextjs-cloudflare deploy')

if (existsSync('.secrets.production.json')) {
  run('npx wrangler secret bulk .secrets.production.json')
} else {
  console.warn('Sem .secrets.production.json: segredos não foram atualizados.')
}
