'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

type UserRole = 'USER' | 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN'

interface UseUserRoleReturn {
  role: UserRole | null
  isAdmin: boolean
  isLoading: boolean
  error: string | null
}

export function useUserRole(): UseUserRoleReturn {
  const { isLoaded, isSignedIn } = useAuth()
  const [role, setRole] = useState<UserRole | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRole() {
      if (!isLoaded) return
      
      if (!isSignedIn) {
        setRole(null)
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/user/role')
        
        if (!response.ok) {
          throw new Error('Erro ao buscar role')
        }

        const data = await response.json()
        setRole(data.role)
        setIsAdmin(data.isAdmin)
      } catch (err) {
        console.error('Erro ao buscar role:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setRole('USER')
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRole()
  }, [isLoaded, isSignedIn])

  return { role, isAdmin, isLoading, error }
}
