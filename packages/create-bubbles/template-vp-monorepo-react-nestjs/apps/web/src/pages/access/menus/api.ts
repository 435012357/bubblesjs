import type {
  CleanupPreview,
  CleanupRequest,
  CleanupResult,
  CreateMenuRequest,
  FunctionCatalogResult,
  MenuTreeResult,
  ScopeType,
  UpdateMenuRequest,
} from 'shared/types'
import {
  freshRequest,
  runWorkspaceRequest,
  workspaceRequest as http,
} from '@/utils/request/workspace'

export const menuApi = {
  tree: (scopeType: ScopeType) =>
    runWorkspaceRequest({
      method: http.Get<MenuTreeResult>('/platform/menus', {
        ...freshRequest,
        params: { scopeType },
      }),
    }),
  catalog: (scopeType: ScopeType) =>
    runWorkspaceRequest({
      method: http.Get<FunctionCatalogResult>('/platform/function-catalog', {
        ...freshRequest,
        params: { scopeType },
      }),
    }),
  create: (scopeType: ScopeType, data: CreateMenuRequest) =>
    runWorkspaceRequest({
      method: http.Post<MenuTreeResult>('/platform/menus', data, {
        ...freshRequest,
        params: { scopeType },
      }),
    }),
  update: (id: string, data: UpdateMenuRequest) =>
    runWorkspaceRequest({
      method: http.Patch<MenuTreeResult>(`/platform/menus/${id}`, data, freshRequest),
    }),
  remove: (id: string, expectedVersion: number) =>
    runWorkspaceRequest({
      method: http.Delete<MenuTreeResult>(`/platform/menus/${id}`, undefined, {
        ...freshRequest,
        params: { expectedVersion },
      }),
    }),
  cleanupPreview: () =>
    runWorkspaceRequest({
      method: http.Get<CleanupPreview>('/platform/permissions/cleanup-preview', freshRequest),
    }),
  cleanup: (data: CleanupRequest) =>
    runWorkspaceRequest({
      method: http.Post<CleanupResult>('/platform/permissions/cleanup', data, freshRequest),
    }),
}
