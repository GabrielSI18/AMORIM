import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Rotas que EXIGEM login. Todo o resto é público — assim uma página nova do
// site não cai no login por esquecimento, e uma URL inexistente mostra o 404
// em vez de mandar o visitante para a tela de entrar.
//
// As rotas de API abaixo são as que não têm verificação própria de permissão
// (as demais usam requireAdmin/requireAdminApi/auth() dentro da própria rota).
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', // Painel administrativo
  '/api/ai(.*)', // IA (custo por chamada)
  '/api/chat(.*)', // IA (custo por chamada)
  '/api/clients(.*)', // Dados de clientes
  '/api/user(.*)', // Dados do usuário logado
  '/api/test(.*)', // Rotas de teste (envio de email)
  '/api/images/upload(.*)', // Upload de imagens
])

export default clerkMiddleware(async (auth, request) => {
  if (!isProtectedRoute(request)) {
    return
  }

  const { userId } = await auth()
  if (userId) {
    return
  }

  // API responde 401 em JSON; página redireciona para o login
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const signInUrl = new URL('/sign-in', request.url)
  signInUrl.searchParams.set('redirect_url', request.url)
  return NextResponse.redirect(signInUrl)
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
