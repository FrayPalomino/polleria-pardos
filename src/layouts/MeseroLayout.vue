<template>
  <auth-layout role="Mesero">
    <template #menu-items>
      <q-item to="/mesero" exact>
        <q-item-section avatar>
          <q-icon name="restaurant_menu" />
        </q-item-section>
        <q-item-section>Órdenes</q-item-section>
      </q-item>
    </template>
  </auth-layout>
</template>

<script>
import AuthLayout from './AuthLayout.vue'

export default {
  components: {
    AuthLayout
  }
}
</script>
