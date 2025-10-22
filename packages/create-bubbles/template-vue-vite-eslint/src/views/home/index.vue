<script setup lang="ts">
import SvgIcon from '@/components/Icon/svg-icon.vue'

const a = ref()

const b = ref([1, 3, 4])
</script>

<template>
  <div class="relative z-1 m-2px p-[111px] p-3px p-4px text-red">
    home
    <el-date-picker v-model="a" type="date" value-format="yyyy-MM-dd" />
    <SvgIcon name="vue" class="text-green" />
    <el-button type="primary">
      按钮
    </el-button>
    <div v-for="item in b" :key="item">
      {{ item }}
    </div>
    <image src="https://img2.baidu.com/it/u=3422424222,2328894338&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500" />
  </div>
</template>

<style lang="scss" scoped></style>
