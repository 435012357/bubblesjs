# Request Package Tests

这个目录包含了 `@bubblesjs/request` 包的完整测试套件。

## 测试文件

- `tests/index.test.ts` - 主要的单元测试，包含：
  - `createInstance` 函数测试
  - `createDualCallInstance` 函数测试  
  - 配置处理测试
  - 集成场景测试
  - 边界情况测试
  - 类型安全测试

- `tests/response-handler.test.ts` - 响应处理逻辑测试，包含：
  - `beforeRequest` 拦截器测试
  - `onSuccess` 响应处理器测试
  - `onError` 错误处理器测试
  - 复杂响应场景测试

## 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 以监视模式运行测试
npm test -- --watch
```

## 测试覆盖

测试套件涵盖了以下主要功能：

### 核心功能
- ✅ 实例创建和配置合并
- ✅ 双重调用实例工厂
- ✅ HTTP 方法绑定
- ✅ 请求拦截器
- ✅ 响应处理器
- ✅ 错误处理器

### 配置选项
- ✅ baseUrl 配置
- ✅ timeout 配置
- ✅ commonHeaders（静态和动态）
- ✅ statusMap 配置
- ✅ codeMap 配置
- ✅ 响应数据键配置
- ✅ 消息提示配置
- ✅ 回调函数配置

### 响应处理
- ✅ HTTP 状态码处理
- ✅ 业务代码处理
- ✅ 成功消息显示
- ✅ 错误消息显示
- ✅ 未授权处理
- ✅ 响应数据转换
- ✅ 流式响应处理

### 边界情况
- ✅ 空配置处理
- ✅ 无效参数处理
- ✅ 回调函数缺失
- ✅ 网络错误处理
- ✅ 类型安全检查

## 测试策略

测试采用了以下策略：

1. **单元测试**：每个函数的独立测试
2. **集成测试**：组合功能的端到端测试
3. **边界测试**：异常情况和边界值测试
4. **Mock测试**：使用 Vitest mock 模拟外部依赖
5. **类型测试**：TypeScript 类型安全验证

## Mock说明

测试中使用了以下Mock：

- `alova` - 模拟 Alova 请求库
- `alova/fetch` - 模拟 fetch 适配器
- `@bubblesjs/utils` - 模拟工具函数

Mock设计确保了：
- 测试隔离性
- 可预测的结果
- 快速执行
- 完整的功能覆盖

## 贡献指南

添加新测试时请遵循：

1. 使用描述性的测试名称
2. 遵循 AAA 模式（Arrange, Act, Assert）
3. 为每个边界情况编写测试
4. 确保 Mock 的正确性
5. 保持测试的独立性