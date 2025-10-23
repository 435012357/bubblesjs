<script lang="ts" setup>
import type { MenuRouteRecordRawType } from '@/router/interface'

import LogoIcon from '@/assets/icon/logo.svg'
import { menuRoutes } from '@/router/modules'

import SvgIcon from '@/components/Icon/svg-icon.vue'

import Header from './header/index.vue'

function getRoutes(routes: MenuRouteRecordRawType[]) {
  const result = routes.map((item) => {
    const isSvgIcon = (item.meta?.icon as string | undefined)?.startsWith('svg-')
    return ({
      path: item.path,
      name: item.name,
      component: item.component,
      meta: {
        title: item.meta?.title,
        icon: isSvgIcon ? h(SvgIcon, { icon: (item.meta?.icon as string).replace('svg-', ''), style: { fontSize: '20px' } }) : undefined,
        hideInMenu: item.meta?.hideInMenu,
      },
      children: item.children,
    })
  })
  result.forEach((item) => {
    if (item.children) {
      item.children = getRoutes(item.children) as MenuRouteRecordRawType[]
    }
  })
  return result
}

const routes = getRoutes(menuRoutes)
</script>

<template>
  <PlusLayout
    :sidebar-props="{ routes }"
    :has-breadcrumb="false"
    :header-props="{
      hasUserInfo: false,
    }"
  >
    <template #header-left>
      <h1>111</h1>
    </template>

    <template #header-right>
      <Header />
    </template>

    <router-view />
  </PlusLayout>
</template>
