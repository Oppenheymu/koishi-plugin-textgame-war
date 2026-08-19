# contexts — 限界上下文（核心业务层）

> 全部业务逻辑的家。每个子目录是一个独立的限界上下文（Bounded Context），代表一块自洽的业务域。

## 这个分层负责什么

- **领域规则**：战斗如何结算、联军权限如何判定、资源如何生产——所有"游戏规则"都在这里
- **用例编排**：跨多个领域对象的业务流程（如改名审核工单的创建→推送→审核）
- **数据表声明**：koishi 数据库表的 model 定义与访问（各上下文 `infrastructure/` 下）
- **定时调度**：cron 任务（战斗调度、生产统计、地图重置等，各上下文 `application/` 下）

## 这个分层不负责什么

- 聊天指令的注册、参数解析、回复文案拼装 → [interfaces/](../interfaces/)
- 配置声明 → [config/](../config/)
- 与业务无关的纯技术工具 → [infrastructure/](../../infrastructure/)

## 上下文清单

| 上下文 | 业务域 | 内部子域 |
|---|---|---|
| `player/` | 玩家 | 注册 / 资料 / 工人 / 科技 / 守卫 / 更新 |
| `coalition/` | 联军 | 生命周期 / 权限 / 政体 / 贡献 / 查询；用例：power-dynamics（权力动态分配）、gdp-stats（生产总值统计） |
| `region/` | 地区 | geography（地理）/ construction（建筑）/ 守卫 / 权限 / 分配 |
| `military/` | 军事 | workflow（军队工作流）/ battle（战斗结算）/ 属性聚合 / 行军 |
| `beacon/` | 信号塔 | domain（news 新闻 / district 地区 / coalition 联军通报）+ application/backend（后台日志通知） |
| `naming/` | 改名审核 | domain/工单（类型与纯函数）+ application/工单服务（用例编排）+ infrastructure/审核群号 |
| `world/` | 世界 | mapgen（地图生成）/ stats（全服统计）/ scheduler（每时/每日调度）/ 全球数据 |

## 上下文内部结构（统一模板）

```
contexts/<name>/
├── index.ts            # 唯一公共出口（barrel），外部只能从这里导入
├── domain/             # 领域层：实体、types/、纯业务规则、领域服务
├── application/        # 应用层：用例编排、cron 调度、跨领域流程
└── infrastructure/     # 基础设施层：数据表声明与访问（文件名带「表」后缀）
```

依赖方向：`application → domain`，`infrastructure → domain`；domain 不依赖兄弟层。

## 依赖规则（fallow 强制）

- **对外**：跨上下文只准 `import ... from "#ctx/<name>"`（根 barrel），禁止深入 `#ctx/<name>/domain/...`
- **对内**：上下文内部互访直接深路径（如 `#ctx/military/domain/battle/骰子结算`）
- 允许引用：`#shared/*`、`#/config`、其他上下文根 barrel
- **唯一豁免**：beacon 允许深读 coalition / region 的领域查询（支撑上下文，已在 .fallowrc.json 备案；长期目标是依赖倒置为领域事件）

## 命名约定（本层特有）

| 对象 | 规则 | 示例 |
|---|---|---|
| 上下文目录 | 英文小写（业务域名） | `player` `coalition` `beacon` |
| 子域目录 | 英文 kebab-case | `battle` `workflow` `power-dynamics` `gdp-stats` |
| 领域/用例文件 | 中文 | `骰子结算.ts` `工单服务.ts` `组建军队.ts` |
| 领域类型目录 | `types/`，文件中文 +「类型」 | `联军权限类型.ts` `战争类型.ts` |
| 数据表文件 | 中文 +「表」后缀 | `军队表.ts` `玩家配置表.ts` |
| 领域函数 | 中文动词短语 | `目标解析` `驻扎检查` `分配装备工作流` |
| 装配数组 | `<域>服务列表` | `军事服务列表` `联军服务列表` |
