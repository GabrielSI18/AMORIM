import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Rotas públicas que não precisam de autenticação
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/pacotes(.*)',
  '/pacotes/(.*)',
  '/reserva/(.*)',
  '/afiliados(.*)',
  '/contato(.*)',
  '/sobre(.*)',
  '/faq(.*)',
  '/termos(.*)',
  '/politicas(.*)',
  '/frota(.*)',
  '/api/webhooks(.*)',
  '/api/packages(.*)',
  '/api/categories(.*)',
  '/api/destinations(.*)',
  '/api/fleet(.*)',
  '/api/contacts(.*)',
  '/api/affiliates(.*)',
  '/api/bookings(.*)',
]);

// Rotas de autenticação (sign-in, sign-up)
const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const session = await auth();
  const { userId } = session;
  
  // Se usuário está logado e tenta acessar página de auth, redirecionar para dashboard
  if (userId && isAuthRoute(req)) {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  // Se não é rota pública e usuário não está logado, proteger
  if (!isPublicRoute(req) && !userId) {
    // Deixar o Clerk lidar com o redirect para sign-in
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
