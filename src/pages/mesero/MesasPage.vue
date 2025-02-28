<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-center q-mb-md">Estado de Mesas</div>

    <div v-if="loading" class="flex flex-center q-pa-lg">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <template v-else>
      <div v-if="error" class="text-center q-pa-md">
        <q-banner class="bg-negative text-white">
          {{ error }}
          <template v-slot:action>
            <q-btn flat color="white" label="Reintentar" @click="cargarMesas" />
          </template>
        </q-banner>
      </div>

      <div class="mesas-container q-mx-auto">
        <mesa-card
          v-for="mesa in mesas"
          :key="mesa.id"
          :mesa="mesa"
          @click="seleccionarMesa(mesa)"
        />
      </div>
    </template>

    <DialogoPedido
      v-model="dialogoPedido"
      :mesa="mesaSeleccionada"
      @pedido-enviado="actualizarMesaEstado('espera')"
    />

    <DialogoEntrega
      v-model="dialogoEntrega"
      :mesa="mesaSeleccionada"
      @pedido-entregado="actualizarMesaEstado('ocupado')"
    />

    <DialogoOcupado
      v-model="dialogoOcupado"
      :mesa="mesaSeleccionada"
      @seleccionar-accion="manejarAccionMesaOcupada"
    />

    <DialogoExtra
      v-model="dialogoExtra"
      :mesa="mesaSeleccionada"
      @pedido-adicional-enviado="actualizarMesaEstado('espera')"
    />

    <DialogoEntregaExtra
      v-model="dialogoEntregaExtra"
      :mesa="mesaSeleccionada"
      @pedido-extra-entregado="actualizarMesaEstado('ocupado')"
    />

    <DialogoPago
      v-model="dialogoPago"
      :mesa="mesaSeleccionada"
      @pago-procesado="actualizarMesaEstado('libre')"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { supabase } from 'src/boot/supabase';
import MesaCard from 'src/components/MesaCard.vue';
import DialogoPedido from 'src/components/DialogoPedido.vue';
import DialogoEntrega from 'src/components/DialogoEntrega.vue';
import DialogoOcupado from 'src/components/DialogoOcupado.vue';
import DialogoExtra from 'src/components/DialogoExtra.vue';
import DialogoEntregaExtra from 'src/components/DialogoEntregaExtra.vue';
import DialogoPago from 'src/components/DialogoPago.vue';

const $q = useQuasar();
const mesas = ref([]);
const dialogoPedido = ref(false);
const dialogoEntrega = ref(false);
const dialogoOcupado = ref(false);
const dialogoExtra = ref(false);
const dialogoEntregaExtra = ref(false);
const dialogoPago = ref(false);
const mesaSeleccionada = ref(null);
const loading = ref(true);
const error = ref(null);

let subscription;

onMounted(() => {
  cargarMesas();
  iniciarSuscripcion();
});

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe();
  }
});

async function cargarMesas() {
  loading.value = true;
  error.value = null;

  try {
    const { data, error: supaError } = await supabase
      .from('mesas')
      .select('*')
      .order('numero');

    if (supaError) throw supaError;
    mesas.value = data || [];
  } catch (err) {
    console.error('Error al cargar mesas:', err);
    error.value = 'Error al cargar las mesas. Por favor, intente nuevamente.';
    $q.notify({
      type: 'negative',
      message: 'Error al cargar las mesas',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
}

function iniciarSuscripcion() {
  subscription = supabase
    .channel('mesas-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'mesas' },
      (payload) => {
        console.log('Cambio en mesas:', payload);
        cargarMesas();
      }
    )
    .subscribe();
}

function seleccionarMesa(mesa) {
  mesaSeleccionada.value = mesa;

  switch (mesa.estado) {
    case 'libre':
      dialogoPedido.value = true;
      break;
    case 'espera':
      dialogoEntrega.value = true;
      break;
    case 'ocupado':
      dialogoOcupado.value = true;
      break;
  }
}

function manejarAccionMesaOcupada(accion) {
  if (accion === 'agregar') {
    dialogoExtra.value = true;
  } else if (accion === 'pagar') {
    dialogoPago.value = true;
  }
}

async function actualizarMesaEstado(nuevoEstado) {
  try {
    const { error: updateError } = await supabase
      .from('mesas')
      .update({ estado: nuevoEstado })
      .eq('id', mesaSeleccionada.value.id);

    if (updateError) throw updateError;

    await cargarMesas();

    dialogoPedido.value = false;
    dialogoEntrega.value = false;
    dialogoOcupado.value = false;
    dialogoExtra.value = false;
    dialogoEntregaExtra.value = false;
    dialogoPago.value = false;

    /*if (nuevoEstado === 'espera' && mesaSeleccionada.value.estado === 'ocupado') {
      dialogoEntregaExtra.value = true;
    }*/

  } catch (err) {
    console.error('Error al actualizar estado de la mesa:', err);
    $q.notify({
      type: 'negative',
      message: 'Error al actualizar el estado de la mesa',
      position: 'top'
    });
  }
}
</script>

<style scoped>
.mesas-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 800px;
  padding: 1rem;
  margin: 0 auto;
}

@media (max-width: 599px) {
  .mesas-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 600px) and (max-width: 1023px) {
  .mesas-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .mesas-container {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
