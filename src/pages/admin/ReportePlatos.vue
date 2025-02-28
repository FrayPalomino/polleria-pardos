<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Reporte - Venta de Platos</div>

    <div class="row q-col-gutter-md q-mb-md items-center">
      <div class="col-12 col-md-4">
        <q-input
          v-model="fechaSeleccionada"
          filled
          dense
          label="Selecciona una fecha"
        >
          <template v-slot:prepend>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="fechaSeleccionada" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
    </div>

    <template v-if="!error">
      <q-card class="q-mb-md" v-if="ventasFiltradas.length > 0">
        <q-card-section>
          <div class="text-h6">Resumen del Mes</div>
          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-12 col-md-3">
              <div class="text-subtitle2">Platos Vendidos</div>
              <div class="text-h5 text-positive">{{ totalPlatosVendidos }}</div>
            </div>
            <div class="col-12 col-md-3">
              <div class="text-subtitle2">Ingresos Totales</div>
              <div class="text-h5 text-primary">{{ formatCurrency(totalIngresos) }}</div>
            </div>
            <div class="col-12 col-md-3">
              <div class="text-subtitle2">Plato Más Vendido</div>
              <div class="text-h5 text-secondary">{{ platoMasVendido.porcion }}</div>
              <div class="text-caption">Cantidad: {{ platoMasVendido.cantidad }}</div>
            </div>
            <div class="col-12 col-md-3">
              <div class="text-subtitle2">Promedio Venta Diaria</div>
              <div class="text-h5 text-info">{{ formatCurrency(promedioVentaDiaria) }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <h5 class="text-center q-mb-md">Reporte del Día</h5>

      <q-table
        :rows="ventasDelDia"
        :columns="columns"
        row-key="fecha"
        separator="cell"
        bordered
        flat
        :loading="loading"
      >
        <template v-slot:loading>
          <q-inner-loading showing color="primary">
            <q-spinner-dots size="50px" />
          </q-inner-loading>
        </template>


        <template v-slot:body-cell-totalPrecio="props">
          <q-td :props="props">
            <strong>{{ formatCurrency(props.row.totalPrecio) }}</strong>
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="full-width row flex-center q-pa-md text-grey-8">
            No hay ventas registradas para esta fecha
          </div>
        </template>
      </q-table>
    </template>

    <div v-else class="text-center q-pa-md">
      <q-icon name="error" color="negative" size="50px" />
      <p class="text-negative text-body1">Error al cargar los datos de ventas</p>
      <q-btn color="primary" icon="refresh" label="Reintentar" @click="cargarVentas" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { date } from 'quasar';
import { supabase } from 'src/boot/supabase';

const loading = ref(false);
const error = ref(false);
const ventas = ref([]);
const fechaSeleccionada = ref(date.formatDate(new Date(), 'YYYY-MM-DD'));

const columns = [
  { name: '1/8', label: '1/8 de Pollo', align: 'center', field: '1/8' },
  { name: '1/4', label: '1/4 de Pollo', align: 'center', field: '1/4' },
  { name: '1/2', label: '1/2 Pollo', align: 'center', field: '1/2' },
  { name: '1', label: 'Pollo Entero', align: 'center', field: '1' },
  { name: 'totalPlatos', label: 'Total Platos', align: 'center', field: 'totalPlatos' },
  { name: 'totalPrecio', label: 'Total (S/)', align: 'right', field: 'totalPrecio' }
];

async function cargarVentas() {
  loading.value = true;
  error.value = false;
  try {
    const fecha = new Date(fechaSeleccionada.value);
    const primerDiaDelMes = date.startOfDate(fecha, 'month');
    const ultimoDiaDelMes = date.endOfDate(fecha, 'month');

    const { data, error: supabaseError } = await supabase
      .from('pedidos')
      .select(`
        created_at,
        detalles_pedido (
          porcion,
          cantidad,
          precio_unitario
        )
      `)
      .eq('estado', 'pagado')
      .gte('created_at', primerDiaDelMes.toISOString())
      .lte('created_at', ultimoDiaDelMes.toISOString());

    if (supabaseError) throw supabaseError;

    const ventasPorDia = {};

    data.forEach(pedido => {
      const fechaLocal = date.formatDate(pedido.created_at, 'YYYY-MM-DD');

      if (!ventasPorDia[fechaLocal]) {
        ventasPorDia[fechaLocal] = {
          fecha: fechaLocal,
          '1/8': 0,
          '1/4': 0,
          '1/2': 0,
          '1': 0,
          totalPlatos: 0,
          totalPrecio: 0
        };
      }

      pedido.detalles_pedido.forEach(detalle => {
        if (detalle.porcion) {
          ventasPorDia[fechaLocal][detalle.porcion] += detalle.cantidad;
          ventasPorDia[fechaLocal].totalPlatos += detalle.cantidad;
          ventasPorDia[fechaLocal].totalPrecio += detalle.cantidad * detalle.precio_unitario;
        }
      });
    });

    ventas.value = Object.values(ventasPorDia);
    console.log('Ventas procesadas:', ventas.value);
  } catch (err) {
    console.error('Error al cargar ventas:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

const ventasFiltradas = computed(() => {
  return [...ventas.value].sort((a, b) => b.fecha.localeCompare(a.fecha));
});

const ventasDelDia = computed(() => {
  const fechaBuscada = fechaSeleccionada.value;
  return ventasFiltradas.value.filter(venta => venta.fecha === fechaBuscada);
});

const totalPlatosVendidos = computed(() => {
  return ventasFiltradas.value.reduce((sum, venta) => sum + venta.totalPlatos, 0);
});

const totalIngresos = computed(() => {
  return ventasFiltradas.value.reduce((sum, venta) => sum + venta.totalPrecio, 0);
});

const platoMasVendido = computed(() => {
  const platosTotales = {};
  const porciones = ['1/8', '1/4', '1/2', '1'];

  ventasFiltradas.value.forEach(venta => {
    porciones.forEach(porcion => {
      platosTotales[porcion] = (platosTotales[porcion] || 0) + venta[porcion];
    });
  });

  const platoMasVendido = Object.entries(platosTotales)
    .reduce((max, [porcion, cantidad]) =>
      cantidad > max.cantidad ? { porcion, cantidad } : max
    , { porcion: 'N/A', cantidad: 0 });

  return platoMasVendido;
});

const promedioVentaDiaria = computed(() => {
  const diasConVentas = ventasFiltradas.value.length;
  return diasConVentas > 0 ? totalIngresos.value / diasConVentas : 0;
});

function formatCurrency(value) {
  return `S/ ${value.toFixed(2)}`;
}

onMounted(() => {
  cargarVentas();
});

watch(fechaSeleccionada, () => {
  cargarVentas();
});
</script>

<style scoped>
.q-table__bottom-row td {
  border-top: 2px solid #ddd;
}
</style>



