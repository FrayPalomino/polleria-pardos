import { defineStore } from 'pinia'
import { supabase } from 'src/boot/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userRole: (state) => state.user?.rol
  },

  actions: {
    async login(username, password) {
      try {
        this.loading = true
        this.error = null

        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('nombre', username)
          .eq('contraseña', password)
          .single()

        if (error) throw error

        if (!data) {
          throw new Error('Credenciales inválidas')
        }

        this.user = data
        localStorage.setItem('user', JSON.stringify(data))
        return data.rol

      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      localStorage.removeItem('user')
    },

    checkAuth() {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        this.user = JSON.parse(savedUser)
      }
    }
  }
})
