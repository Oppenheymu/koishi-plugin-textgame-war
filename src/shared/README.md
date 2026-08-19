# shared — 共享内核（Shared Kernel）

> 所有上下文共同依赖的最底层公共模块。放"到处都要用、但不含具体业务规则"的东西。

## 这个分层负责什么

- **格式化**：`格式化()` 数字千分位等文本工具（format.ts）
- **会话守卫**：`会话检查()` 等通用 session 校验（session/）
- **违禁词检查**：`检查违禁词()`（profanity/，敏感词库在根目录 assets/SensitiveLexicon.json）
- **领域事件**：EventEmitter 与事件助手（events/），供上下文间解耦通知（目标形态）
- **跨域类型**：多个上下文共同引用的类型别名与结果类型（kernel/）

## 这个分层不负责什么

- 任何具体业务的规则（战斗、生产、权限……）→ 各限界上下文
- 与业务无关的纯技术工具（随机数、Sqids）→ [infrastructure/](../../infrastructure/)
- 目标解析已迁至 [interfaces/commands/common/target/](../interfaces/commands/common/target/)（它依赖玩家/联军上下文，属于接口层关注点）

## 目录结构

```
shared/
├── index.ts           # barrel（events + format + profanity + session）
├── format.ts          # 格式化()
├── events/            # 领域事件：events.ts（EventEmitter）+ helpers.ts
├── kernel/            # 跨域类型：跨域类型.ts、服务类型.ts（不经 barrel，按 #shared/kernel/xxx 深路径引用）
├── profanity/         # 违禁词：检查违禁词.ts + 构建匹配树.ts
└── session/           # 会话守卫
```

注意：`kernel/` 不在 shared/index.ts barrel 中（避免类型污染全量导出），消费方用 `#shared/kernel/跨域类型` 深路径导入。

## 依赖规则（fallow 强制）

本层处于**最底层**：

- 允许引用：`#/config`（仅此一家）
- **禁止**引用任何上下文、interfaces、composition
- 对上下文只有 `allowTypeOnly` 类型豁免：kernel 里的类型别名（如 `玩家完整资料 = Player & PlayerWarData`）可以 `import type` 自 `#ctx/*`

> 反例教训：shared/target 曾因值引用 `#ctx/player` 造成反向依赖，已迁出。往 shared 加东西前先问一句：它需要 import 上下文的**值**吗？需要就不属于这里。
