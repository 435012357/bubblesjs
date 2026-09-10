import { z } from 'zod'
import { pageSchema, roleIdsSchema } from '@/modules/access/access.validation'

export const listSchema = pageSchema.extend({
  status: z.enum(['active', 'disabled', 'locked']).optional(),
})
export const accountStatusSchema = z.strictObject({ status: z.enum(['active', 'disabled']) })
export const platformRolesSchema = z.strictObject({ roleIds: roleIdsSchema })
