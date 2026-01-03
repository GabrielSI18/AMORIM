import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type UserRole = 'USER' | 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN'

interface UserState {
  user: {
    id: string
    name: string
    email: string
  } | null
  role: UserRole | null
  isAdmin: boolean
  setUser: (user: UserState['user']) => void
  setRole: (role: UserRole, isAdmin: boolean) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        role: null,
        isAdmin: false,
        setUser: (user) => set({ user }),
        setRole: (role, isAdmin) => set({ role, isAdmin }),
        clearUser: () => set({ user: null, role: null, isAdmin: false }),
      }),
      {
        name: 'user-storage',
      }
    )
  )
)
