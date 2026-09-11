/** 递归合并普通对象，数组等非普通对象由目标值整体替换。 */
export function deepMergeObject<T = any>(source: T, target: Partial<T>): T {
  /** 递归复制并合并目标对象属性，目标值未定义时沿用源值。 */
  const merge = (src: any, tgt: any): any => {
    if (!isPlainObject(src) || !isPlainObject(tgt)) return tgt === undefined ? src : tgt

    const result = { ...src }
    for (const key of Object.keys(tgt)) {
      const targetValue = tgt[key]
      result[key] = isPlainObject(targetValue) ? merge(result[key], targetValue) : targetValue
    }

    return result
  }

  return merge(source, target)
}

/** 通过对象标签判断值是否为普通对象形态。 */
export function isPlainObject(data: unknown): data is Record<string, any> {
  return Object.prototype.toString.call(data) === '[object Object]'
}

/** 在运行环境支持 ReadableStream 时判断响应体是否为流。 */
export function isReadableStream(data: unknown): boolean {
  if (typeof ReadableStream === 'undefined') return false
  return data instanceof ReadableStream
}

/** 仅尝试解析对象或数组形式的 JSON 字符串，解析失败时保留原值。 */
export function tryParseJsonString(data: unknown): unknown {
  if (typeof data !== 'string') return data

  const value = data.trim()
  if (!value) return data

  if (!value.startsWith('{') && !value.startsWith('[')) return data

  try {
    return JSON.parse(value)
  } catch {
    return data
  }
}
