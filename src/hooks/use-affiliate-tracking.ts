'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const AFFILIATE_COOKIE_NAME = 'amorim_ref'
const AFFILIATE_COOKIE_DAYS = 30 // Cookie válido por 30 dias

/**
 * Hook para capturar e armazenar código de afiliado da URL
 * Uso: Chamar em páginas públicas (pacotes, home, etc)
 */
export function useAffiliateTracking() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const refCode = searchParams.get('ref')
    
    if (refCode) {
      // Salvar código no cookie
      setAffiliateCookie(refCode.toUpperCase())
      
      // Também salvar no localStorage como backup
      try {
        localStorage.setItem(AFFILIATE_COOKIE_NAME, refCode.toUpperCase())
      } catch (e) {
        // localStorage pode não estar disponível
      }
    }
  }, [searchParams])
}

/**
 * Define o cookie de afiliado
 */
function setAffiliateCookie(code: string) {
  const expires = new Date()
  expires.setTime(expires.getTime() + AFFILIATE_COOKIE_DAYS * 24 * 60 * 60 * 1000)
  document.cookie = `${AFFILIATE_COOKIE_NAME}=${code};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

/**
 * Obtém o código de afiliado salvo (cookie ou localStorage)
 */
export function getAffiliateCode(): string | null {
  // Primeiro tenta o cookie
  const cookieValue = getCookie(AFFILIATE_COOKIE_NAME)
  if (cookieValue) return cookieValue

  // Fallback para localStorage
  try {
    return localStorage.getItem(AFFILIATE_COOKIE_NAME)
  } catch (e) {
    return null
  }
}

/**
 * Limpa o código de afiliado (após reserva bem sucedida, por exemplo)
 */
export function clearAffiliateCode() {
  // Limpar cookie
  document.cookie = `${AFFILIATE_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  
  // Limpar localStorage
  try {
    localStorage.removeItem(AFFILIATE_COOKIE_NAME)
  } catch (e) {
    // Ignora erros
  }
}

/**
 * Helper para ler cookie
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}
