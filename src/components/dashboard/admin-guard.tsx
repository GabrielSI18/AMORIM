'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/use-user-role'
import { Loader2 } from 'lucide-react'

interface AdminGuardProps {
  children: React.ReactNode
  fallbackUrl?: string
}

/**
 * Componente que protege rotas admin-only em páginas client-side
 * Redireciona para /dashboard se o usuário não for admin
 */
export function AdminGuard({ children, fallbackUrl = '/dashboard' }: AdminGuardProps) {
  const router = useRouter()
  const { isAdmin, isLoading } = useUserRole()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace(fallbackUrl)
    }
  }, [isAdmin, isLoading, router, fallbackUrl])

  // Enquanto verifica a role, mostra loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Se não for admin, não renderiza nada (está redirecionando)
  if (!isAdmin) {
    return null
  }

  // Se for admin, renderiza o conteúdo
  return <>{children}</>
}
