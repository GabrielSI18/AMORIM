/**
 * Clerk falso. `setSession('user_x')` define quem está logado na próxima
 * chamada de rota; `setSession(null)` simula visitante anônimo.
 */

let currentUserId: string | null = null

export function setSession(clerkUserId: string | null) {
  currentUserId = clerkUserId
}

export async function auth() {
  return { userId: currentUserId, sessionId: currentUserId ? 'sess_fake' : null }
}

export async function currentUser() {
  if (!currentUserId) return null
  return { id: currentUserId, emailAddresses: [], firstName: null, lastName: null }
}

export function clerkMiddleware() {
  return () => undefined
}

export function createRouteMatcher() {
  return () => false
}

export const clerkClient = async () => ({
  users: {
    getUser: async (id: string) => ({ id }),
    updateUserMetadata: async () => ({}),
  },
})
