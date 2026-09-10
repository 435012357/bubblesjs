import { z } from 'zod'
import { idSchema, pageSchema } from '@/modules/access/access.validation'

export const auditSchema = pageSchema
  .extend({
    action: z.string().max(120).optional(),
    actorId: idSchema.optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to)
