/** 复制数据库记录，将创建和更新时间转为接口可传输的 ISO 字符串。 */
export function toTimestampRecord<T extends { createdAt: Date; updatedAt: Date }>(
  row: T,
): Omit<T, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string } {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
