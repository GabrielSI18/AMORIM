'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useUserStore } from '@/stores/user-store'

type UserRole = 'USER' | 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN'

interface UseUserRoleReturn {
  role: UserRole | null
  isAdmin: boolean
  isSuperAdmin: boolean
  isLoading: boolean
  error: string | null
}

export function useUserRole(): UseUserRoleReturn {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { role: cachedRole, isAdmin: cachedIsAdmin, setRole } = useUserStore()
  const [role, setLocalRole] = useState<UserRole | null>(cachedRole)
  const [isAdmin, setIsAdmin] = useState(cachedIsAdmin)
  const [isLoading, setIsLoading] = useState(!cachedRole) // Se já tem cache, não está loading
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRole() {
      if (!isLoaded) return
      
      if (!isSignedIn) {
        setLocalRole(null)
        setIsAdmin(false)
        setRole(null as unknown as UserRole, false)
        setIsLoading(false)
        return
      }

      // Se já tem cache, usa imediatamente
      if (cachedRole) {
        setLocalRole(cachedRole)
        setIsAdmin(cachedIsAdmin)
        setIsLoading(false)
      }

      try {
        const response = await fetch('/api/user/role')
        
        if (!response.ok) {
          throw new Error('Erro ao buscar role')
        }

        const data = await response.json()
        setLocalRole(data.role)
        setIsAdmin(data.isAdmin)
        // Salva no cache persistente
        setRole(data.role, data.isAdmin)
      } catch (err) {
        console.error('Erro ao buscar role:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        // Se não tem cache, fallback para USER
        if (!cachedRole) {
          setLocalRole('USER')
          setIsAdmin(false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchRole()
  }, [isLoaded, isSignedIn, userId, cachedRole, cachedIsAdmin, setRole])

  const isSuperAdmin = role === 'SUPER_ADMIN'

  return { role, isAdmin, isSuperAdmin, isLoading, error }
}
