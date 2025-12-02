/**
 * 404 Not Found Page
 * 
 * Página customizada para quando o usuário acessa uma rota inexistente
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Número 404 grande */}
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Página não encontrada
        </h2>

        {/* Descrição */}
        <p className="text-muted-foreground mb-8">
          A página que você está procurando não existe ou foi movida para outro endereço.
        </p>

        {/* Ilustração simples */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
            <div className="absolute inset-4 bg-primary/20 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-primary/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="primary">
              Voltar ao início
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">
              Ir para Dashboard
            </Button>
          </Link>
        </div>

        {/* Sugestões */}
        <div className="mt-12 text-left">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Talvez você esteja procurando:
          </p>
          <ul className="space-y-2">
            <li>
              <Link 
                href="/" 
                className="text-sm text-primary hover:underline flex items-center gap-2"
              >
                <span>→</span> Página inicial
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard" 
                className="text-sm text-primary hover:underline flex items-center gap-2"
              >
                <span>→</span> Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/billing" 
                className="text-sm text-primary hover:underline flex items-center gap-2"
              >
                <span>→</span> Faturamento
              </Link>
            </li>
            <li>
              <Link 
                href="/#pricing" 
                className="text-sm text-primary hover:underline flex items-center gap-2"
              >
                <span>→</span> Planos e preços
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
