<template>
  <auth-layout role="Chef">
    <template #menu-items>
      <q-item to="/chef" exact>
        <q-item-section avatar>
          <q-icon name="kitchen" />
        </q-item-section>
        <q-item-section>Cocina</q-item-section>
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
