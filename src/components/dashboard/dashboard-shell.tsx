'use client'

import { useEffect } from 'react'
import { useDashboardHeader } from './dashboard-layout-client'

interface DashboardShellProps {
  children: React.ReactNode
  title: string
  userName?: string
  userEmail?: string
  action?: React.ReactNode
}

/**
 * DashboardShell - Wrapper para páginas do dashboard
 * 
 * Quando usado dentro do DashboardLayoutClient (via layout.tsx),
 * apenas atualiza o título/action do header e renderiza o conteúdo.
 * O sidebar e estrutura já estão no layout.
 */
export function DashboardShell({
  children,
  title,
  action,
}: DashboardShellProps) {
  // Tenta usar o contexto do layout
  let headerContext: ReturnType<typeof useDashboardHeader> | null = null
  
  try {
    headerContext = useDashboardHeader()
  } catch {
    // Se não está dentro do layout, headerContext será null
    // Isso não deveria acontecer agora, mas mantemos para compatibilidade
  }
  
  // Atualiza o título e action quando monta/atualiza
  useEffect(() => {
    if (headerContext) {
      headerContext.setTitle(title)
      if (action) {
        headerContext.setAction(action)
      }
    }
  }, [title, action, headerContext])
  
  // Renderiza apenas o conteúdo - a estrutura está no layout
  return <>{children}</>
}
