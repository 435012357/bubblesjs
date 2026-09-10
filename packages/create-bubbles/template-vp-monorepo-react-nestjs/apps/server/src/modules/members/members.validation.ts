import { z } from 'zod'
import { accountSchema, roleIdsSchema, versionSchema } from '@/modules/access/access.validation'

export const memberSchema = z.strictObject({ account: accountSchema })
export const memberRolesSchema = z.strictObject({
  roleIds: roleIdsSchema,
  expectedVersion: versionSchema,
})
