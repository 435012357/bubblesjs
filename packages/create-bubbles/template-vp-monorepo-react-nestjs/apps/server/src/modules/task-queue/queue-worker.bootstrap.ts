import { BullRegistrar } from '@nestjs/bullmq'
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class QueueWorkerBootstrap implements OnApplicationBootstrap {
  private registered = false

  constructor(
    private readonly config: ConfigService,
    private readonly registrar: BullRegistrar,
  ) {}

  /**
   * 仅在配置启用消费者且尚未注册时启动 Worker，避免同一实例重复注册。
   */
  onApplicationBootstrap() {
    const workerEnabled = this.config.getOrThrow<boolean>('queue.workerEnabled')

    if (!workerEnabled || this.registered) {
      return
    }

    this.registrar.register()
    this.registered = true
  }
}
