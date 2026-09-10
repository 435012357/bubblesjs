import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './schema'

export const accessStatus = pgEnum('access_status', ['active', 'disabled'])
export const scopeType = pgEnum('access_scope_type', ['platform', 'company', 'project'])
export const menuType = pgEnum('menu_type', ['directory', 'page', 'operation'])
export const builtinRole = pgEnum('builtin_role', ['administrator', 'member'])
const times = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 64 }).notNull().unique(),
    description: text('description').notNull().default(''),
    status: accessStatus('status').notNull().default('active'),
    version: integer('version').notNull().default(1),
    ...times(),
  },
  (t) => [check('companies_version_positive', sql`${t.version} > 0`)],
)
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    description: text('description').notNull().default(''),
    status: accessStatus('status').notNull().default('active'),
    version: integer('version').notNull().default(1),
    ...times(),
  },
  (t) => [
    unique('projects_company_code_uq').on(t.companyId, t.code),
    unique('projects_company_id_uq').on(t.companyId, t.id),
    check('projects_version_positive', sql`${t.version} > 0`),
    index('projects_company_status_idx').on(t.companyId, t.status),
  ],
)
export const companyMembers = pgTable(
  'company_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    status: accessStatus('status').notNull().default('active'),
    version: integer('version').notNull().default(1),
    ...times(),
  },
  (t) => [
    unique('company_members_company_user_uq').on(t.companyId, t.userId),
    check('company_members_version_positive', sql`${t.version} > 0`),
    index('company_members_user_idx').on(t.userId),
  ],
)
export const projectMembers = pgTable(
  'project_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').notNull(),
    projectId: uuid('project_id').notNull(),
    userId: uuid('user_id').notNull(),
    status: accessStatus('status').notNull().default('active'),
    version: integer('version').notNull().default(1),
    ...times(),
  },
  (t) => [
    unique('project_members_project_user_uq').on(t.projectId, t.userId),
    foreignKey({
      columns: [t.companyId, t.projectId],
      foreignColumns: [projects.companyId, projects.id],
    }),
    foreignKey({
      columns: [t.companyId, t.userId],
      foreignColumns: [companyMembers.companyId, companyMembers.userId],
    }),
    check('project_members_version_positive', sql`${t.version} > 0`),
    index('project_members_user_idx').on(t.userId),
  ],
)
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scopeType: scopeType('scope_type').notNull(),
    companyId: uuid('company_id').references(() => companies.id),
    projectId: uuid('project_id').references(() => projects.id),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description').notNull().default(''),
    builtin: builtinRole('builtin'),
    version: integer('version').notNull().default(1),
    ...times(),
  },
  (t) => [
    check(
      'roles_scope_check',
      sql`(${t.scopeType} = 'platform' AND ${t.companyId} IS NULL AND ${t.projectId} IS NULL) OR (${t.scopeType} = 'company' AND ${t.companyId} IS NOT NULL AND ${t.projectId} IS NULL) OR (${t.scopeType} = 'project' AND ${t.companyId} IS NOT NULL AND ${t.projectId} IS NOT NULL)`,
    ),
    foreignKey({
      columns: [t.companyId, t.projectId],
      foreignColumns: [projects.companyId, projects.id],
    }),
    uniqueIndex('roles_platform_name_uq')
      .on(t.name)
      .where(sql`${t.scopeType} = 'platform'`),
    uniqueIndex('roles_company_name_uq')
      .on(t.companyId, t.name)
      .where(sql`${t.scopeType} = 'company'`),
    uniqueIndex('roles_project_name_uq')
      .on(t.projectId, t.name)
      .where(sql`${t.scopeType} = 'project'`),
    uniqueIndex('roles_platform_builtin_uq')
      .on(t.builtin)
      .where(sql`${t.scopeType} = 'platform' AND ${t.builtin} IS NOT NULL`),
    uniqueIndex('roles_company_builtin_uq')
      .on(t.companyId, t.builtin)
      .where(sql`${t.scopeType} = 'company' AND ${t.builtin} IS NOT NULL`),
    uniqueIndex('roles_project_builtin_uq')
      .on(t.projectId, t.builtin)
      .where(sql`${t.scopeType} = 'project' AND ${t.builtin} IS NOT NULL`),
    check('roles_version_positive', sql`${t.version} > 0`),
  ],
)
export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] }), index('user_roles_role_idx').on(t.roleId)],
)
export const permissions = pgTable(
  'permissions',
  {
    key: varchar('key', { length: 150 }).primaryKey(),
    scopeType: scopeType('scope_type').notNull(),
    title: varchar('title', { length: 100 }).notNull(),
    routeKey: varchar('route_key', { length: 120 }).notNull(),
    kind: varchar('kind', { length: 20 }).notNull(),
    pagePermissionKey: varchar('page_permission_key', { length: 150 }),
    adminOnly: boolean('admin_only').notNull().default(false),
    deprecated: boolean('deprecated').notNull().default(false),
  },
  (t) => [
    unique('permissions_scope_key_uq').on(t.scopeType, t.key),
    foreignKey({
      columns: [t.scopeType, t.pagePermissionKey],
      foreignColumns: [t.scopeType, t.key],
    }),
    check(
      'permissions_kind_check',
      sql`(${t.kind} = 'page' AND ${t.pagePermissionKey} IS NULL) OR (${t.kind} = 'operation' AND ${t.pagePermissionKey} IS NOT NULL AND ${t.pagePermissionKey} <> ${t.key})`,
    ),
  ],
)
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionKey: varchar('permission_key', { length: 150 })
      .notNull()
      .references(() => permissions.key),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permissionKey] }),
    index('role_permissions_key_idx').on(t.permissionKey),
  ],
)
export const menus = pgTable(
  'menus',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scopeType: scopeType('scope_type').notNull(),
    parentId: uuid('parent_id'),
    type: menuType('type').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    icon: varchar('icon', { length: 80 }).notNull().default(''),
    sort: integer('sort').notNull().default(0),
    hidden: boolean('hidden').notNull().default(false),
    status: accessStatus('status').notNull().default('active'),
    routeKey: varchar('route_key', { length: 120 }),
    permissionKey: varchar('permission_key', { length: 150 }).references(() => permissions.key),
    protected: boolean('protected').notNull().default(false),
    ...times(),
  },
  (t) => [
    foreignKey({ columns: [t.parentId], foreignColumns: [t.id] }),
    unique('menus_permission_uq').on(t.scopeType, t.permissionKey),
    uniqueIndex('menus_page_uq')
      .on(t.scopeType, t.routeKey)
      .where(sql`${t.type} = 'page'`),
    index('menus_scope_parent_idx').on(t.scopeType, t.parentId),
  ],
)
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.id),
    actorAccount: varchar('actor_account', { length: 32 }).notNull(),
    actorName: varchar('actor_name', { length: 100 }).notNull(),
    scopeType: scopeType('scope_type').notNull(),
    companyId: uuid('company_id'),
    projectId: uuid('project_id'),
    action: varchar('action', { length: 120 }).notNull(),
    objectType: varchar('object_type', { length: 60 }).notNull(),
    objectId: text('object_id').notNull(),
    summary: jsonb('summary')
      .$type<Record<string, string | number | boolean | null | string[]>>()
      .notNull(),
    requestId: varchar('request_id', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check(
      'audit_scope_check',
      sql`(${t.scopeType} = 'platform' AND ${t.companyId} IS NULL AND ${t.projectId} IS NULL) OR (${t.scopeType} = 'company' AND ${t.companyId} IS NOT NULL AND ${t.projectId} IS NULL) OR (${t.scopeType} = 'project' AND ${t.companyId} IS NOT NULL AND ${t.projectId} IS NOT NULL)`,
    ),
    index('audit_scope_created_idx').on(t.scopeType, t.companyId, t.projectId, t.createdAt, t.id),
  ],
)
export const menuVersions = pgTable(
  'menu_versions',
  {
    scopeType: scopeType('scope_type').primaryKey(),
    version: integer('version').notNull().default(1),
  },
  (t) => [check('menu_versions_positive', sql`${t.version} > 0`)],
)
export const cleanupTombstones = pgTable('permission_cleanup_tombstones', {
  permissionKey: varchar('permission_key', { length: 150 }).primaryKey(),
  cleanedAt: timestamp('cleaned_at', { withTimezone: true }).defaultNow().notNull(),
  deploymentId: text('deployment_id').notNull(),
})
export const accessBootstrap = pgTable(
  'access_bootstrap',
  {
    id: integer('id').primaryKey(),
    initializedAdminUserId: uuid('initialized_admin_user_id')
      .notNull()
      .references(() => users.id),
    initializedAt: timestamp('initialized_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [check('access_bootstrap_singleton', sql`${t.id} = 1`)],
)
