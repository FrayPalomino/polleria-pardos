<template>
  <q-layout view="lHh LpR lFf">

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="panel-title">
          Panel de {{ role }}
        </q-toolbar-title>
        <div class="row items-center">
          <span class="q-mr-sm">({{ userName }})</span>
          <q-btn flat round dense icon="account_circle" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" bordered>
      <q-scroll-area class="fit">
        <q-list class="column justify-between fit">
          <div>
            <q-item class="q-mt-md" style="display: flex; justify-content: flex-end; padding-right: 90px;">
              <q-avatar size="120px">
                <img src="~assets/log.png" />
              </q-avatar>
            </q-item>

            <q-separator spaced />

            <q-item-label header>Menú</q-item-label>
            <slot name="menu-items" />
          </div>

          <q-item clickable v-ripple class="text-negative absolute-bottom" @click="logout">
            <q-item-section avatar>
              <q-icon name="logout" />
            </q-item-section>
            <q-item-section>Cerrar sesión</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white q-pa-xs">
      <q-toolbar class="footer-content">
        <q-toolbar-title class="text-center text-caption" >
          <div>&copy; {{ new Date().getFullYear() }} | Polleria Pardos</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>

  </q-layout>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

export default {
  props: {
    role: {
      type: String,
      required: true
    }
  },
  setup() {
    const leftDrawerOpen = ref(false)
    const router = useRouter()
    const authStore = useAuthStore()

    const userName = computed(() => authStore.user?.nombre || '')

    const toggleLeftDrawer = () => {
      leftDrawerOpen.value = !leftDrawerOpen.value
    }

    const logout = () => {
      authStore.logout()
      router.push('/login')
    }

    return {
      leftDrawerOpen,
      toggleLeftDrawer,
      logout,
      userName
    }
  }
}
</script>

<style scoped>
.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
@media screen and (max-width: 400px) {
  .panel-title {
    font-size: 1.1rem;
  }
}
</style>

