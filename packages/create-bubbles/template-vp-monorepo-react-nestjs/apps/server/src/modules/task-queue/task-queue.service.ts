import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import type { JobsOptions, Queue } from 'bullmq'
import { TASK_QUEUE_NAME } from './task-queue.constants'
import {
  type EnqueuedTask,
  type EnqueueTaskOptions,
  parseTaskPayload,
  type TaskName,
  type TaskPayloadMap,
} from './task-queue.contracts'

@Injectable()
export class TaskQueueService {
  constructor(
    @InjectQueue(TASK_QUEUE_NAME)
    private readonly queue: Queue,
  ) {}

  /**
   * 校验任务负载与投递选项后，将任务写入 BullMQ 队列。
   * @param options 可指定任务 ID 和延迟毫秒数。
   * @returns 可用于跟踪任务的队列名、任务 ID 和任务名称。
   * @throws 负载或选项无效、投递失败或队列未返回任务 ID 时抛出错误。
   */
  async enqueue<Name extends TaskName>(
    name: Name,
    payload: TaskPayloadMap[Name],
    options: EnqueueTaskOptions = {},
  ): Promise<EnqueuedTask<Name>> {
    this.validateOptions(options)

    const data = parseTaskPayload(name, payload)
    const jobOptions: JobsOptions = {
      ...(options.jobId === undefined ? {} : { jobId: options.jobId }),
      ...(options.delayMs === undefined ? {} : { delay: options.delayMs }),
    }

    const job = await this.queue.add(name, data, jobOptions)

    if (job.id === undefined) {
      throw new Error('BullMQ returned a Job without an id')
    }

    return {
      queueName: TASK_QUEUE_NAME,
      jobId: job.id,
      name,
    }
  }

  /**
   * 检查任务 ID 不含冒号，且延迟为非负安全整数；不满足 BullMQ 约束时抛出错误。
   */
  private validateOptions(options: EnqueueTaskOptions) {
    if (options.jobId?.includes(':')) {
      throw new Error('BullMQ jobId must not contain a colon')
    }

    if (
      options.delayMs !== undefined &&
      (!Number.isSafeInteger(options.delayMs) || options.delayMs < 0)
    ) {
      throw new Error('delayMs must be a non-negative safe integer')
    }
  }
}
