<template>
  <q-layout view="lHh lpR lFf" class="body">
    <q-page-container class="flex flex-center">
      <q-card class="q-pa-lg shadow-2 login-card">
        <q-card-section class="text-center">
          <q-img src="~assets/log.png" class="login-logo" contain />
          <div class="text-h5 q-mt-md">POLLERIA PARDOS</div>
          <div class="text-subtitle2">Iniciar Sesión</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="username"
              label="Usuario"
              outlined
              dense
              class="q-mt-md"
              :rules="[val => !!val || 'El usuario es requerido']"
            />

            <q-input
              v-model="password"
              label="Contraseña"
              type="password"
              outlined
              dense
              class="q-mt-md"
              :rules="[val => !!val || 'La contraseña es requerida']"
            />

            <q-card-actions class="justify-center q-mt-md">
              <q-btn
                color="primary"
                label="Ingresar"
                type="submit"
                class="full-width"
                :loading="loading"
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useQuasar } from 'quasar';

export default {
  name: 'LoginPage',
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const authStore = useAuthStore();

    const username = ref('');
    const password = ref('');
    const loading = ref(false);

    const onSubmit = async () => {
      try {
        loading.value = true;
        const role = await authStore.login(username.value, password.value);
        await router.push(`/${role}`);
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Credenciales incorrectas! ' + error.message,
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    return {
      username,
      password,
      loading,
      onSubmit,
    };
  },
};
</script>

<style scoped>
.body {
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  background: #dae0dd;
}
.login-card {
  align-items: center;
  width: 350px;
  max-width: 350px;
  background: rgba(64, 64, 64, 0.8);
  color: white;
  border-radius: 10px;
}
.login-logo {
  max-width: 100px;
  margin: 0 auto;
}
@media screen and (max-width: 400px) {
  .login-card {
    width: 300px;
    max-width: 300px;
    padding: 20px;
  }

  .login-logo {
    max-width: 80px;
  }
}
</style>

