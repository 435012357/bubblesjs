import { defineStore } from 'pinia'

import { store } from '..'

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      name: 'admin',
      token: 'admin',
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
    }
  },
})

/** 显式绑定全局 Pinia 实例，供组件外部读取或修改用户状态。 */
export function useUserStoreWithOut() {
  return useUserStore(store)
}
