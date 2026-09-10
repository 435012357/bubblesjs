import { App } from 'antd'
import { useLoaderData } from 'react-router'
import type { AccessContext } from 'shared/types'
import { refreshAccess } from '@/utils/request/workspace'

export function useAccess() {
  return useLoaderData<AccessContext>()
}

export function useManagementAction() {
  const { message } = App.useApp()
  return async (action: () => Promise<unknown>, onSuccess?: () => void) => {
    try {
      await action()
      void message.success('已保存')
      onSuccess?.()
      refreshAccess()
      return true
    } catch (error) {
      if ((error as Error).name === 'AbortError') return false
      const suffix =
        (error as { status?: number }).status === 409 ? ' 请刷新数据后检查最新内容再保存。' : ''
      void message.error(`${error instanceof Error ? error.message : '操作失败，请重试'}${suffix}`)
      return false
    }
  }
}
