# @bubblesjs/utils

提供对象合并、对象与流类型判断、JSON 字符串解析等工具函数。

## 安装

::: code-group

```bash [pnpm]
pnpm add @bubblesjs/utils
```

```bash [npm]
npm install @bubblesjs/utils
```

```bash [yarn]
yarn add @bubblesjs/utils
```

```bash [bun]
bun add @bubblesjs/utils
```

:::

## 快速使用

```ts
import { deepMergeObject, isReadableStream } from '@bubblesjs/utils'

// 深度合并对象
const merged = deepMergeObject({ a: 1, b: { c: 2 } }, { b: { d: 3 }, e: 4 })
// 结果: { a: 1, b: { c: 2, d: 3 }, e: 4 }

// 检查是否为可读流
const isStream = isReadableStream(response.body)
```

## API 文档

### 通用工具函数

#### deepMergeObject(source, target)

深度合并两个对象，支持嵌套对象的递归合并。

**参数：**

- `source`: `T` - 原始对象
- `target`: `Partial<T>` - 覆盖配置，同名属性覆盖第一个参数的值

**返回值：**

- `object` - 合并后的新对象

**示例：**

```ts
import { deepMergeObject } from '@bubblesjs/utils'

const target = {
  user: {
    name: 'Alice',
    settings: {
      theme: 'light',
    },
  },
  version: '1.0.0',
}

const source = {
  user: {
    age: 25,
    settings: {
      language: 'zh-CN',
    },
  },
  features: ['dark-mode'],
}

const result = deepMergeObject(target, source)
// 结果:
// {
//   user: {
//     name: 'Alice',
//     age: 25,
//     settings: {
//       theme: 'light',
//       language: 'zh-CN'
//     }
//   },
//   version: '1.0.0',
//   features: ['dark-mode']
// }
```

**注意事项：**

- 数组会被整体替换，不会进行元素级合并
- 函数、Date、RegExp 等特殊对象会被直接赋值
- 第二个参数的属性会覆盖第一个参数的同名属性

#### isPlainObject(data)

根据 `Object.prototype.toString.call(data) === '[object Object]'` 判断对象标签，返回 `boolean`，并提供 `Record<string, any>` 类型收窄。它不会检查原型，因此普通类实例也可能返回 `true`。

```ts
import { isPlainObject } from '@bubblesjs/utils'

isPlainObject({ name: 'Bubbles' }) // true
isPlainObject([]) // false
isPlainObject(null) // false
```

#### tryParseJsonString(data)

接收 `unknown`，仅尝试解析去除首尾空白后以 `{` 或 `[` 开头的字符串。解析成功时返回对应值；非字符串、不匹配或解析失败时返回原始输入，保留原有空白。

```ts
import { tryParseJsonString } from '@bubblesjs/utils'

tryParseJsonString(' {"name":"Bubbles"} ') // { name: 'Bubbles' }
tryParseJsonString('[1, 2]') // [1, 2]
tryParseJsonString('true') // 'true'
tryParseJsonString('{invalid}') // '{invalid}'
```

#### isReadableStream(obj)

检查对象是否为可读流（ReadableStream）。

**参数：**

- `obj`: `any` - 要检查的对象

**返回值：**

- `boolean` - 如果是可读流返回 true，否则返回 false

**示例：**

```ts
import { isReadableStream } from '@bubblesjs/utils'

// 检查 fetch 响应体
const response = await fetch('/api/data')
if (isReadableStream(response.body)) {
  // 处理流式响应
  const data = await response.json()
} else {
  // 处理普通响应
  const data = response.body
}

// 检查自定义流
const customStream = new ReadableStream({
  start(controller) {
    controller.enqueue('Hello')
    controller.close()
  },
})

console.log(isReadableStream(customStream)) // true
console.log(isReadableStream({})) // false
console.log(isReadableStream(null)) // false
```

**使用场景：**

- 区分不同类型的响应体
- 条件性地处理流式数据
- 适配器兼容性检查

## 使用场景

### 1. 配置对象合并

```ts
import { deepMergeObject } from '@bubblesjs/utils'

// 默认配置
const defaultConfig = {
  api: {
    baseUrl: '/api',
    timeout: 5000,
  },
  ui: {
    theme: 'light',
    language: 'en',
  },
}

// 用户配置
const userConfig = {
  api: {
    timeout: 10000,
  },
  ui: {
    theme: 'dark',
  },
}

// 合并配置
const finalConfig = deepMergeObject(defaultConfig, userConfig)
// 结果保留了所有默认配置，同时应用了用户的覆盖设置
```

### 2. 响应处理适配

```ts
import { isReadableStream } from '@bubblesjs/utils'

const handleResponse = async (response) => {
  // 根据响应体类型进行不同处理
  if (response?.body && isReadableStream(response.body)) {
    // Fetch API 的流式响应
    return await response.json()
  } else {
    // 其他适配器的直接响应
    return response.data
  }
}
```

### 3. 组件属性合并

```ts
import { deepMergeObject } from '@bubblesjs/utils'

// React 组件示例
const Button = ({ className, style, ...props }) => {
  const defaultStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px'
  }

  const mergedStyle = deepMergeObject(defaultStyle, style || {})

  return (
    <button
      className={`btn ${className || ''}`}
      style={mergedStyle}
      {...props}
    />
  )
}
```

## 类型定义

```ts
declare function deepMergeObject<T = any>(source: T, target: Partial<T>): T
declare function isPlainObject(data: unknown): data is Record<string, any>
declare function isReadableStream(data: unknown): boolean
declare function tryParseJsonString(data: unknown): unknown
```

## 实现原理

### deepMergeObject 实现原理

1. **递归合并**：对于对象类型的属性，递归调用合并函数
2. **类型检查**：区分普通对象、数组、函数等不同类型
3. **浅复制**：合并对象时创建新对象，未参与递归合并的嵌套值仍可能共享引用

### isReadableStream 实现原理

1. 检查当前环境是否定义了 `ReadableStream`，未定义时返回 `false`
2. 使用 `data instanceof ReadableStream` 判断，不进行特征检测或 TypeScript 类型收窄

## 最佳实践

### 1. 配置管理

```ts
import { deepMergeObject } from '@bubblesjs/utils'

class ConfigManager {
  private defaultConfig: Record<string, any>

  constructor(defaultConfig: Record<string, any>) {
    this.defaultConfig = defaultConfig
  }

  merge(userConfig: Record<string, any>) {
    return deepMergeObject(this.defaultConfig, userConfig)
  }

  // 支持多层合并
  mergeMultiple(...configs: Record<string, any>[]) {
    return configs.reduce((acc, config) => deepMergeObject(acc, config), this.defaultConfig)
  }
}
```

### 2. 响应适配器

```ts
import { isReadableStream } from '@bubblesjs/utils'

class ResponseAdapter {
  static async parse(response: any) {
    // 统一的响应解析逻辑
    if (response?.body && isReadableStream(response.body)) {
      try {
        return await response.json()
      } catch (error) {
        return await response.text()
      }
    }

    return response.data || response
  }
}
```

### 3. 工具函数组合

```ts
import { deepMergeObject, isReadableStream } from '@bubblesjs/utils'

// 创建一个通用的数据处理工具
const createDataProcessor = (defaultOptions = {}) => {
  return {
    process: async (data: any, options = {}) => {
      const mergedOptions = deepMergeObject(defaultOptions, options)

      if (isReadableStream(data)) {
        // 处理流式数据
        const reader = data.getReader()
        // ... 流处理逻辑
      }

      // 处理普通数据
      return processWithOptions(data, mergedOptions)
    },
  }
}
```

## 常见问题

### Q: deepMergeObject 会修改原对象吗？

A: 不会。`deepMergeObject` 会创建一个新对象，不会修改传入的原对象。

```ts
const original = { a: 1, b: { c: 2 } }
const source = { b: { d: 3 } }
const result = deepMergeObject(original, source)

console.log(original) // { a: 1, b: { c: 2 } } - 未被修改
console.log(result) // { a: 1, b: { c: 2, d: 3 } } - 新对象
```

### Q: 如何处理数组合并？

A: 当前实现中，数组会被整体替换。如果需要数组元素合并，可以自定义处理：

```ts
const customMerge = (target, source) => {
  const result = deepMergeObject(target, source)

  // 自定义数组合并逻辑
  if (Array.isArray(target.items) && Array.isArray(source.items)) {
    result.items = [...target.items, ...source.items]
  }

  return result
}
```

### Q: isReadableStream 支持哪些环境？

A: 支持现代浏览器和 Node.js 环境中的 ReadableStream。对于不支持的环境，会安全地返回 false。

## 总结

@bubblesjs/utils 提供了实用的工具函数，特别适合以下场景：

- **配置管理**：使用 `deepMergeObject` 进行灵活的配置合并
- **响应处理**：使用 `isReadableStream` 适配不同的响应类型
- **数据处理**：在各种数据操作场景中提供可靠的工具支持

这些工具函数经过充分测试，可以安全地用于生产环境。
