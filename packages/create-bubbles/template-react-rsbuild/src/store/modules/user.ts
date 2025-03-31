import { create } from 'zustand'

interface searchFormState {
  token?: string
  setToken: (token?: string) => void
}

export const useUserStore = create<searchFormState>((set) => ({
  token: undefined,
  setToken: (token) => set(() => ({ token })),
}))
