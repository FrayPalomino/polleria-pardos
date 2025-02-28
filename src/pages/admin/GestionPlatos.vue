<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md text-h5">Gestión de Platos</div>

    <div class="q-mb-xl text-center">
      <q-btn color="primary" label="Agregar Plato" icon="add" class="q-mb-lg" @click="abrirDialogoPlato" />
    </div>

    <div class="row justify-center q-col-gutter-md">
      <q-card v-for="plato in platos" :key="plato.id" class="col-12 col-md-5 q-pa-md" style="margin-bottom: 32px;">
        <div class="row items-center">
          <div class="col-12">
            <div class="text-center text-h6">{{ plato.nombre }}</div>
            <q-list bordered separator class="q-pt-md">
              <q-item v-for="(precio, porcion) in plato.precios" :key="porcion">
                <q-item-section>
                  <q-item-label>{{ porcion }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label>S/ {{ precio }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <q-card-actions align="right">
              <q-btn flat color="warning" icon="edit" @click="editarPlato(plato)" />
              <q-btn flat color="negative" icon="delete" @click="confirmarEliminar(plato)" />
            </q-card-actions>
          </div>
        </div>
      </q-card>
    </div>

    <q-dialog v-model="dialogoPlato" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ modoEdicion ? 'Editar' : 'Agregar' }} Plato</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="guardarPlato" class="q-gutter-md">
            <q-input
              v-model="platoActual.nombre"
              label="Nombre del Plato"
              :rules="[val => !!val || 'El nombre es requerido']"
            />

            <div v-for="(precio, porcion) in platoActual.precios" :key="porcion" class="row q-gutter-sm">
              <q-input
                v-model="preciosPorciones[porcion]"
                :label="porcion"
                type="number"
                class="col"
                :rules="[val => val > 0 || 'El precio debe ser mayor a 0']"
              />
              <q-btn
                flat
                round
                color="negative"
                icon="remove"
                @click="eliminarPorcion(porcion)"
              />
            </div>

            <div class="row q-gutter-sm">
              <q-input
                v-model="nuevaPorcion.nombre"
                label="Nueva Porción"
                class="col"
              />
              <q-input
                v-model.number="nuevaPorcion.precio"
                label="Precio"
                type="number"
                class="col"
              />
              <q-btn
                flat
                round
                color="positive"
                icon="add"
                @click="agregarPorcion"
                :disable="!nuevaPorcion.nombre || !nuevaPorcion.precio"
              />
            </div>

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancelar" color="negative" v-close-popup @click="cerrarDialogo" />
              <q-btn :label="modoEdicion ? 'Actualizar' : 'Guardar'" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoConfirmar">
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm">¿Estás seguro de que deseas eliminar "{{ platoAEliminar?.nombre }}"?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="eliminarPlato" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { supabase } from 'src/boot/supabase';

const $q = useQuasar();
const platos = ref([]);
const dialogoPlato = ref(false);
const dialogoConfirmar = ref(false);
const modoEdicion = ref(false);
const platoAEliminar = ref(null);

const platoActual = ref({
  nombre: '',
  precios: {}
});

const preciosPorciones = ref({});
const nuevaPorcion = ref({
  nombre: '',
  precio: null
});

onMounted(async () => {
  try {
    await cargarPlatos();
  } catch (error) {
    console.error('Error de conexión:', error);
    $q.notify({
      color: 'negative',
      message: 'Error de conexión con la base de datos',
      position: 'top',
      timeout: 5000
    });
  }
});

async function cargarPlatos() {
  try {
    const { data, error } = await supabase
      .from('platos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    platos.value = data || [];
  } catch (error) {
    console.error('Error al cargar platos:', error);
    $q.notify({
      color: 'negative',
      message: 'Error al cargar los platos: ' + error.message,
      position: 'top'
    });
  }
}

function cerrarDialogo() {
  dialogoPlato.value = false;
  platoActual.value = {
    nombre: '',
    precios: {}
  };
  preciosPorciones.value = {};
  nuevaPorcion.value = {
    nombre: '',
    precio: null
  };
}

function abrirDialogoPlato() {
  modoEdicion.value = false;
  const preciosIniciales = {
    "1": "65",
    "1/2": "33",
    "1/4": "16",
    "1/8": "11"
  };

  platoActual.value = {
    nombre: '',
    precios: preciosIniciales
  };

  preciosPorciones.value = { ...preciosIniciales };
  dialogoPlato.value = true;
}

function editarPlato(plato) {
  modoEdicion.value = true;
  platoActual.value = JSON.parse(JSON.stringify(plato));
  preciosPorciones.value = { ...plato.precios };
  dialogoPlato.value = true;
}

function agregarPorcion() {
  if (nuevaPorcion.value.nombre && nuevaPorcion.value.precio) {
    platoActual.value.precios[nuevaPorcion.value.nombre] = nuevaPorcion.value.precio;
    preciosPorciones.value[nuevaPorcion.value.nombre] = nuevaPorcion.value.precio;
    nuevaPorcion.value = { nombre: '', precio: null };
  }
}

function eliminarPorcion(porcion) {
  delete platoActual.value.precios[porcion];
  delete preciosPorciones.value[porcion];
}

async function guardarPlato() {
  try {
    if (!platoActual.value.nombre?.trim()) {
      $q.notify({
        color: 'negative',
        message: 'El nombre del plato es requerido',
        position: 'top'
      });
      return;
    }

    if (Object.keys(preciosPorciones.value).length === 0) {
      $q.notify({
        color: 'negative',
        message: 'Debe agregar al menos una porción con precio',
        position: 'top'
      });
      return;
    }

    const preciosNumericos = {};
    for (const [porcion, precio] of Object.entries(preciosPorciones.value)) {
      const precioNumerico = Number(precio);
      if (isNaN(precioNumerico) || precioNumerico <= 0) {
        $q.notify({
          color: 'negative',
          message: `El precio para ${porcion} debe ser un número válido mayor a 0`,
          position: 'top'
        });
        return;
      }
      preciosNumericos[porcion] = precioNumerico;
    }

    const platoData = {
      nombre: platoActual.value.nombre.trim(),
      precios: preciosNumericos
    };

    let error;
    if (modoEdicion.value) {
      const { error: updateError } = await supabase
        .from('platos')
        .update(platoData)
        .eq('id', platoActual.value.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('platos')
        .insert([platoData]);
      error = insertError;
    }

    if (error) throw error;

    await cargarPlatos();
    cerrarDialogo();

    $q.notify({
      color: 'positive',
      message: modoEdicion.value ? 'Plato actualizado exitosamente' : 'Plato agregado exitosamente',
      position: 'top'
    });

  } catch (error) {
    console.error('Error al guardar plato:', error);
    $q.notify({
      color: 'negative',
      message: `Error al guardar el plato: ${error.message}`,
      position: 'top',
      timeout: 5000
    });
  }
}

function confirmarEliminar(plato) {
  platoAEliminar.value = plato;
  dialogoConfirmar.value = true;
}

async function eliminarPlato() {
  try {
    if (!platoAEliminar.value?.id) {
      throw new Error('ID de plato no válido');
    }

    const { error } = await supabase
      .from('platos')
      .delete()
      .eq('id', platoAEliminar.value.id);

    if (error) throw error;

    await cargarPlatos();
    dialogoConfirmar.value = false;
    platoAEliminar.value = null;

    $q.notify({
      color: 'positive',
      message: 'Plato eliminado exitosamente',
      position: 'top'
    });
  } catch (error) {
    console.error('Error al eliminar plato:', error);
    $q.notify({
      color: 'negative',
      message: 'Error al eliminar el plato: ' + error.message,
      position: 'top'
    });
  }
}
</script>
