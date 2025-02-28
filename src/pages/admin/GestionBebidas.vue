<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Gestión de Bebidas</div>

    <q-btn color="primary" label="Agregar Bebida" icon="add" class="q-mb-md" @click="abrirDialogoAgregar" />

    <q-table
      flat
      bordered
      :rows="bebidas"
      :columns="columnas"
      row-key="id"
      :loading="loading"
    >
      <template v-slot:body-cell-tamanio="props">
        <q-td :props="props">
          {{ props.row.tamanio }}L
        </q-td>
      </template>
      <template v-slot:body-cell-precio="props">
        <q-td :props="props">
          S/ {{ props.row.precio.toFixed(2) }}
        </q-td>
      </template>
      <template v-slot:body-cell-acciones="props">
        <q-td :props="props">
          <q-btn size="sm" color="warning" icon="edit" class="q-mr-sm" @click="editarBebida(props.row)" />
          <q-btn size="sm" color="negative" icon="delete" @click="abrirDialogoEliminar(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogoAgregar">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ modoEdicion ? 'Editar' : 'Agregar Nueva' }} Bebida</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="modoEdicion ? actualizarBebida() : registrarBebida()" class="q-gutter-md">
            <q-input
              v-model="nuevaBebida.nombre"
              label="Nombre de la Bebida"
              :rules="[val => !!val || 'El nombre es requerido']"
            />

            <q-select
              v-model="nuevaBebida.tamanio"
              :options="opcionesTamanio"
              label="Tamaño (Litros)"
              emit-value
              map-options
              :rules="[val => !!val || 'El tamaño es requerido']"
            />

            <q-input
              v-model.number="nuevaBebida.precio"
              type="number"
              label="Precio (S/)"
              step="0.1"
              :rules="[
                val => !!val || 'El precio es requerido',
                val => val > 0 || 'El precio debe ser mayor a 0'
              ]"
            />

            <div class="q-mt-md">
              <q-btn label="Cancelar" @click="cerrarDialogoAgregar" class="q-mr-sm" />
              <q-btn :label="modoEdicion ? 'Actualizar' : 'Registrar'" type="submit" color="primary" :loading="loading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoEliminar">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirmar Eliminación</div>
          <p>¿Estás seguro de que deseas eliminar la bebida "{{ bebidaAEliminar?.nombre }}"?</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="cerrarDialogoEliminar" />
          <q-btn
            flat
            label="Eliminar"
            color="negative"
            @click="confirmarEliminarBebida"
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
    const bebidas = ref([]);
    const dialogoAgregar = ref(false);
    const dialogoEliminar = ref(false);
    const modoEdicion = ref(false);
    const bebidaAEliminar = ref(null);

    const opcionesTamanio = [
      { label: '1.0 L', value: 1.0 },
      { label: '1.5 L', value: 1.5 },
      { label: '2.0 L', value: 2.0 },
      { label: '2.5 L', value: 2.5 },
      { label: '3.0 L', value: 3.0 }
    ];

    const nuevaBebida = ref({
      nombre: '',
      tamanio: null,
      precio: null
    });

    const columnas = [
      { name: 'nombre', label: 'Nombre', align: 'left', field: 'nombre', sortable: true },
      { name: 'tamanio', label: 'Tamaño (Litros)', align: 'right', field: 'tamanio', sortable: true },
      { name: 'precio', label: 'Precio (S/)', align: 'right', field: 'precio', sortable: true },
      {
        name: 'created_at',
        label: 'Fecha de Creación',
        align: 'left',
        field: 'created_at',
        format: (val) => new Date(val).toLocaleString(),
        sortable: true
      },
      { name: 'acciones', label: 'Acciones', align: 'center' }
    ];

    onMounted(async () => {
      await cargarBebidas();
    });

    async function cargarBebidas() {
      try {
        loading.value = true;
        const { data, error } = await supabase
          .from('bebidas')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) throw error;

        bebidas.value = data;
      } catch (error) {
        console.error('Error:', error);
        $q.notify({
          color: 'negative',
          message: 'Error al cargar bebidas: ' + error.message,
          position: 'top'
        });
      } finally {
        loading.value = false;
      }
    }

    const abrirDialogoAgregar = () => {
      modoEdicion.value = false;
      nuevaBebida.value = { nombre: '', tamanio: null, precio: null };
      dialogoAgregar.value = true;
    };

    const cerrarDialogoAgregar = () => {
      dialogoAgregar.value = false;
      nuevaBebida.value = { nombre: '', tamanio: null, precio: null };
      modoEdicion.value = false;
    };

    async function verificarBebidaExistente(nombre, tamanio) {
      try {
        const { data, error } = await supabase
          .from('bebidas')
          .select('id')
          .eq('nombre', nombre)
          .eq('tamanio', tamanio)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return !!data;
      } catch (error) {
        console.error('Error al verificar bebida:', error);
        throw error;
      }
    }

    async function registrarBebida() {
      try {
        if (!nuevaBebida.value.nombre || !nuevaBebida.value.tamanio || !nuevaBebida.value.precio) {
          $q.notify({
            color: 'negative',
            message: 'Todos los campos son requeridos',
            position: 'top'
          });
          return;
        }

        loading.value = true;

        const existe = await verificarBebidaExistente(
          nuevaBebida.value.nombre,
          nuevaBebida.value.tamanio
        );

        if (existe) {
          $q.notify({
            color: 'negative',
            message: `Ya existe ${nuevaBebida.value.nombre} de ${nuevaBebida.value.tamanio}L`,
            position: 'top'
          });
          return;
        }

        const { error } = await supabase
          .from('bebidas')
          .insert([nuevaBebida.value]);

        if (error) {
          if (error.code === '23505') {
            throw new Error(`Ya existe ${nuevaBebida.value.nombre} de ${nuevaBebida.value.tamanio}L`);
          }
          throw error;
        }

        await cargarBebidas();
        cerrarDialogoAgregar();
        $q.notify({
          color: 'positive',
          message: 'Bebida registrada exitosamente',
          position: 'top'
        });
      } catch (error) {
        console.error('Error:', error);
        $q.notify({
          color: 'negative',
          message: error.message || 'Error al registrar bebida',
          position: 'top'
        });
      } finally {
        loading.value = false;
      }
    }

    const editarBebida = (bebida) => {
      modoEdicion.value = true;
      nuevaBebida.value = { ...bebida };
      dialogoAgregar.value = true;
    };

    async function actualizarBebida() {
      try {
        loading.value = true;

        const bebidaActual = bebidas.value.find(b => b.id === nuevaBebida.value.id);
        if (bebidaActual.nombre !== nuevaBebida.value.nombre ||
            bebidaActual.tamanio !== nuevaBebida.value.tamanio) {
          const existe = await verificarBebidaExistente(
            nuevaBebida.value.nombre,
            nuevaBebida.value.tamanio
          );

          if (existe) {
            throw new Error(`Ya existe ${nuevaBebida.value.nombre} de ${nuevaBebida.value.tamanio}L`);
          }
        }

        const { error } = await supabase
          .from('bebidas')
          .update({
            nombre: nuevaBebida.value.nombre,
            tamanio: nuevaBebida.value.tamanio,
            precio: nuevaBebida.value.precio
          })
          .eq('id', nuevaBebida.value.id);

        if (error) {
          if (error.code === '23505') {
            throw new Error(`Ya existe ${nuevaBebida.value.nombre} de ${nuevaBebida.value.tamanio}L`);
          }
          throw error;
        }

        await cargarBebidas();
        cerrarDialogoAgregar();
        $q.notify({
          color: 'positive',
          message: 'Bebida actualizada exitosamente'
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Error al actualizar bebida: ' + error.message
        });
      } finally {
        loading.value = false;
      }
    }

    const abrirDialogoEliminar = (bebida) => {
      bebidaAEliminar.value = bebida;
      dialogoEliminar.value = true;
    };

    const cerrarDialogoEliminar = () => {
      dialogoEliminar.value = false;
      bebidaAEliminar.value = null;
    };

    async function confirmarEliminarBebida() {
      if (!bebidaAEliminar.value?.id) return;

      try {
        loading.value = true;
        const { error } = await supabase
          .from('bebidas')
          .delete()
          .eq('id', bebidaAEliminar.value.id);

        if (error) throw error;

        await cargarBebidas();
        cerrarDialogoEliminar();
        $q.notify({
          color: 'positive',
          message: 'Bebida eliminada exitosamente'
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Error al eliminar bebida: ' + error.message
        });
      } finally {
        loading.value = false;
      }
    }

    return {
      loading,
      bebidas,
      columnas,
      dialogoAgregar,
      dialogoEliminar,
      nuevaBebida,
      bebidaAEliminar,
      modoEdicion,
      opcionesTamanio,
      abrirDialogoAgregar,
      cerrarDialogoAgregar,
      registrarBebida,
      editarBebida,
      actualizarBebida,
      abrirDialogoEliminar,
      cerrarDialogoEliminar,
      confirmarEliminarBebida
    };
  }
};
</script>
