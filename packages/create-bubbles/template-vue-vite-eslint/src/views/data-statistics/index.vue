<script setup lang="ts">
const treeSelect = ref()

const rightComponent = computed(() => {
  return treeSelect.value.right
})
</script>

<template>
  <div class="index-container" />

  <el-tree v-model="treeSelect" />

  <div />

  <div>
    <component :is="rightComponent" />
  </div>
</template>

<style lang="scss" scoped>

</style>
