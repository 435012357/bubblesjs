/**
 * 按用户、UTC 年月和上传会话 ID 生成对象键，不使用客户端文件名。
 * @param now 用于目录分区的时间，默认当前时间。
 */
export function buildUploadObjectKey(
  ownerId: string,
  uploadSessionId: string,
  now = new Date(),
): string {
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')

  return `users/${ownerId}/${year}/${month}/${uploadSessionId}`
}
