<template>
  <q-card
    :class="['mesa', mesa.estado]"
    bordered
    flat
    @click="$emit('click', mesa)"
  >
    <q-card-section class="text-center text-white text-h6">
      Mesa {{ mesa.numero }}
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  mesa: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.mesa {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mesa:hover {
  transform: scale(1.05);
}

.libre { background-color: #06860b; }
.ocupado { background-color: #a92207; }
.espera { background-color: #074982; }
</style>
