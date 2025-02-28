<template>
  <q-dialog v-model="dialogoVisible" persistent>
    <q-card style="width: 400px">
      <q-card-section class="bg-orange text-white row items-center justify-between q-pa-sm">
        <div class="text-h6">Mesa N° {{ mesa?.numero }} (Pedido adicional)</div>
        <q-btn dense flat round icon="close" color="white" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-md" v-if="loading">
        <div class="flex flex-center">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </q-card-section>

      <template v-else>
        <q-card-section class="q-pa-md">
          <div class="text-h6 q-mb-md">PLATOS</div>
          <div v-for="plato in platos" :key="plato.id" class="q-mb-lg">
            <div class="text-subtitle1 q-mb-sm">{{ plato.nombre }}</div>
            <div class="q-gutter-y-sm">
              <q-radio
                v-model="pedidoActual[plato.id]"
                v-for="porcion in Object.keys(plato.precios)"
                :key="porcion"
                :val="porcion"
                :label="porcion + ' de Pollo'"
                color="primary"
                class="full-width"
                @update:model-value="inicializarCantidadPlato(plato.id)"
              />

              <div class="row items-center justify-end q-mt-sm" v-if="pedidoActual[plato.id]">
                <q-btn
                  flat
                  dense
                  round
                  icon="remove"
                  @click="decrementarCantidad(plato.id, 'plato')"
                  :disable="cantidadesPlatos[plato.id] <= 0"
                />
                <q-input
                  v-model.number="cantidadesPlatos[plato.id]"
                  type="number"
                  dense
                  outlined
                  style="width: 60px"
                  class="q-mx-sm"
                  min="0"
                />
                <q-btn
                  flat
                  dense
                  round
                  icon="add"
                  @click="incrementarCantidad(plato.id, 'plato')"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-h6 q-mb-md">BEBIDAS</div>
          <div v-for="bebida in bebidas" :key="bebida.id" class="q-mb-md">
            <div class="row items-center justify-between">
              <q-checkbox
                v-model="bebidasSeleccionadas[bebida.id]"
                :label="`${bebida.tamanio} lts. ${bebida.nombre}`"
                color="primary"
                @update:model-value="inicializarCantidadBebida(bebida.id)"
              />
              <div class="row items-center" v-if="bebidasSeleccionadas[bebida.id]">
                <q-btn
                  flat
                  dense
                  round
                  icon="remove"
                  @click="decrementarCantidad(bebida.id, 'bebida')"
                  :disable="cantidadesBebidas[bebida.id] <= 0"
                />
                <q-input
                  v-model.number="cantidadesBebidas[bebida.id]"
                  type="number"
                  dense
                  outlined
                  style="width: 60px"
                  class="q-mx-sm"
                  min="0"
                />
                <q-btn
                  flat
                  dense
                  round
                  icon="add"
                  @click="incrementarCantidad(bebida.id, 'bebida')"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pa-none">
          <q-btn
            class="full-width"
            color="green"
            label="AGREGAR A PEDIDO"
            :loading="enviando"
            @click="enviarPedidoAdicional"
            :disable="!hayPedidoAdicional"
          />
        </q-card-section>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { supabase } from 'src/boot/supabase';

const props = defineProps({
  modelValue: Boolean,
  mesa: Object,
});

const emit = defineEmits(['update:modelValue', 'pedido-adicional-enviado']);
const $q = useQuasar();

const dialogoVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const platos = ref([]);
const bebidas = ref([]);
const loading = ref(true);
const enviando = ref(false);
const pedidoActual = ref({});
const cantidadesPlatos = ref({});
const cantidadesBebidas = ref({});
const bebidasSeleccionadas = ref({});

const hayPedidoAdicional = computed(() => {
  return Object.values(cantidadesPlatos.value).some(cantidad => cantidad > 0) ||
         Object.values(cantidadesBebidas.value).some(cantidad => cantidad > 0);
});

async function cargarDatos() {
  try {
    loading.value = true;
    const [platosResponse, bebidasResponse] = await Promise.all([
      supabase.from('platos').select('*').order('nombre'),
      supabase.from('bebidas').select('*').order('nombre')
    ]);

    if (platosResponse.error) throw platosResponse.error;
    if (bebidasResponse.error) throw bebidasResponse.error;

    platos.value = platosResponse.data;
    bebidas.value = bebidasResponse.data;

    resetearPedido();
  } catch (error) {
    console.error('Error al cargar datos:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al cargar el menú'
    });
  } finally {
    loading.value = false;
  }
}

function resetearPedido() {
  pedidoActual.value = {};
  cantidadesPlatos.value = {};
  cantidadesBebidas.value = {};
  bebidasSeleccionadas.value = {};

  platos.value.forEach(plato => {
    pedidoActual.value[plato.id] = Object.keys(plato.precios)[0];
    cantidadesPlatos.value[plato.id] = 0;
  });

  bebidas.value.forEach(bebida => {
    bebidasSeleccionadas.value[bebida.id] = false;
    cantidadesBebidas.value[bebida.id] = 0;
  });
}

function inicializarCantidadPlato(platoId) {
  if (pedidoActual.value[platoId] && cantidadesPlatos.value[platoId] === 0) {
    cantidadesPlatos.value[platoId] = 1;
  }
}

function inicializarCantidadBebida(bebidaId) {
  if (bebidasSeleccionadas.value[bebidaId]) {
    cantidadesBebidas.value[bebidaId] = 1;
  } else {
    cantidadesBebidas.value[bebidaId] = 0;
  }
}

function incrementarCantidad(id, tipo) {
  if (tipo === 'plato') {
    cantidadesPlatos.value[id]++;
  } else if (tipo === 'bebida') {
    cantidadesBebidas.value[id]++;
  }
}

function decrementarCantidad(id, tipo) {
  if (tipo === 'plato' && cantidadesPlatos.value[id] > 0) {
    cantidadesPlatos.value[id]--;
  } else if (tipo === 'bebida' && cantidadesBebidas.value[id] > 0) {
    cantidadesBebidas.value[id]--;
  }
}

async function enviarPedidoAdicional() {
  try {
    enviando.value = true;

    const { data: nuevoPedido, error: errorNuevoPedido } = await supabase
      .from('pedidos')
      .insert({
        mesa_id: props.mesa.id,
        estado: 'en_cocina',
        total: 0
      })
      .select()
      .single();

    if (errorNuevoPedido) throw errorNuevoPedido;

    let totalAdicional = 0;

    const detallesPlatos = [];
    for (const [platoId, porcion] of Object.entries(pedidoActual.value)) {
      const cantidad = cantidadesPlatos.value[platoId];
      if (cantidad > 0) {
        const plato = platos.value.find(p => p.id === parseInt(platoId));
        const precioUnitario = plato.precios[porcion];
        const subtotal = precioUnitario * cantidad;

        detallesPlatos.push({
          pedido_id: nuevoPedido.id,
          plato_id: parseInt(platoId),
          porcion: porcion,
          cantidad: cantidad,
          precio_unitario: precioUnitario,
          subtotal: subtotal
        });

        totalAdicional += subtotal;
      }
    }

    if (detallesPlatos.length > 0) {
      const { error: errorDetallesPlatos } = await supabase
        .from('detalles_pedido')
        .insert(detallesPlatos);

      if (errorDetallesPlatos) throw errorDetallesPlatos;
    }

    const detallesBebidas = [];
    for (const [bebidaId, seleccionada] of Object.entries(bebidasSeleccionadas.value)) {
      if (seleccionada && cantidadesBebidas.value[bebidaId] > 0) {
        const bebida = bebidas.value.find(b => b.id === parseInt(bebidaId));
        const cantidad = cantidadesBebidas.value[bebidaId];
        const subtotal = bebida.precio * cantidad;

        detallesBebidas.push({
          pedido_id: nuevoPedido.id,
          bebida_id: parseInt(bebidaId),
          cantidad: cantidad,
          precio_unitario: bebida.precio,
          subtotal: subtotal
        });

        totalAdicional += subtotal;
      }
    }

    if (detallesBebidas.length > 0) {
      const { error: errorDetallesBebidas } = await supabase
        .from('detalles_bebidas_pedido')
        .insert(detallesBebidas);

      if (errorDetallesBebidas) throw errorDetallesBebidas;
    }

    const { error: errorActualizacion } = await supabase
      .from('pedidos')
      .update({ total: totalAdicional })
      .eq('id', nuevoPedido.id);

    if (errorActualizacion) throw errorActualizacion;

    $q.notify({
      type: 'positive',
      message: 'Pedido adicional enviado a cocina exitosamente'
    });

    emit('pedido-adicional-enviado');
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Error al enviar pedido adicional:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al enviar el pedido adicional: ' + (error.message || error.error_description || 'Error desconocido')
    });
  } finally {
    enviando.value = false;
  }
}

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    cargarDatos();
  }
});

watch(pedidoActual, (newValue, oldValue) => {
  for (const platoId in newValue) {
    if (newValue[platoId] && (!oldValue[platoId] || newValue[platoId] !== oldValue[platoId])) {
      cantidadesPlatos.value[platoId] = 1;
    }
  }
}, { deep: true });

watch(bebidasSeleccionadas, (newValue, oldValue) => {
  for (const bebidaId in newValue) {
    if (newValue[bebidaId] && !oldValue[bebidaId]) {
      cantidadesBebidas.value[bebidaId] = 1;
    }
  }
}, { deep: true });
</script>

<style scoped>
.q-radio {
  margin: 8px 0;
}
</style>
