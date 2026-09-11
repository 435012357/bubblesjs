<script setup lang="ts">
import { useUserStoreWithOut } from '@/store/modules/user'

const userStore = useUserStoreWithOut()
const router = useRouter()

/** 处理用户菜单；退出登录时重置用户状态并跳转到登录页。 */
function handleMenuClick({ key }: { key: string }) {
  if (key === 'logout') {
    userStore.$reset()
    router.push('/login')
  }
}

const dropdownItems = [
  { key: 'logout', label: '退出登录' },
]
</script>

<template>
  <div class="flex gap-3 items-center">
    <ADropdown :menu="{ items: dropdownItems, onClick: handleMenuClick }">
      <div class="flex-center gap-2 cursor-pointer">
        <AAvatar :size="32" :src="userStore.avatar">
          {{ userStore.name?.charAt(0).toUpperCase() }}
        </AAvatar>
        <span class="text-sm">{{ userStore.name }}</span>
      </div>
    </ADropdown>
  </div>
</template>
