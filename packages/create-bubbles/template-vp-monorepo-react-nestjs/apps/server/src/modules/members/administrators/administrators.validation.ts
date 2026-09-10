import { z } from 'zod'
import { accountSchema, idSchema } from '@/modules/access/access.validation'

export const administratorSchema = z.strictObject({
  account: accountSchema,
  replaceUserId: idSchema.optional(),
})
