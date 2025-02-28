<template>
  <q-dialog v-model="dialogoVisible" persistent>
    <q-card style="width: 300px">
      <q-card-section class="bg-red text-white row items-center justify-between q-pa-sm">
        <div class="text-h6">Mesa N° {{ mesa?.numero }} (Ocupada)</div>
        <q-btn dense flat round icon="close" color="white" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-md">
        <div class="text-subtitle1 text-center q-mb-md">¿Qué deseas hacer?</div>
      </q-card-section>

      <q-card-actions align="center" class="q-pa-md">
        <div class="row full-width q-col-gutter-md">
          <div class="col-12">
            <q-btn
              color="primary"
              class="full-width"
              label="Agregar pedidos extra"
              icon="add_shopping_cart"
              @click="seleccionarAccion('agregar')"
            />
          </div>
          <div class="col-12">
            <q-btn
              color="green"
              class="full-width"
              label="Procesar pago"
              icon="payment"
              @click="seleccionarAccion('pagar')"
            />
          </div>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  mesa: Object,
});

const emit = defineEmits(['update:modelValue', 'seleccionar-accion']);

const dialogoVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

function seleccionarAccion(accion) {
  emit('seleccionar-accion', accion);
  emit('update:modelValue', false);
}
</script>
