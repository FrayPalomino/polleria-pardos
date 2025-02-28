<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Gestión de Mesas</div>

    <q-btn color="primary" label="Agregar Mesa" icon="add" class="q-mb-md" @click="abrirDialogoAgregar" />

    <div class="mesa-container">
      <div v-for="mesa in mesas" :key="mesa.id" class="mesa" :class="{ 'ocupada': mesa.estado !== 'libre' }">
        Mesa {{ mesa.numero }}
        <q-btn class="remove-btn" color="negative" icon="delete" size="sm" @click="abrirDialogoEliminar(mesa)" />
      </div>
    </div>

    <q-dialog v-model="dialogoAgregar">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Agregar Nueva Mesa</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="registrarMesa" class="q-gutter-md">
            <q-input
              v-model.number="nuevaMesa.numero"
              type="number"
              label="Número de Mesa"
              :rules="[
                val => !!val || 'El número de mesa es requerido',
                val => val > 0 || 'El número debe ser mayor a 0'
              ]"
            />

            <div class="q-mt-md">
              <q-btn label="Cancelar" @click="cerrarDialogoAgregar" class="q-mr-sm" />
              <q-btn label="Registrar" type="submit" color="primary" :loading="loading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoEliminar">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirmar Eliminación</div>
          <p>¿Estás seguro de que deseas eliminar la mesa {{ mesaAEliminar?.numero }}?</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="cerrarDialogoEliminar" />
          <q-btn
            flat
            label="Eliminar"
            color="negative"
            @click="confirmarEliminarMesa"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { supabase } from 'src/boot/supabase';

export default {
  setup() {
    const $q = useQuasar();
    const loading = ref(false);
    const mesas = ref([]);
    const dialogoAgregar = ref(false);
    const dialogoEliminar = ref(false);
    const mesaAEliminar = ref(null);

    const nuevaMesa = ref({
      numero: null
    });

    onMounted(async () => {
      await cargarMesas();
    });

    async function verificarMesaExistente(numero) {
      try {
        const { data, error } = await supabase
          .from('mesas')
          .select('numero')
          .eq('numero', numero)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return !!data;
      } catch (error) {
        console.error('Error al verificar mesa:', error);
        throw error;
      }
    }

    async function cargarMesas() {
      try {
        loading.value = true;
        const { data, error } = await supabase
          .from('mesas')
          .select('*')
          .order('numero', { ascending: true });

        if (error) throw error;

        mesas.value = data;
      } catch (error) {
        console.error('Error:', error);
        $q.notify({
          color: 'negative',
          message: 'Error al cargar mesas: ' + error.message,
          position: 'top'
        });
      } finally {
        loading.value = false;
      }
    }

    const abrirDialogoAgregar = () => {
      nuevaMesa.value = { numero: null };
      dialogoAgregar.value = true;
    };

    const cerrarDialogoAgregar = () => {
      dialogoAgregar.value = false;
      nuevaMesa.value = { numero: null };
    };

    async function registrarMesa() {
      try {
        if (!nuevaMesa.value.numero) {
          $q.notify({
            color: 'negative',
            message: 'El número de mesa es requerido',
            position: 'top'
          });
          return;
        }

        loading.value = true;

        const mesaExiste = await verificarMesaExistente(nuevaMesa.value.numero);

        if (mesaExiste) {
          $q.notify({
            color: 'negative',
            message: `La mesa número ${nuevaMesa.value.numero} ya existe`,
            position: 'top'
          });
          loading.value = false;
          return;
        }

        const mesaData = {
          numero: nuevaMesa.value.numero,
          estado: 'libre'
        };

        const { error } = await supabase
          .from('mesas')
          .insert([mesaData]);

        if (error) {
          if (error.code === '23505') {
            throw new Error(`La mesa número ${nuevaMesa.value.numero} ya existe`);
          }
          throw error;
        }

        await cargarMesas();
        cerrarDialogoAgregar();
        $q.notify({
          color: 'positive',
          message: 'Mesa registrada exitosamente',
          position: 'top'
        });
      } catch (error) {
        console.error('Error:', error);
        $q.notify({
          color: 'negative',
          message: error.message || 'Error al registrar mesa',
          position: 'top'
        });
      } finally {
        loading.value = false;
      }
    }

    const abrirDialogoEliminar = (mesa) => {
      mesaAEliminar.value = mesa;
      dialogoEliminar.value = true;
    };

    const cerrarDialogoEliminar = () => {
      dialogoEliminar.value = false;
      mesaAEliminar.value = null;
    };

    async function confirmarEliminarMesa() {
      if (!mesaAEliminar.value?.id) return;

      try {
        loading.value = true;
        const { error } = await supabase
          .from('mesas')
          .delete()
          .eq('id', mesaAEliminar.value.id);

        if (error) throw error;

        await cargarMesas();
        cerrarDialogoEliminar();
        $q.notify({
          color: 'positive',
          message: 'Mesa eliminada exitosamente',
          position: 'top'
        });
      } catch (error) {
        console.error('Error:', error);
        $q.notify({
          color: 'negative',
          message: 'Error al eliminar mesa: ' + error.message,
          position: 'top'
        });
      } finally {
        loading.value = false;
      }
    }

    return {
      loading,
      mesas,
      dialogoAgregar,
      dialogoEliminar,
      nuevaMesa,
      mesaAEliminar,
      abrirDialogoAgregar,
      cerrarDialogoAgregar,
      registrarMesa,
      abrirDialogoEliminar,
      cerrarDialogoEliminar,
      confirmarEliminarMesa
    };
  }
};
</script>

<style scoped>
.mesa-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.mesa {
  width: 200px;
  height: 200px;
  background-color: #9CCC65;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s;
}

.mesa.ocupada {
  background-color: #EF5350;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
}
</style>
