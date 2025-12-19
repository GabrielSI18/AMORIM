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
  '/api/bookings',        // API de reservas (POST público)
  '/api/test-env',        // Rota de teste de env
])

export default clerkMiddleware(async (auth, request) => {
  // Rotas públicas: não proteger
  if (isPublicRoute(request)) {
    return
  }

  // Rotas privadas: verificar autenticação
  const { userId } = await auth()
  
  if (!userId) {
    // Redirecionar para página de login customizada
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
