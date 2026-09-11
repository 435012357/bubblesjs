import { z } from 'zod'
import { TASK_JOB_NAMES, TASK_QUEUE_NAME } from './task-queue.constants'

export const QueueSmokePayloadSchema = z.object({
  marker: z.string().min(1).max(100),
  enqueuedAt: z.iso.datetime(),
})

export type TaskName = (typeof TASK_JOB_NAMES)[keyof typeof TASK_JOB_NAMES]

export interface TaskPayloadMap {
  [TASK_JOB_NAMES.QUEUE_SMOKE]: z.infer<typeof QueueSmokePayloadSchema>
}

export const TASK_PAYLOAD_SCHEMAS = {
  [TASK_JOB_NAMES.QUEUE_SMOKE]: QueueSmokePayloadSchema,
} satisfies Record<TaskName, z.ZodType>

/**
 * 按任务名称选择对应的 Zod 模式，校验并返回可入队的负载。
 * @throws 负载不满足对应任务契约时抛出 Zod 校验异常。
 */
export function parseTaskPayload<Name extends TaskName>(
  name: Name,
  payload: unknown,
): TaskPayloadMap[Name] {
  return TASK_PAYLOAD_SCHEMAS[name].parse(payload) as TaskPayloadMap[Name]
}

export interface EnqueueTaskOptions {
  jobId?: string
  delayMs?: number
}

export interface EnqueuedTask<Name extends TaskName = TaskName> {
  queueName: typeof TASK_QUEUE_NAME
  jobId: string
  name: Name
}
