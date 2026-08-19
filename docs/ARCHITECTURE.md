# ARCHITECTURE — 整体架构

> 项目按 DDD（领域驱动设计）组织：先按**限界上下文**切分业务，上下文内部再按**分层架构**（domain / application / infrastructure）。层间依赖方向由 [.fallowrc.json](../.fallowrc.json) 的 boundaries 规则强制守护。

## 一、架构总览

```
                        ┌──────────────┐
                        │  index.ts    │  插件入口
                        └──────┬───────┘
                               │ 装配
                        ┌──────▼───────┐
                        │ composition  │  组合根（可引用一切）
                        └──────┬───────┘
              ┌────────────────┼────────────────┐
              │                │                │
      ┌───────▼──────┐ ┌──────▼───────┐ ┌──────▼──────┐
      │  interfaces  │ │   contexts   │ │   shared    │
      │  指令/管理集  │ │ ★ 限界上下文  │ │  共享内核    │
      └───────┬──────┘ └──────┬───────┘ └─────────────┘
              │               │                ▲
              │        ┌──────▼───────┐        │
              └───────►│   config     │◄───────┘
                      │ infrastructure│
                      └──────────────┘
```

**依赖只会向下/向右，永不向上。** 具体规则：

| 来源层 | 允许引用 |
|---|---|
| index.ts（入口） | composition、config、shared、interfaces、各 ctx 根 |
| composition（组合根） | 一切（含各 ctx 深层模块） |
| interfaces（指令层） | config、shared、infrastructure、**各 ctx 根 barrel** |
| contexts（上下文） | config、shared、**其他 ctx 根 barrel**、自身深层 |
| shared / config | 仅 config；对 ctx 只有 `allowTypeOnly`（纯类型豁免） |

验证：`npx fallow dead-code` → boundary violations 必须为 0。

## 二、六大分层职责

| 分层 | 职责 | 不负责 | 详见 |
|---|---|---|---|
| [src/contexts/](../src/contexts/) | 全部业务逻辑：领域规则、用例编排、数据表定义 | 聊天指令解析、配置声明 | [README](../src/contexts/README.md) |
| [src/interfaces/](../src/interfaces/) | 与用户的对话适配：指令注册、参数解析、回复文案 | 业务规则、数据库访问细节 | [README](../src/interfaces/README.md) |
| [src/shared/](../src/shared/) | 跨上下文共享内核：格式化、会话守卫、违禁词、领域事件、跨域类型 | 任何具体业务的规则 | [README](../src/shared/README.md) |
| [src/infrastructure/](../src/infrastructure/) | 技术基础设施：随机数、Sqids、版本日志、插件加载、游戏资源 | 业务逻辑 | [README](../src/infrastructure/README.md) |
| [src/config/](../src/config/) | 配置声明与存取：koishi Schema、默认值、运行时配置 | 读取配置后的业务判断 | [README](../src/config/README.md) |
| [src/composition/](../src/composition/) | 组合根：装配指令集/服务集/管理集/数据库表 | 业务逻辑 | [README](../src/composition/README.md) |

## 三、限界上下文清单（src/contexts/）

每个上下文是独立业务域，对外只暴露根 `index.ts`（barrel），跨上下文禁止深路径访问。

| 上下文 | 域 | 内部子域 |
|---|---|---|
| `player` | 玩家 | 注册/资料/工人/科技/守卫/更新 |
| `coalition` | 联军 | 生命周期/权限/政体/贡献/查询；用例：power-dynamics、gdp-stats |
| `region` | 地区 | geography（地理）/ construction（建筑）/ 守卫/权限/分配 |
| `military` | 军事 | workflow（军队工作流）/ battle（战斗结算）/ 属性聚合/行军 |
| `beacon` | 信号塔 | domain（news/district/coalition）+ application/backend（后台通知） |
| `naming` | 改名审核 | domain/工单 + application/工单服务 |
| `world` | 世界 | mapgen（地图生成）/ stats（全服统计）/ scheduler（调度）/ 全球数据 |

### 上下文内部三层

```
contexts/<name>/
├── index.ts            # 唯一公共出口（barrel）
├── domain/             # 领域层：实体、类型、纯业务规则、领域服务
│   └── types/          # 领域类型定义
├── application/        # 应用层：用例编排、调度（cron）、跨领域流程
└── infrastructure/     # 基础设施层：koishi 数据表声明与访问
```

依赖方向：`application → domain`、`infrastructure → domain`，domain 不依赖任何兄弟层。

## 四、请求流转示例

以「分配装备」指令为例：

```
用户消息 "分配装备 1 步兵装备 100"
  → interfaces/commands/military/补给指令.ts   解析参数、try-catch
      → #ctx/coalition 玩家联军检查()           守卫（根 barrel 导入）
      → #ctx/military 军队解析() / 分配装备工作流()   领域工作流
          → military/domain/workflow/*           纯业务规则
          → military/infrastructure/军队表.ts    数据落库
  → 返回文案给用户
```

指令层薄、领域层厚：interfaces 只做"解析 + 调用 + 组装文案"，规则全部下沉到 contexts。

## 五、路径别名（双轨机制）

tsconfig `paths`（类型检查）+ package.json `imports`（esbuild 打包）两处同时生效：

| 别名 | 指向 | 用法 |
|---|---|---|
| `#/xxx` | `src/xxx` | config / infrastructure / composition / interfaces |
| `#ctx/xxx` | `src/contexts/xxx` | 跨上下文只用根（`#ctx/military`）；上下文内部可深路径 |
| `#shared/xxx` | `src/shared/xxx` | 共享内核 |

`#utils/*`、`#logic/*` 已配置但当前未使用，勿新增引用。

## 六、命名约定全文

### 目录

| 目录类别 | 语言 | 示例 |
|---|---|---|
| src 顶层结构目录 | 英文 kebab-case | composition / config / contexts / infrastructure / interfaces / shared |
| 上下文内分层目录 | 英文 | domain / application / infrastructure |
| 上下文内子域目录 | 英文 kebab-case | battle / workflow / construction / geography / mapgen / scheduler / stats / power-dynamics / gdp-stats / district / news / backend |
| 基础设施模块目录 | 英文 kebab-case | random / sqids / changelog / plugin-loader / game-record / game-assets |
| interfaces 指令分组目录 | 中文，不带「相关」后缀 | 查询 / 权限 / 分配 / 生命周期 / 改名 / 跨端 / 建筑 / 战略 / 稽查 / 预设 |

### 文件

| 文件类别 | 命名 | 示例 |
|---|---|---|
| 业务逻辑/指令/用例文件 | 中文（动词短语或名词） | 工单服务.ts、制取.ts、组建军队.ts |
| 技术文件 | 英文小写 | index.ts / types.ts / core.ts / utils.ts / config.ts |
| 数据表文件 | 中文带「表」后缀 | 玩家配置表.ts、军队表.ts |

### 标识符

- 指令数组导出：`<分组名>指令`（查询指令、跨端指令），禁止「xx相关」「xx相关指令」
- 装配数组：`<域>插件列表` / `<域>服务列表`
- 领域函数：中文动词短语（目标解析、驻扎检查、军队解析）
- 代码内标识符一律中文，与项目既有风格保持一致

## 七、构建与验证

```bash
npx tsc --noEmit        # 类型检查（NodeNext：相对导入带 .js）
npx biome check src     # 风格检查
npx fallow dead-code    # 边界 + 死代码（必须 0 issues）
npx fallow dupes        # 重复率（当前 ~4.1%）
```

生产构建由父 workspace 的 yakumo/esbuild 完成，产物进 `lib/`。运行时 JSON 资产位于根目录 `assets/`，通过 `new URL(..., import.meta.url)` 相对定位——**移动源文件目录层级时必须同步调整相对层数**。
