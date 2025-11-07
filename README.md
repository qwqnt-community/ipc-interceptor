# QwQNT-ipc_interceptor

统一管理 IPC 事件

### 功能

- 统一管理 IPC 注入事件，避免每个插件重复代理导致的性能问题

### 使用方法

在 `package.json` 中添加`ipc_interceptor` 依赖

```json
"qwqnt":{
  "dependencies": {
    "ipc_interceptor": "^1.2.0"
  }
}
```

在 `main` 进程中使用全局 `IpcInterceptor` 对象即可

使用演示：

```js
IpcInterceptor.onIpcSend((...args) => {
  // ...your code
});
```

## 使用本插件的 TypeScript 类型

本插件提供了类型定义文件 [proxyIpcMessage.d.ts](/src/types/proxyIpcMessage.d.ts)，为了在 TypeScript 中获得类型提示，你需要手动将其拷贝到你的项目中。

### 构建方法

- `pnpm i`
- `pnpm run build`
