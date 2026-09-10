import { z } from 'zod'
import { permissionKeysSchema } from '../access.validation'

export const cleanupSchema = z.strictObject({
  permissionKeys: permissionKeysSchema.min(1),
  proofDigest: z.string().regex(/^[a-f0-9]{64}$/),
})
