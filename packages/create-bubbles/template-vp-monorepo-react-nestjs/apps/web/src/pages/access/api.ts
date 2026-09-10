import type {
  AccessScope,
  AccountRecord,
  AccountStatusRequest,
  AddMemberRequest,
  AdministratorSummary,
  AssignMemberRolesRequest,
  AssignPlatformRolesRequest,
  AuditQuery,
  AuditRecord,
  CompanyDetail,
  CompanyRecord,
  CreateCompanyRequest,
  CreateProjectRequest,
  CreateRoleRequest,
  DeleteResult,
  EntityStatus,
  MemberRecord,
  PageQuery,
  PageResult,
  PermissionTreeResult,
  ProjectDetail,
  ProjectRecord,
  RoleRecord,
  SetAdministratorRequest,
  SetAdministratorResult,
  SetRolePermissionsRequest,
  StatusRequest,
  UpdateProfileRequest,
  UpdateRoleRequest,
} from 'shared/types'
import { accessScopeBasePath } from 'shared/utils'
import {
  freshRequest,
  runWorkspaceRequest,
  workspaceRequest as http,
} from '@/utils/request/workspace'

export function managementApi(scope: AccessScope) {
  const base = accessScopeBasePath(scope)
  const get = <T>(url: string, params?: object) =>
    runWorkspaceRequest({ method: http.Get<T>(url, { ...freshRequest, params }) })
  const post = <T>(url: string, data: object) =>
    runWorkspaceRequest({ method: http.Post<T>(url, data, freshRequest) })
  const patch = <T>(url: string, data: object) =>
    runWorkspaceRequest({ method: http.Patch<T>(url, data, freshRequest) })
  const put = <T>(url: string, data: object) =>
    runWorkspaceRequest({ method: http.Put<T>(url, data, freshRequest) })
  const remove = (url: string, expectedVersion: number) =>
    runWorkspaceRequest({
      method: http.Delete<DeleteResult>(url, undefined, {
        ...freshRequest,
        params: { expectedVersion },
      }),
    })
  const entities = scope.type === 'platform' ? '/platform/companies' : `${base}/projects`

  return {
    companies: (params: PageQuery & { status?: EntityStatus }) =>
      get<PageResult<CompanyRecord>>(entities, params),
    projects: (params: PageQuery & { status?: EntityStatus }) =>
      get<PageResult<ProjectRecord>>(entities, params),
    createCompany: (data: CreateCompanyRequest) => post<CompanyDetail>(entities, data),
    createProject: (data: CreateProjectRequest) => post<ProjectDetail>(entities, data),
    companyDetail: (id: string) => get<CompanyDetail>(`${entities}/${id}`),
    projectAdministrators: (id: string) =>
      get<AdministratorSummary[]>(`${entities}/${id}/administrators`),
    entityStatus: (id: string, data: StatusRequest) =>
      patch<CompanyRecord | ProjectRecord>(`${entities}/${id}/status`, data),
    setAdministrator: (id: string, data: SetAdministratorRequest) =>
      post<SetAdministratorResult>(`${entities}/${id}/administrator`, data),
    profile: () => get<CompanyDetail | ProjectDetail>(base),
    updateProfile: (data: UpdateProfileRequest) => patch<CompanyRecord | ProjectRecord>(base, data),
    members: (params: PageQuery & { status?: EntityStatus }) =>
      get<PageResult<MemberRecord>>(`${base}/members`, params),
    addMember: (data: AddMemberRequest) => post<MemberRecord>(`${base}/members`, data),
    memberStatus: (id: string, data: StatusRequest) =>
      patch<MemberRecord>(`${base}/members/${id}/status`, data),
    removeMember: (id: string, expectedVersion: number) =>
      remove(`${base}/members/${id}`, expectedVersion),
    memberRoles: (id: string, data: AssignMemberRolesRequest) =>
      put<MemberRecord>(`${base}/members/${id}/roles`, data),
    accounts: (params: PageQuery & { status?: string }) =>
      get<PageResult<AccountRecord>>('/platform/accounts', params),
    accountStatus: (id: string, data: AccountStatusRequest) =>
      patch<AccountRecord>(`/platform/accounts/${id}/status`, data),
    accountRoles: (id: string, data: AssignPlatformRolesRequest) =>
      put<AccountRecord>(`/platform/accounts/${id}/roles`, data),
    roles: (params: PageQuery = {}) => get<PageResult<RoleRecord>>(`${base}/roles`, params),
    role: (id: string) => get<RoleRecord>(`${base}/roles/${id}`),
    createRole: (data: CreateRoleRequest) => post<RoleRecord>(`${base}/roles`, data),
    updateRole: (id: string, data: UpdateRoleRequest) =>
      patch<RoleRecord>(`${base}/roles/${id}`, data),
    rolePermissions: (id: string, data: SetRolePermissionsRequest) =>
      put<RoleRecord>(`${base}/roles/${id}/permissions`, data),
    deleteRole: (id: string, expectedVersion: number) =>
      remove(`${base}/roles/${id}`, expectedVersion),
    permissions: () => get<PermissionTreeResult>(`${base}/permissions`),
    audits: (params: AuditQuery) => get<PageResult<AuditRecord>>(`${base}/audit-logs`, params),
  }
}
