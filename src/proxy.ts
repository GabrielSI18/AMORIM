import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rotas públicas (não requerem autenticação)
const isPublicRoute = createRouteMatcher([
  '/',                    // Landing page
  '/pacotes(.*)',         // Página de pacotes
  '/reserva(.*)',         // Página de reserva/checkout
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
  '/api/bookings',        // API de reservas (POST público)
])

export default clerkMiddleware(async (auth, request) => {
  // Protege todas as rotas exceto as públicas
  if (!isPublicRoute(request)) {
    await auth.protect()
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
