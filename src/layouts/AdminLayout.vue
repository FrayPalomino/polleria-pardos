<template>
  <auth-layout role="Administrador">
    <template #menu-items>
      <q-item to="/administrador" exact>
        <q-item-section avatar>
          <q-icon name="dashboard" />
        </q-item-section>
        <q-item-section>Dashboard</q-item-section>
      </q-item>
      <q-item to="/administrador/empleados" exact>
        <q-item-section avatar>
          <q-icon name="groups" />
         </q-item-section>
        <q-item-section>Gestión de Empleados</q-item-section>
      </q-item>

      <q-item to="/administrador/platos" exact>
        <q-item-section avatar>
          <q-icon name="restaurant" />
        </q-item-section>
        <q-item-section>Gestión de Platos</q-item-section>
      </q-item>

      <q-item to="/administrador/bebidas" exact>
        <q-item-section avatar>
          <q-icon name="local_bar" />
        </q-item-section>
        <q-item-section>Gestión de Bebidas</q-item-section>
      </q-item>


      <q-item to="/administrador/mesas" exact>
        <q-item-section avatar>
          <q-icon name="table_restaurant" />
        </q-item-section>
        <q-item-section>Gestión de Mesas</q-item-section>
      </q-item>

      <q-item to="/administrador/reporteplatos" exact>
        <q-item-section avatar>
          <q-icon name="bar_chart" />
        </q-item-section>
        <q-item-section>Reporte de Platos</q-item-section>
      </q-item>

      <q-item to="/administrador/reportebebidas" exact>
        <q-item-section avatar>
          <q-icon name="bar_chart" />
        </q-item-section>
        <q-item-section>Reporte de Bebidas</q-item-section>
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
