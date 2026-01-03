'use client'

import { useEffect } from 'react'
import { useDashboardHeader } from './dashboard-layout-client'

interface PageHeaderProps {
  title: string
  action?: React.ReactNode
}

/**
 * PageHeader - Componente para atualizar o título do dashboard em server components
 * 
 * Use isso em páginas que são server components para definir o título
 * que aparece no header do dashboard.
 * 
 * Exemplo:
 * ```tsx
 * export default async function MinhaPage() {
 *   return (
 *     <>
 *       <PageHeader title="Minha Página" />
 *       <div>Conteúdo...</div>
 *     </>
 *   )
 * }
 * ```
 */
export function PageHeader({ title, action }: PageHeaderProps) {
  const { setTitle, setAction } = useDashboardHeader()
  
  useEffect(() => {
    setTitle(title)
    if (action) {
      setAction(action)
    }
    
    // Cleanup: reset action quando desmonta
    return () => {
      setAction(null)
    }
  }, [title, action, setTitle, setAction])
  
  return null
}
