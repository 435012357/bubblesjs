import { z } from 'zod'
import {
  descriptionSchema,
  nameSchema,
  permissionKeysSchema,
  versionSchema,
} from '../access.validation'

export const createRoleSchema = z.strictObject({
  name: nameSchema,
  description: descriptionSchema.optional(),
  permissionKeys: permissionKeysSchema.optional(),
})
export const updateRoleSchema = z
  .strictObject({
    expectedVersion: versionSchema,
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.description !== undefined)
export const permissionsSchema = z.strictObject({
  expectedVersion: versionSchema,
  permissionKeys: permissionKeysSchema,
})
