# infrastructure — 技术基础设施

> 与业务无关的纯技术工具。任何层都可安全引用。

## 这个分层负责什么

- **随机数**：`TRandom()` 三角分布随机（random/）
- **短 ID 生成**：Sqids 编码（注册号、联军编号）（sqids/）
- **插件加载**：`批量加载插件()` 通用装配器（plugin-loader/）
- **服务记录**：`确保服务记录()` 游戏记录表（game-record/）
- **版本日志**：读取/格式化根目录 assets/版本日志.json（changelog/）
- **游戏资源**：资源目录定位、随机图片（game-assets/）

## 这个分层不负责什么

- 任何业务规则 → [contexts/](../contexts/)
- 与业务耦合的"服务类型" → 类型定义在 [shared/kernel/服务类型](../shared/kernel/)，本层仅 `import type`

## 目录结构

```
infrastructure/
├── index.ts           # barrel
├── random/            # TRandom() 三角分布随机数
├── sqids/             # 获取注册Sqids() / 获取联军Sqids()
├── plugin-loader/     # 批量加载插件() —— composition 装配的基础
├── game-record/       # 确保服务记录()
├── changelog/         # 版本日志读取与格式化
└── game-assets/       # 目录查找.ts + 随机图片.ts
```

## 设计原则

1. **零业务逻辑**：不依赖任何限界上下文（仅 allowTypeOnly 引用 shared/kernel 类型）
2. **目录命名英文 kebab-case**：2026-08 已从中文目录名（版本日志/插件加载/游戏记录/游戏资源）统一迁移
3. **对外统一走 barrel**：`import { 批量加载插件 } from "#/infrastructure"`，内部文件用 `#/infrastructure/<模块>/xxx` 深路径互访

## 已知注意点

- changelog 与 game-assets 通过 `new URL("../../../assets/...", import.meta.url)` 定位根目录资产，**目录层级变化必须同步调整相对层数**
