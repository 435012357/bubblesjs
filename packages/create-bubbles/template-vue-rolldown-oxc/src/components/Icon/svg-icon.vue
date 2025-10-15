<template>
  <svg class="svg-icon" aria-hidden="true" v-bind="attrs">
    <use :href="`#icon-${name}`" />
  </svg>
</template>

<script setup lang="ts">
const attrs = useAttrs()
defineProps<{
  name: string
}>()
</script>

<style lang="scss" scoped>
.svg-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1em;
  height: 1em;
  fill: currentColor;
  overflow: hidden;
}

.svg-external-icon {
  background-color: currentColor;
  mask-size: cover !important;
}
</style>
