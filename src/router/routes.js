const routes = [
  {
    path: '/',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/login'
      },
      {path: 'login', component: () => import('pages/LoginPage.vue')}
    ]
  },
  {
    path: '/administrador',
    component: () => import('layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'administrador' },
    children: [
      {path: '', component: () => import('pages/admin/DashboardPage.vue')},
      {path: 'empleados', component: () => import('pages/admin/GestionEmpleados.vue')},
      {path: 'platos', component: () => import('pages/admin/GestionPlatos.vue')},
      {path: 'bebidas', component: () => import('pages/admin/GestionBebidas.vue')},
      {path: 'mesas', component: () => import('pages/admin/GestionMesas.vue')},
      {path: 'reporteplatos', component: () => import('src/pages/admin/ReportePlatos.vue')},
      {path: 'reportebebidas', component: () => import('src/pages/admin/ReporteBebidas.vue')}
    ]
  },
  {
    path: '/mesero',
    component: () => import('layouts/MeseroLayout.vue'),
    meta: { requiresAuth: true, role: 'mesero' },
    children: [
      {path: '', component: () => import('src/pages/mesero/MesasPage.vue')}
    ]
  },
  {
    path: '/chef',
    component: () => import('layouts/ChefLayout.vue'),
    meta: { requiresAuth: true, role: 'chef' },
    children: [
      {path: '', component: () => import('src/pages/chef/CocinaPage.vue')}
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/login'
      },
      {path: 'login', component: () => import('pages/LoginPage.vue')}
    ]
  }
]

export default routes
