<template>
  <q-page class="q-pa-md">

    <audio ref="notificationSound" src="/notificationsound.mp3" preload="auto"></audio>
    <div class="text-h5 q-mb-md">Pedidos en Cocina</div>

    <q-table
      flat
      bordered
      :rows="pedidos"
      :columns="columns"
      row-key="id"
      class="tabla-pedidos"
      :rows-per-page="8"
    >
      <template v-slot:body-cell-fecha="props">
        <q-td :props="props">
          {{ formatearFecha(props.row.created_at) }}
        </q-td>
      </template>

      <template v-slot:body-cell-hora="props">
        <q-td :props="props">
          {{ formatearHora(props.row.created_at) }}
        </q-td>
      </template>

      <template v-slot:body-cell-estado="props">
        <q-td :props="props">
          <q-badge v-if="props.row.estado === 'entregado'" color="positive">
            Entregado
          </q-badge>
          <q-btn
            v-else-if="props.row.estado === 'en_cocina'"
            color="primary"
            label="Nuevo pedido"
            @click="marcarComoListo(props.row)"
            size="sm"
          />
          <q-badge v-else :color="obtenerColorEstado(props.row.estado)">
            {{ props.row.estado }}
          </q-badge>
        </q-td>
      </template>
    </q-table>

  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { date } from 'quasar';
import { supabase } from 'src/boot/supabase';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const pedidos = ref([]);
let subscription = null;
const notificationSound = ref(null);

const columns = [
  {
    name: 'fecha',
    label: 'Fecha',
    field: 'created_at',
    sortable: true,
    align: 'center'
  },
  {
    name: 'hora',
    label: 'Hora',
    field: 'created_at',
    sortable: true,
    align: 'center'
  },
  {
    name: 'mesa',
    label: 'Mesa',
    field: row => `Mesa ${row.mesa_numero}`,
    sortable: true,
    align: 'center'
  },
  {
    name: 'plato',
    label: 'Plato',
    field: row => row.detalles_pedido[0]?.platos?.nombre || 'N/A',
    align: 'left'
  },
  {
    name: 'cantidad',
    label: 'Cantidad',
    field: row => row.detalles_pedido[0]?.cantidad || 0,
    align: 'center'
  },
  {
    name: 'porcion',
    label: 'Porción',
    field: row => row.detalles_pedido[0]?.porcion || 'N/A',
    align: 'center'
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    sortable: true,
    align: 'center'
  }
];

onMounted(async () => {
  await cargarPedidos();
  iniciarSuscripcion();
});

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe();
  }
});

function formatearFecha(fecha) {
  return date.formatDate(fecha, 'DD/MM/YYYY');
}

function formatearHora(fecha) {
  return date.formatDate(fecha, 'HH:mm:ss');
}

function obtenerColorEstado(estado) {
  const colores = {
    pendiente: 'warning',
    en_cocina: 'negative',
    listo: 'info',
    entregado: 'positive'
  };
  return colores[estado] || 'grey';
}

async function cargarPedidos() {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesas (
          id,
          numero
        ),
        detalles_pedido (
          id,
          plato_id,
          porcion,
          cantidad,
          platos (
            id,
            nombre
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    pedidos.value = data.map(pedido => ({
      ...pedido,
      mesa_numero: pedido.mesas?.numero || 'N/A'
    }));

  } catch (error) {
    console.error('Error al cargar pedidos:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los pedidos'
    });
  }
}

function iniciarSuscripcion() {
  if (subscription) {
    subscription.unsubscribe();
  }

  subscription = supabase
    .channel('pedidos-cocina-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pedidos'
      },
      async (payload) => {
        console.log('Cambio en pedidos:', payload);
        if (payload.eventType === 'INSERT') {
          reproducirSonidoNotificacion();
        }
        await cargarPedidos();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'detalles_pedido'
      },
      async (payload) => {
        console.log('Cambio en detalles_pedido:', payload);
        await cargarPedidos();
      }
    )
    .subscribe((status) => {
      console.log('Estado de suscripción cocina:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Suscripción a cocina activa');
        $q.notify({
          type: 'positive',
          message: 'Conexión en tiempo real establecida',
          position: 'top'
        });
      }
    });
}

async function marcarComoListo(pedido) {
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'listo' })
      .eq('id', pedido.id);

    if (error) throw error;

    $q.notify({
      type: 'positive',
      message: 'Pedido marcado como listo'
    });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al actualizar el pedido'
    });
  }
}

function reproducirSonidoNotificacion() {
  if (notificationSound.value) {
    notificationSound.value.play().catch(error => {
      console.error('Error al reproducir el sonido de notificación:', error);
    });
  }
}
</script>

<style scoped>
.tabla-pedidos {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
.q-table thead tr th {
  background-color: #f4b266;
  color: #333;
  font-weight: bold;
}
.q-table th {
  font-weight: bold;
}

.q-btn {
  min-width: 120px;
}
</style>



