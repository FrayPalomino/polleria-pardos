<template>
  <q-dialog v-model="dialogoVisible" persistent>
    <q-card style="width: 400px">
      <q-card-section class="bg-grey-3 row items-center justify-between">
        <div class="text-h6">Mesa N° {{ mesa?.numero }}</div>
        <q-btn dense flat round icon="close" color="red" v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="text-h6 q-mb-md">DETALLES</div>

        <div class="text-subtitle1 q-mb-sm">PLATOS</div>
        <q-table
          flat
          :rows="detallesPlatos"
          :columns="columnsPlatos"
          hide-pagination
          hide-bottom
          :rows-per-page-options="[0]"
        />

        <div v-if="detallesBebidas.length > 0" class="q-mt-md">
          <div class="text-subtitle1 q-mb-sm">BEBIDAS</div>
          <q-table
            flat
            :rows="detallesBebidas"
            :columns="columnsBebidas"
            hide-pagination
            hide-bottom
            :rows-per-page-options="[0]"
          />
        </div>

        <div class="text-h6 q-mt-md">TOTAL: S/ {{ total.toFixed(2) }}</div>

        <div class="q-mt-md">
          <div class="text-subtitle1">Pago con:</div>
          <div class="row q-gutter-md q-mt-sm">
            <q-btn
              :color="metodoPago === 'efectivo' ? 'primary' : 'grey'"
              label="EFECTIVO"
              @click="metodoPago = 'efectivo'"
            />
            <q-btn
              :color="metodoPago === 'yape' ? 'primary' : 'grey'"
              label="YAPE"
              @click="metodoPago = 'yape'"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          color="green"
          class="full-width"
          label="Liberar Mesa"
          @click="procesarPago"
          :loading="loading"
          :disable="!metodoPago"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="mostrarTicket">
    <q-card class="ticket-card">
      <q-btn
        icon="close"
        flat
        round
        class="absolute-top-right q-ma-sm"
        color="grey-7"
        v-close-popup
      />

      <div class="ticket">
        <div class="header">
          <q-img
            src="~assets/logo.svg"
            class="logo q-mx-auto"
            width="60px"
          />
          <h1 class="company-name">Polleria PARDOS</h1>
          <p class="details">Av. Fernando Belaúnde Terry S/N</p>
        </div>

        <div class="details">
          <p>Fecha: {{ fechaActual }}</p>
          <p>Hora: {{ horaActual }}</p>
          <p>Mesa N°: {{ mesa?.numero }}</p>
        </div>

        <div class="divider"></div>

        <table class="items">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio u.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in detallesPlatos" :key="item.nombre + item.porcion">
              <td>{{ item.nombre }} ({{ item.porcion }})</td>
              <td>{{ item.cantidad }}</td>
              <td>S/ {{ item.precioUnitario.toFixed(2) }}</td>
              <td>S/ {{ item.subtotal.toFixed(2) }}</td>
            </tr>
            <tr v-for="item in detallesBebidas" :key="item.nombre + item.tamanio">
              <td>{{ item.nombre }} ({{ item.tamanio }}L)</td>
              <td>{{ item.cantidad }}</td>
              <td>S/ {{ item.precioUnitario.toFixed(2) }}</td>
              <td>S/ {{ item.subtotal.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="total">
          <p>TOTAL S/. {{ total.toFixed(2) }}</p>
          <p class="metodo-pago">Método de pago: {{ metodoPago?.toUpperCase() }}</p>
        </div>

        <div class="footer">
          <p><strong>Muchas gracias por su visita</strong></p>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { supabase } from 'src/boot/supabase';
import { date } from 'quasar';

const props = defineProps({
  modelValue: Boolean,
  mesa: Object,
});

const emit = defineEmits(['update:modelValue', 'pago-completado']);
const $q = useQuasar();
const loading = ref(false);
const metodoPago = ref(null);
const total = ref(0);
const mostrarTicket = ref(false);
const nombreMesero = ref('');

const dialogoVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const fechaActual = computed(() => {
  return date.formatDate(Date.now(), 'DD-MM-YYYY');
});

const horaActual = computed(() => {
  return date.formatDate(Date.now(), 'HH:mm:ss');
});

const columnsPlatos = [
  { name: 'plato', label: 'Plato', field: 'nombre', align: 'left' },
  { name: 'porcion', label: 'Porción', field: 'porcion', align: 'center' },
  { name: 'cantidad', label: 'Cantidad', field: 'cantidad', align: 'center' },
  { name: 'precio', label: 'Precio', field: 'precioUnitario', format: val => `S/ ${val.toFixed(2)}`, align: 'right' },
  { name: 'subtotal', label: 'Subtotal', field: 'subtotal', format: val => `S/ ${val.toFixed(2)}`, align: 'right' },
];

const columnsBebidas = [
  { name: 'bebida', label: 'Bebida', field: 'nombre', align: 'left' },
  { name: 'tamanio', label: 'Tamaño', field: 'tamanio', format: val => `${val}L`, align: 'center' },
  { name: 'cantidad', label: 'Cantidad', field: 'cantidad', align: 'center' },
  { name: 'precio', label: 'Precio', field: 'precioUnitario', format: val => `S/ ${val.toFixed(2)}`, align: 'right' },
  { name: 'subtotal', label: 'Subtotal', field: 'subtotal', format: val => `S/ ${val.toFixed(2)}`, align: 'right' },
];

const detallesPlatos = ref([]);
const detallesBebidas = ref([]);

async function cargarDetalles() {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        detalles_pedido (
          plato_id,
          porcion,
          cantidad,
          precio_unitario,
          subtotal,
          platos (
            nombre
          )
        ),
        detalles_bebidas_pedido (
          bebida_id,
          cantidad,
          precio_unitario,
          subtotal,
          bebidas (
            nombre,
            tamanio
          )
        )
      `)
      .eq('mesa_id', props.mesa.id)
      .in('estado', ['entregado', 'en_cocina']);

    if (error) throw error;

    if (data) {
      const platosAgrupados = {};
      const bebidasAgrupadas = {};
      let totalGeneral = 0;

      data.forEach(pedido => {
        pedido.detalles_pedido.forEach(detalle => {
          const key = `${detalle.platos.nombre}-${detalle.porcion}`;
          if (!platosAgrupados[key]) {
            platosAgrupados[key] = {
              nombre: detalle.platos.nombre,
              porcion: detalle.porcion,
              cantidad: 0,
              precioUnitario: detalle.precio_unitario,
              subtotal: 0
            };
          }
          platosAgrupados[key].cantidad += detalle.cantidad;
          platosAgrupados[key].subtotal += detalle.subtotal;
        });

        pedido.detalles_bebidas_pedido.forEach(detalle => {
          const key = `${detalle.bebidas.nombre}-${detalle.bebidas.tamanio}`;
          if (!bebidasAgrupadas[key]) {
            bebidasAgrupadas[key] = {
              nombre: detalle.bebidas.nombre,
              tamanio: detalle.bebidas.tamanio,
              cantidad: 0,
              precioUnitario: detalle.precio_unitario,
              subtotal: 0
            };
          }
          bebidasAgrupadas[key].cantidad += detalle.cantidad;
          bebidasAgrupadas[key].subtotal += detalle.subtotal;
        });

        totalGeneral += pedido.total;
      });

      detallesPlatos.value = Object.values(platosAgrupados);
      detallesBebidas.value = Object.values(bebidasAgrupadas);
      total.value = totalGeneral;
      nombreMesero.value = data[0]?.mesero || 'Mesero';
    }
  } catch (error) {
    console.error('Error al cargar detalles:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los detalles del pedido'
    });
  }
}

async function procesarPago() {
  try {
    loading.value = true;

    const { error: errorPedido } = await supabase
      .from('pedidos')
      .update({
        estado: 'pagado',
        metodo_pago: metodoPago.value
      })
      .eq('mesa_id', props.mesa.id)
      .in('estado', ['entregado', 'en_cocina']);

    if (errorPedido) throw errorPedido;

    const { error: errorMesa } = await supabase
      .from('mesas')
      .update({ estado: 'libre' })
      .eq('id', props.mesa.id);

    if (errorMesa) throw errorMesa;

    mostrarTicket.value = true;
    dialogoVisible.value = false;

    $q.notify({
      type: 'positive',
      message: 'Pago procesado correctamente'
    });

  } catch (error) {
    console.error('Error al procesar pago:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al procesar el pago'
    });
  } finally {
    loading.value = false;
  }
}

watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    metodoPago.value = null;
    mostrarTicket.value = false;
    await cargarDetalles();
  }
});

watch(() => mostrarTicket.value, (newValue) => {
  if (!newValue) {
    emit('pago-completado');
  }
});
</script>

<style scoped>
.ticket-card {
  background: transparent;
  box-shadow: none;
}

.ticket {
  background: white;
  width: 300px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  margin: 20px;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  display: block;
  margin-bottom: 10px;
}

.company-name {
  font-size: 1.2em;
  margin: 5px 0;
  color: #333;
}

.details {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.details p {
  margin: 5px 0;
}

.divider {
  border-top: 1px dashed #ccc;
  margin: 15px 0;
}

.items {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  font-size: 0.9em;
}

.items th {
  text-align: left;
  color: #666;
  font-weight: normal;
  padding: 5px 0;
}

.items td {
  padding: 5px 0;
}

.total {
  text-align: right;
  margin: 15px 0;
  font-weight: bold;
}

.metodo-pago {
  font-size: 0.9em;
  color: #666;
  font-weight: normal;
}

.footer {
  text-align: center;
  font-size: 0.85em;
  color: #666;
  margin-top: 20px;
}
</style>
