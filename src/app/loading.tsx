/**
 * Global Loading State
 * 
 * Exibido durante transições de página e carregamento inicial
 */

import { Spinner } from '@/components/ui/spinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground animate-pulse">
          Carregando...
        </p>
      </div>
    </div>
  );
}
