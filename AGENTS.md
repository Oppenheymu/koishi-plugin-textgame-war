# AGENTS.md — AI 代理协作指南

本文件供 AI 编码代理（Claude Code / Trae / Cursor 等）阅读。做人先读这里，再动手。

## 项目概况

- Koishi 聊天机器人插件：多平台文字战争游戏（简称"文游"）
- 语言：TypeScript（strict 全开），**代码标识符用中文**（函数/变量/类型均为中文命名）
- 模块系统：**NodeNext**（相对导入必须带 `.js` 扩展名）
- 构建：esbuild（经父 workspace 的 yakumo 打包），**不要直接 `node` 跑 src 下的 TS/JS**
- 架构：DDD 限界上下文 + 分层，边界由 fallow 守护（见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)）

## 验证命令（改完必须全部通过）

```bash
npx tsc --noEmit        # 类型检查，0 错误
npx biome check src     # 代码风格，全绿
npx fallow dead-code    # 架构边界 + 死代码，0 issues
npx fallow dupes        # 重复率参考值 ~4.1%，别显著推高
```

## 目录速览（各层职责详见对应目录下 README.md）

```
src/
├── composition/    组合根：装配一切（唯一可引用所有层的地方）
├── config/         配置：koishi Schema、默认值、运行时配置
├── contexts/       ★ 限界上下文：核心业务（7 个上下文，内部 domain/application/infrastructure 三层）
├── infrastructure/ 技术基础设施：随机数/Sqids/版本日志/插件加载 等纯工具
├── interfaces/     接口适配层：聊天指令（commands）+ 管理指令（admin）
└── shared/         共享内核：格式化/会话/违禁词/事件/跨域类型
```

## 硬性规则

### 导入

- 相对导入**必须带 `.js`**：`import { x } from "./共享.js"`（NodeNext 要求，`.ts` 源文件也要写 `.js`）
- 别名导入**不带扩展名**：
  - `#/xxx` → `src/xxx`（config / infrastructure / composition / interfaces）
  - `#ctx/xxx` → `src/contexts/xxx`（跨上下文**只用根 barrel**：`#ctx/military`，禁止 `#ctx/military/domain/...` 深入别人家）
  - `#shared/xxx` → `src/shared/xxx`
- 上下文内部互访用深路径（如 `#ctx/military/domain/battle/骰子结算`）
- 唯一豁免：`ctx-beacon` 允许深读 `ctx-coalition`、`ctx-region`（支撑上下文，已在 .fallowrc.json 备案）

### 命名约定（详见 docs/ARCHITECTURE.md 第二节）

| 对象 | 规则 | 正例 | 反例 |
|---|---|---|---|
| 架构/技术/子域目录 | 英文 kebab-case | `domain` `application` `battle` `gdp-stats` | `战斗` `生产总值统计` |
| interfaces 指令分组目录 | 中文，**不带「相关」** | `查询` `权限` `生命周期` | `查询相关` |
| 业务文件 | 中文名 | `工单服务.ts` `制取.ts` | |
| 技术文件 | 英文小写 | `index.ts` `types.ts` `utils.ts` | |
| 数据表文件 | 中文 + 「表」后缀 | `玩家配置表.ts` | `player-config.ts` |
| 指令数组导出 | `<分组>指令` | `查询指令` `跨端指令` | `查询相关指令` `个人相关` |
| 装配数组 | `<域>插件列表`/`<域>服务列表` | `军事服务列表` | |

### 分层依赖（fallow boundaries 强制）

```
composition → 一切
interfaces  → ctx 根 barrel + shared + config/infrastructure
contexts    → 其他 ctx 根 barrel + shared + config
shared/config → 只有 config（对 ctx 仅 allowTypeOnly 类型豁免）
```

违反会直接被 `npx fallow dead-code` 报 boundary violation。

### 指令注册模式

新指令文件导出 `export function xxx指令(ctx: Context)`，内部 `ctx.command(...).action(...)`，然后在对应分组的 `index.ts` 汇入指令数组，最终由 composition/指令集.ts 装配。指令 action 内惯例：`try { ...守卫检查 → 领域工作流 } catch (e) { return (e as Error).message }`。

## 已知陷阱

- **Windows + IDE 句柄锁**：`git mv` 目录偶发 Permission denied，逐文件 mv 再删空目录即可
- **运行时 JSON 资产**：`new URL("../../../assets/xxx.json", import.meta.url)` 依赖构建后目录结构，改目录层级时要同步改相对层数
- **fallow 的 dynamicallyLoaded**：war/ 指令目录等 17 个未接线模块已登记在 .fallowrc.json，勿删
- **biome 导入排序**：中文导入路径排序不理想时，文件头加 `// biome-ignore assist/source/organizeImports: 中文不好排序啊`
- **lib/ 目录**：旧结构构建产物，不代表当前源码结构，勿参考

## 文档地图

| 文档 | 内容 |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 整体架构、依赖规则、上下文清单、命名约定全文 |
| [src/contexts/README.md](src/contexts/README.md) | 限界上下文层 |
| [src/interfaces/README.md](src/interfaces/README.md) | 接口适配层 |
| [src/shared/README.md](src/shared/README.md) | 共享内核 |
| [src/infrastructure/README.md](src/infrastructure/README.md) | 技术基础设施 |
| [src/config/README.md](src/config/README.md) | 配置层 |
| [src/composition/README.md](src/composition/README.md) | 组合根 |
| [HANDOVER.md](HANDOVER.md) | DDD 重构过程记录、遗留项 |
