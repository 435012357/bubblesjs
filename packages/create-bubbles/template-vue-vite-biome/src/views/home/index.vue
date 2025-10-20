<script setup lang="ts">
import SvgIcon from '@/components/Icon/svg-icon.vue'

const a = ref()
</script>

<template>
  <div class="text-red flex-center">
    home
    <el-date-picker v-model="a" type="date" value-format="yyyy-MM-dd" />
    <SvgIcon name="vue" class="text-green" />
    <el-button type="primary">按钮</el-button>
  </div>
</template>

<style lang="scss" scoped></style>
