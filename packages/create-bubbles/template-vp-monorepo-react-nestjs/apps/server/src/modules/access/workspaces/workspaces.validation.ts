import { z } from 'zod'
import { accountSchema, descriptionSchema, nameSchema, versionSchema } from '../access.validation'

const codeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9_-]+$/)

export const createScopeSchema = z.strictObject({
  name: nameSchema,
  code: codeSchema,
  description: descriptionSchema.optional(),
  administratorAccount: accountSchema,
})
export const profileSchema = z
  .strictObject({
    expectedVersion: versionSchema,
    name: nameSchema.optional(),
    code: codeSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.code !== undefined || v.description !== undefined)
