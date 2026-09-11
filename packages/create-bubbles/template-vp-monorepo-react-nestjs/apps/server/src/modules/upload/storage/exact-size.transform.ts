import { TransformCallback } from 'node:stream'
import { Transform } from 'stream'

export class ExactSizeError extends Error {
  /**
   * 记录期望与实际字节数，使上层能够识别上传内容长度不匹配。
   */
  constructor(
    readonly expectedBytes: number,
    readonly receivedBytes: number,
  ) {
    super(`Expected ${expectedBytes} bytes, recevied ${receivedBytes}`)
    this.name = ExactSizeError.name
  }
}

export class ExactSizeTransform extends Transform {
  receivedBytes = 0

  /**
   * 记录流所要求的精确字节数，用于后续长度验证。
   */
  constructor(private readonly expectedBytes: number) {
    super()
  }

  /**
   * 累计并透传数据块；一旦实际字节数超过期望值，立即通过回调使流失败。
   */
  override _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    const byteLength = Buffer.isBuffer(chunk)
      ? chunk.length
      : Buffer.byteLength(String(chunk), encoding)
    this.receivedBytes += byteLength

    if (this.receivedBytes > this.expectedBytes) {
      callback(new ExactSizeError(this.expectedBytes, this.receivedBytes))
      return
    }

    callback(null, chunk)
  }

  /**
   * 在输入流结束时核对总字节数，发现不足或不一致时通过回调报告长度错误。
   * @param callback 通知流框架完成刷新，或传递长度校验异常。
   */
  override _flush(callback: TransformCallback): void {
    if (this.receivedBytes !== this.expectedBytes) {
      callback(new ExactSizeError(this.expectedBytes, this.receivedBytes))
      return
    }

    callback()
  }
}

/**
 * 沿最多八层 cause 链查找长度校验异常，未找到时返回 null。
 */
export function findExactSizeError(cause: unknown): ExactSizeError | null {
  let current = cause

  for (let depth = 0; depth < 8; depth += 1) {
    if (current instanceof ExactSizeError) {
      return current
    }

    if (typeof current !== 'object' || current === null || !('cause' in current)) {
      return null
    }

    current = current.cause
  }

  return null
}
