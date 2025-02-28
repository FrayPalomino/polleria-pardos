<template>
  <q-dialog v-model="dialogoVisible" persistent>
    <q-card style="width: 400px">
      <q-card-section class="bg-grey-3 row items-center justify-between">
        <div class="text-h6">Mesa N° {{ mesa?.numero }}</div>
        <q-btn dense flat round icon="close" color="red" v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="text-h6 q-mb-md">PEDIDO</div>

        <div class="text-subtitle1 q-mb-sm">PLATOS</div>
        <q-table
          flat
          :rows="detallesPlatos"
          :columns="columnsPlatos"
          hide-pagination
          hide-bottom
          :rows-per-page-options="[0]"
          class="q-mb-md"
        />

        <template v-if="detallesBebidas.length > 0">
          <div class="text-subtitle1 q-mb-sm">BEBIDAS</div>
          <q-table
            flat
            :rows="detallesBebidas"
            :columns="columnsBebidas"
            hide-pagination
            hide-bottom
            :rows-per-page-options="[0]"
          />
        </template>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          color="green"
          class="full-width"
          label="Entregar a la mesa"
          @click="entregarPedido"
          :loading="loading"
        />
      </q-card-actions>
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

const emit = defineEmits(['update:modelValue', 'pedido-entregado']);
const $q = useQuasar();
const loading = ref(false);

const dialogoVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const columnsPlatos = [
  { name: 'plato', label: 'Plato', field: 'nombre', align: 'left' },
  { name: 'porcion', label: 'Porción', field: 'porcion', align: 'center' },
  { name: 'cantidad', label: 'Cantidad', field: 'cantidad', align: 'center' },
];

const columnsBebidas = [
  { name: 'bebida', label: 'Bebida', field: 'nombre', align: 'left' },
  { name: 'tamanio', label: 'Tamaño', field: 'tamanio', align: 'center', format: val => `${val}L` },
  { name: 'cantidad', label: 'Cantidad', field: 'cantidad', align: 'center' },
];

const detallesPlatos = ref([]);
const detallesBebidas = ref([]);

async function cargarDetalles() {
  try {
    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .select(`
        *,
        detalles_pedido (
          plato_id,
          porcion,
          cantidad,
          platos (
            nombre
          )
        ),
        detalles_bebidas_pedido (
          bebida_id,
          cantidad,
          bebidas (
            nombre,
            tamanio
          )
        )
      `)
      .eq('mesa_id', props.mesa.id)
      .eq('estado', 'en_cocina')
      .single();

    if (errorPedido) throw errorPedido;

    if (pedido) {
      detallesPlatos.value = pedido.detalles_pedido.map(detalle => ({
        nombre: detalle.platos.nombre,
        porcion: detalle.porcion,
        cantidad: detalle.cantidad
      }));

      detallesBebidas.value = pedido.detalles_bebidas_pedido.map(detalle => ({
        nombre: detalle.bebidas.nombre,
        tamanio: detalle.bebidas.tamanio,
        cantidad: detalle.cantidad
      }));
    }
  } catch (error) {
    console.error('Error al cargar detalles:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los detalles del pedido'
    });
  }
}

async function entregarPedido() {
  try {
    loading.value = true;

    const { error: errorPedido } = await supabase
      .from('pedidos')
      .update({ estado: 'entregado' })
      .eq('mesa_id', props.mesa.id)
      .eq('estado', 'en_cocina');

    if (errorPedido) throw errorPedido;

    const { error: errorMesa } = await supabase
      .from('mesas')
      .update({ estado: 'ocupado' })
      .eq('id', props.mesa.id);

    if (errorMesa) throw errorMesa;

    $q.notify({
      type: 'positive',
      message: 'Pedido entregado correctamente'
    });

    emit('pedido-entregado');
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Error al entregar pedido:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al entregar el pedido'
    });
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue) {
      await cargarDetalles();
    }
  }
);
</script>

<style scoped>
.q-table {
  background-color: transparent;
}
</style>
