export const UPLOAD_PART_SIZE = 10 * 1024 * 1024
export const UPLOAD_MAX_PARTS = 10_000
export const UPLOAD_MAX_FILE_SIZE = 90 * 1024 * 1024 * 1024

/**
 * 按固定分片大小向上取整，计算文件上传所需分片数。
 * @param fileSize 文件字节数。
 */
export function calculateTotalParts(fileSize: number): number {
  return Math.ceil(fileSize / UPLOAD_PART_SIZE)
}

/**
 * 计算指定分片应有的字节数，最后一片使用文件剩余长度。
 * @param partNumber 从 1 开始的分片序号。
 * @throws 分片序号超出上传范围时抛出 RangeError。
 */
export function calculateExpectedPartSize(
  fileSize: number,
  totalParts: number,
  partNumber: number,
): number {
  if (partNumber < 1 || partNumber > totalParts) {
    throw new RangeError('partNumber is outside the upload range')
  }

  if (partNumber < totalParts) {
    return UPLOAD_PART_SIZE
  }

  return fileSize - (totalParts - 1) * UPLOAD_PART_SIZE
}
