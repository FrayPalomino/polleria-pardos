<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Reporte - Venta de Bebidas</div>

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
              <div class="text-subtitle2">Bebidas Vendidas</div>
              <div class="text-h5 text-positive">{{ totalBebidasVendidas }}</div>
            </div>
            <div class="col-12 col-md-3">
              <div class="text-subtitle2">Ingresos Totales</div>
              <div class="text-h5 text-primary">{{ formatCurrency(totalIngresos) }}</div>
            </div>
            <div class="col-12 col-md-3">
              <div class="text-subtitle2">Bebida Más Vendida</div>
              <div class="text-h5 text-secondary">{{ bebidaMasVendida.nombre }}</div>
              <div class="text-caption">Cantidad: {{ bebidaMasVendida.cantidad }}</div>
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

        <template v-slot:body-cell-bebidasVendidas="props">
          <q-td :props="props">
            <q-list dense>
              <q-item v-for="(bebida, index) in props.row.bebidasDetalles" :key="index">
                <q-item-section>
                  {{ bebida.nombre }}: {{ bebida.cantidad }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-td>
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
  { name: 'totalBebidas', label: 'Total Bebidas', align: 'center', field: 'totalBebidas' },
  { name: 'bebidasVendidas', label: 'Bebidas Vendidas', align: 'left', field: 'bebidasDetalles' },
  { name: 'masBebidaVendida', label: 'Bebida Más Vendida', align: 'left', field: 'masBebidaVendida' },
  { name: 'cantidadMasBebidaVendida', label: 'Cantidad', align: 'center', field: 'cantidadMasBebidaVendida' },
  { name: 'totalPrecio', label: 'Total (S/)', align: 'right', field: 'totalPrecio' }
];

function getFechaLocal(fechaUTC) {
  const fecha = new Date(fechaUTC);
  return new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
}

async function cargarVentas() {
  loading.value = true;
  error.value = false;
  try {
    const fecha = new Date(fechaSeleccionada.value);
    const primerDiaDelMes = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), 1));
    const ultimoDiaDelMes = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59));

    const { data, error: supabaseError } = await supabase
      .from('pedidos')
      .select(`
        created_at,
        detalles_bebidas_pedido (
          cantidad,
          precio_unitario,
          bebidas (
            nombre,
            tamanio
          )
        )
      `)
      .eq('estado', 'pagado')
      .gte('created_at', primerDiaDelMes.toISOString())
      .lte('created_at', ultimoDiaDelMes.toISOString());

    if (supabaseError) throw supabaseError;

    const ventasPorDia = {};

    data.forEach(pedido => {
      if (!pedido.detalles_bebidas_pedido) return;

      const fechaLocal = getFechaLocal(pedido.created_at);

      if (!ventasPorDia[fechaLocal]) {
        ventasPorDia[fechaLocal] = {
          fecha: fechaLocal,
          totalBebidas: 0,
          bebidasDetalles: [],
          bebidasVendidas: {},
          totalPrecio: 0
        };
      }

      pedido.detalles_bebidas_pedido.forEach(detalle => {
        if (!detalle.bebidas) return;

        const nombreBebida = `${detalle.bebidas.nombre} (${detalle.bebidas.tamanio}L)`;
        ventasPorDia[fechaLocal].totalBebidas += detalle.cantidad;
        ventasPorDia[fechaLocal].bebidasVendidas[nombreBebida] =
          (ventasPorDia[fechaLocal].bebidasVendidas[nombreBebida] || 0) + detalle.cantidad;
        ventasPorDia[fechaLocal].totalPrecio += detalle.cantidad * detalle.precio_unitario;
      });
    });

    Object.values(ventasPorDia).forEach(venta => {
      venta.bebidasDetalles = Object.entries(venta.bebidasVendidas)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      const bebidaMasVendidaDelDia = venta.bebidasDetalles[0] || { nombre: 'N/A', cantidad: 0 };
      venta.masBebidaVendida = bebidaMasVendidaDelDia.nombre;
      venta.cantidadMasBebidaVendida = bebidaMasVendidaDelDia.cantidad;
    });

    ventas.value = Object.values(ventasPorDia);
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

const totalBebidasVendidas = computed(() => {
  return ventasFiltradas.value.reduce((sum, venta) => sum + venta.totalBebidas, 0);
});

const totalIngresos = computed(() => {
  return ventasFiltradas.value.reduce((sum, venta) => sum + venta.totalPrecio, 0);
});

const bebidaMasVendida = computed(() => {
  const bebidasTotales = {};

  ventasFiltradas.value.forEach(venta => {
    venta.bebidasDetalles.forEach(bebida => {
      bebidasTotales[bebida.nombre] = (bebidasTotales[bebida.nombre] || 0) + bebida.cantidad;
    });
  });

  const bebidaMasVendida = Object.entries(bebidasTotales)
    .reduce((max, [nombre, cantidad]) =>
      cantidad > max.cantidad ? { nombre, cantidad } : max
    , { nombre: 'N/A', cantidad: 0 });

  return bebidaMasVendida;
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

