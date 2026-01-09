import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Rotas públicas (não requerem autenticação)
const isPublicRoute = createRouteMatcher([
  '/',                    // Landing page
  '/pacotes(.*)',         // Página de pacotes
  '/reserva(.*)',         // Página de reserva/checkout
  '/frota(.*)',           // Página da frota
  '/afiliados(.*)',       // Página de afiliados
  '/sobre(.*)',           // Página sobre nós
  '/faq(.*)',             // Perguntas frequentes
  '/politicas(.*)',       // Políticas de cancelamento
  '/termos(.*)',          // Termos de uso
  '/contato(.*)',         // Página de contato
  '/sign-in(.*)',         // Páginas de login
  '/sign-up(.*)',         // Páginas de cadastro
  '/sso-callback(.*)',    // Callback OAuth (Google, Apple)
  '/api/webhooks(.*)',    // Webhooks (Clerk, etc)
  '/api/packages(.*)',    // API de pacotes (pública para listagem)
  '/api/fleet(.*)',       // API de frota (pública para listagem)
  '/api/bookings(.*)',    // API de reservas (público para criar e buscar por ID)
  '/api/categories(.*)',  // API de categorias
  '/api/destinations(.*)', // API de destinos
  '/api/contacts(.*)',    // API de contatos
  '/api/affiliates(.*)',  // API de afiliados
  '/api/test-env',        // Rota de teste de env
])

// Rotas de autenticação (sign-in, sign-up)
const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  
  // Rotas de auth: se já logado, redirecionar para dashboard
  if (isAuthRoute(request)) {
    if (userId) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return // Deixar acessar página de login
  }
  
  // Rotas públicas: deixar passar
  if (isPublicRoute(request)) {
    return
  }

  // Rotas privadas: se não logado, redirecionar para sign-in customizado
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
