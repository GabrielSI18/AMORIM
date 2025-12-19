/**
 * Global Loading State
 * 
 * Exibido durante transições de página e carregamento inicial
 */

import { SpinnerWithText } from '@/components/ui/spinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <SpinnerWithText size="lg" text="Carregando..." />
    </div>
  );
}
