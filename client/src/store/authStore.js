import { create } from 'zustand'
import api from '../lib/api'

const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  fetchMe: async () => {
    try {
      const { data } = await api.get('/me')
      set({ user: data, isLoading: false })
    } catch {
      set({ user: null, isLoading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    set({ user: data })
    return data
  },

  logout: async () => {
    await api.delete('/logout')
    set({ user: null })
  },
}))

export default useAuthStore
