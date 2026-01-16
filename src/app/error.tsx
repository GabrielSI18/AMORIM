/**
 * Global Error Boundary
 * 
 * Captura erros não tratados em toda a aplicação
 * e exibe uma UI amigável para o usuário
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para debugging
    // TODO: Integrar com Sentry ou similar em produção
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de erro */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Ops! Algo deu errado
        </h1>

        {/* Descrição */}
        <p className="text-muted-foreground mb-6">
          Ocorreu um erro inesperado. Nossa equipe foi notificada e estamos 
          trabalhando para resolver o problema.
        </p>

        {/* Código do erro (apenas em desenvolvimento) */}
          {error.message && (
          <div className="mb-6 p-4 bg-muted rounded-lg text-left">
            <p className="text-xs text-muted-foreground mb-1">Detalhes do erro:</p>
            <code className="text-sm text-red-600 dark:text-red-400 break-all">
              {error.message}
            </code>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary">
            Tentar novamente
          </Button>
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="outline"
          >
            Voltar ao início
          </Button>
        </div>

        {/* Link de suporte */}
        <p className="text-sm text-muted-foreground mt-8">
          Precisa de ajuda?{' '}
          <a 
            href="mailto:amorimturismo@ymai.com" 
            className="text-primary hover:underline"
          >
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  );
}
