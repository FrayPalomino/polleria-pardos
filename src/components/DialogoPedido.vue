<template>
  <q-dialog v-model="dialogoVisible" persistent>
    <q-card style="width: 400px">
      <q-card-section class="bg-orange text-white row items-center justify-between q-pa-sm">
        <div class="text-h6">Mesa N° {{ mesa?.numero }}</div>
        <q-btn
          dense
          flat
          round
          icon="close"
          color="white"
          @click="emit('update:modelValue', false)"
        />
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
                v-for="porcion in ['1/8', '1/4', '1/2', '1']"
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
                  :disable="cantidadesPlatos[plato.id] <= 1"
                />
                <q-input
                  v-model.number="cantidadesPlatos[plato.id]"
                  type="number"
                  dense
                  outlined
                  style="width: 60px"
                  class="q-mx-sm"
                  min="1"
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
                  :disable="cantidadesBebidas[bebida.id] <= 1"
                />
                <q-input
                  v-model.number="cantidadesBebidas[bebida.id]"
                  type="number"
                  dense
                  outlined
                  style="width: 60px"
                  class="q-mx-sm"
                  min="1"
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
            label="ENVIAR A COCINA"
            :loading="enviando"
            @click="enviarPedido"
            :disable="!hayPedidoPlatos"
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
  modelValue: {
    type: Boolean,
    required: true
  },
  mesa: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'pedido-enviado']);
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

const hayPedidoPlatos = computed(() => {
  return Object.keys(cantidadesPlatos.value).some(key => cantidadesPlatos.value[key] > 0);
});

async function cargarDatos() {
  try {
    loading.value = true;
    const { data: datosPlatos, error: errorPlatos } = await supabase
      .from('platos')
      .select('*')
      .order('nombre');

    if (errorPlatos) throw errorPlatos;

    platos.value = datosPlatos;

    const { data: datosBebidas, error: errorBebidas } = await supabase
      .from('bebidas')
      .select('*')
      .order('nombre');

    if (errorBebidas) throw errorBebidas;

    bebidas.value = datosBebidas;

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
    pedidoActual.value[plato.id] = '';
    cantidadesPlatos.value[plato.id] = 0;
  });

  bebidas.value.forEach(bebida => {
    cantidadesBebidas.value[bebida.id] = 0;
    bebidasSeleccionadas.value[bebida.id] = false;
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
  if (tipo === 'plato' && cantidadesPlatos.value[id] !== undefined) {
    cantidadesPlatos.value[id]++;
  } else if (tipo === 'bebida' && cantidadesBebidas.value[id] !== undefined) {
    cantidadesBebidas.value[id]++;
  }
}

function decrementarCantidad(id, tipo) {
  if (tipo === 'plato' && cantidadesPlatos.value[id] > 1) {
    cantidadesPlatos.value[id]--;
  } else if (tipo === 'bebida' && cantidadesBebidas.value[id] > 1) {
    cantidadesBebidas.value[id]--;
  }
}

async function enviarPedido() {
  try {
    enviando.value = true;

    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .insert({
        mesa_id: props.mesa.id,
        estado: 'en_cocina',
        metodo_pago: null,
        total: 0
      })
      .select()
      .single();

    if (errorPedido) throw errorPedido;

    let totalPedido = 0;

    const detallesPlatos = [];
    for (const [platoId, porcion] of Object.entries(pedidoActual.value)) {
      const cantidad = cantidadesPlatos.value[platoId];
      if (cantidad > 0) {
        const plato = platos.value.find(p => p.id === parseInt(platoId));
        const precioUnitario = plato.precios[porcion];
        const subtotal = precioUnitario * cantidad;

        detallesPlatos.push({
          pedido_id: pedido.id,
          plato_id: parseInt(platoId),
          porcion: porcion,
          cantidad: cantidad,
          precio_unitario: precioUnitario,
          subtotal: subtotal
        });

        totalPedido += subtotal;
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
          pedido_id: pedido.id,
          bebida_id: parseInt(bebidaId),
          cantidad: cantidad,
          precio_unitario: bebida.precio,
          subtotal: subtotal
        });

        totalPedido += subtotal;
      }
    }

    if (detallesBebidas.length > 0) {
      const { error: errorDetallesBebidas } = await supabase
        .from('detalles_bebidas_pedido')
        .insert(detallesBebidas);

      if (errorDetallesBebidas) throw errorDetallesBebidas;
    }

    const { error: errorTotal } = await supabase
      .from('pedidos')
      .update({ total: totalPedido })
      .eq('id', pedido.id);

    if (errorTotal) throw errorTotal;

    const { error: errorMesa } = await supabase
      .from('mesas')
      .update({ estado: 'espera' })
      .eq('id', props.mesa.id);

    if (errorMesa) throw errorMesa;

    $q.notify({
      type: 'positive',
      message: 'Pedido enviado exitosamente'
    });

    emit('pedido-enviado');
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Error al enviar pedido:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al enviar el pedido: ' + (error.message || error.error_description || 'Error desconocido')
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




