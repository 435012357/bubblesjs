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
