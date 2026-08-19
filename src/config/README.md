# config — 配置层

> 插件对外的配置面：声明玩家能配什么、默认值是什么、以及运行时去哪里读。

## 这个分层负责什么

- **Schema 声明**：koishi 控制台配置表单（schema.ts 的 `插件配置Schema`）
- **默认值**：各配置块的出厂默认（defaults.ts）
- **运行时配置**：`初始化插件运行时配置()` / `获取运行时配置()` 单例存取（runtime.ts）
- **配置类型**：`PluginConfig` 等类型定义（types.ts）

## 这个分层不负责什么

- 读取配置之后的业务判断 → 各限界上下文
- 信号塔发送、日志等运行逻辑 → 只提供配置数据，不做行为

## 文件结构

```
config/
├── index.ts       # barrel：类型 + 初始化/获取运行时配置 + Schema
├── schema.ts      # 插件配置Schema（koishi Schema 声明）
├── defaults.ts    # 默认Sqids配置 / 默认信号塔配置 / 默认土木工程配置 / 默认地理配置 / 默认联军权限配置
├── runtime.ts     # 初始化插件运行时配置() / 获取运行时配置() / 获取默认联军权限配置()
└── types.ts       # PluginConfig 等类型
```

## 使用方式

```ts
import { 获取运行时配置 } from "#/config";

const 后台群 = 获取运行时配置().信号塔.后台群;
```

入口 `src/index.ts` 在插件 ready 时调用 `初始化插件运行时配置(config)` 注入用户配置。

## 依赖规则（fallow 强制）

- 本层与 shared 同处最底层：**不依赖任何上下文 / interfaces / composition**
- 唯一豁免：schema.ts `import type { TerrainType } from "#ctx/region"`（allowTypeOnly 纯类型豁免，用于地形枚举表单）
- 被所有层引用（配置人人可读，改配置只此一处）

## 命名约定（本层特有）

- 默认值常量：`默认<域>配置`（默认信号塔配置、默认地理配置）
- 运行时函数：中文动词短语（初始化插件运行时配置、获取运行时配置）
