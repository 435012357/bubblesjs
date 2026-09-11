<script lang="ts" setup>
import type { MenuProps } from 'antdv-next'

import type { MenuRouteRecordRawType } from '@/router/interface'

import SvgIcon from '@/components/Icon/svg-icon.vue'

import { menuRoutes } from '@/router/modules'

import Header from './header/index.vue'

const route = useRoute()
const router = useRouter()

const collapsed = ref(false)

/** 根据当前路由匹配链计算菜单选中项。 */
const selectedKeys = computed(() => {
  const matched = route.matched.map(item => item.name)
  return matched.filter(Boolean) as string[]
})

const openKeys = ref<string[]>([])

watchEffect(/** 路由变化时同步父菜单展开状态。 */ () => {
  const matched = route.matched.map(item => item.name).filter(Boolean) as string[]
  const parentKey = matched[0]

  openKeys.value = matched.length > 1 && parentKey !== undefined ? [parentKey] : []
})

/** 按菜单项的路由名称跳转。 */
function handleMenuClick({ key }: { key: string }) {
  router.push({ name: key })
}

/** 将 `svg-` 前缀的菜单图标转换为图标组件，其余图标返回 `null`。 */
function renderIcon(icon?: string) {
  if (!icon)
    return null
  const isSvgIcon = icon.startsWith('svg-')
  if (isSvgIcon) {
    return h(SvgIcon, {
      icon: icon.replace('svg-', ''),
      style: { fontSize: '18px' },
    })
  }
  return null
}

/** 递归将可见路由转换为菜单项，保留标题、图标和子菜单层级。 */
function getMenuItems(routes: MenuRouteRecordRawType[]): NonNullable<MenuProps['items']> {
  return routes
    .filter(item => !item.meta?.hideInMenu)
    .map(/** 生成当前路由的菜单项，并递归构造可见子菜单。 */ (item) => {
      const hasChildren = item.children && item.children.length > 0
      const key = String(item.name ?? item.path)
      const label = item.meta?.title ?? key
      if (hasChildren) {
        return {
          key,
          label,
          icon: renderIcon(item.meta?.icon),
          children: getMenuItems(item.children as MenuRouteRecordRawType[]),
        }
      }
      return {
        key,
        label,
        icon: renderIcon(item.meta?.icon),
      }
    })
}

const menuItems = computed(() => getMenuItems(menuRoutes))
</script>

<template>
  <ALayout class="h-screen">
    <ALayoutSider v-model:collapsed="collapsed" :trigger="null" collapsible :width="220" class="layout-sider">
      <div class="logo flex-center gap-2 h-[var(--header-height)]">
        <SvgIcon icon="logo" class="text-2xl" />
        <span v-show="!collapsed" class="text-lg text-white font-bold">
          Vue Template
        </span>
      </div>
      <AMenu v-model:selected-keys="selectedKeys" v-model:open-keys="openKeys" :items="menuItems" theme="dark"
        mode="inline" @click="handleMenuClick" />
    </ALayoutSider>

    <ALayout>
      <ALayoutHeader class="layout-header px-4 flex items-center justify-between">
        <div class="flex gap-3 items-center">
          <AButton type="text" class="flex-center" @click="collapsed = !collapsed">
            <SvgIcon :icon="collapsed ? 'menu-unfold' : 'menu-fold'" style="font-size: 18px" />
          </AButton>
        </div>
        <Header />
      </ALayoutHeader>

      <ALayoutContent class="layout-content p-4 overflow-auto">
        <RouterView />
      </ALayoutContent>
    </ALayout>
  </ALayout>
</template>

<style lang="scss" scoped>
.layout-sider {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: auto;
}

.layout-header {
  height: var(--header-height);
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0;
}

.layout-content {
  min-height: calc(100vh - var(--header-height));
  background: #f5f5f5;
}
</style>
