import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'src/stores/auth'

export default route(function(/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    authStore.checkAuth()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next('/login')
      return
    }

    if (to.meta.role && authStore.userRole !== to.meta.role) {
      next(`/${authStore.userRole}`)
      return
    }

    if (to.path === '/login' && authStore.isAuthenticated) {
      next(`/${authStore.userRole}`)
      return
    }

    next()
  })

  return Router
})
