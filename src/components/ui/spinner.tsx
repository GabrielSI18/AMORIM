/**
 * Spinner Component
 * 
 * Componente de loading reutilizável com diferentes tamanhos
 */

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
  xl: 'w-16 h-16 border-4',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Carregando"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

/**
 * Spinner com texto
 */
interface SpinnerWithTextProps extends SpinnerProps {
  text?: string;
}

export function SpinnerWithText({ text = 'Carregando...', size = 'md', className }: SpinnerWithTextProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <Spinner size={size} />
      <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}

/**
 * Spinner inline (para botões)
 */
export function SpinnerInline({ className }: { className?: string }) {
  return (
    <Spinner 
      size="sm" 
      className={cn('inline-block', className)} 
    />
  );
}
