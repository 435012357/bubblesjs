export const deepMergeObject = <T = any>(source: T, target: Partial<T>): T => {
  const isObject = (obj: any): obj is Record<string, any> =>
    obj && typeof obj === 'object' && !Array.isArray(obj)

  const merge = (src: any, tgt: any): any => {
    if (isObject(src) && isObject(tgt)) {
      Object.keys(tgt).forEach((key) => {
        if (isObject(tgt[key])) {
          src[key] = merge(src[key] || {}, tgt[key])
        } else {
          src[key] = tgt[key]
        }
      })
    }
    return src
  }

  return merge({ ...source }, target)
}

/**
 * 判断一个变量是不是可读流
 * @param data
 */
export const isReadableStream = (data: unknown): boolean => {
  if (!(data instanceof ReadableStream)) {
    return false
  }
  if (typeof data.locked !== 'boolean') return false

  const instanceFunc = ['cancel', 'getReader', 'pipeThrough', 'pipeTo', 'tee'] as const

  for (const func of instanceFunc) {
    if (typeof data[func] !== 'function') return false
  }

  return true
}
