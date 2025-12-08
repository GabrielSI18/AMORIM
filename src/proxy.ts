import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rotas públicas (não requerem autenticação)
const isPublicRoute = createRouteMatcher([
  '/',                    // Landing page
  '/pacotes(.*)',         // Página de pacotes
  '/afiliados(.*)',       // Página de afiliados
  '/sobre(.*)',           // Página sobre nós
  '/faq(.*)',             // Perguntas frequentes
  '/politicas(.*)',       // Políticas de cancelamento
  '/termos(.*)',          // Termos de uso
  '/sign-in(.*)',         // Páginas de login
  '/sign-up(.*)',         // Páginas de cadastro
  '/api/webhooks(.*)',    // Webhooks (Clerk, etc)
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
