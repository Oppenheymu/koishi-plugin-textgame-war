# DDD 重构交接文档

> 供后续会话/Reviewer 使用。本次重构将"按技术分层"的目录结构重组为"按限界上下文"，并拆分了全部 godfile。

## 一、当前架构

```
src/
├── index.ts                  # 插件入口（组合根的装配点）
├── config/                   # 插件配置（koishi Schema、运行时配置）
├── infrastructure/           # 技术基础设施（随机数/Sqids/插件加载/游戏资源/版本日志）
├── contexts/                 # ★ 限界上下文（核心）
│   ├── player/               # 玩家：注册/资料/工人/科技/守卫/更新
│   ├── coalition/            # 联军：生命周期/权限/政体/贡献/统计
│   ├── region/               # 地区：地理(geography)/建筑(construction)/守卫/权限/分配
│   ├── military/             # 军事：军队工作流(workflow)/战斗(battle)/属性聚合/行军
│   ├── beacon/               # 信号塔：新闻/地区/联军/后台通知
│   ├── naming/               # 改名审核工单
│   └── world/                # 世界：地图生成(mapgen)/统计(stats)/调度(scheduler)/全球数据
│   └── <每个上下文内部：domain/（领域）+ application/（用例）+ infrastructure/（数据表）>
├── shared/                   # 共享内核：格式化/会话/目标解析(target)/违禁检查/事件/跨域类型
├── interfaces/               # 接口适配层
│   ├── commands/             # 原"指令集"（region/coalition/player/military/common/war）
│   └── admin/                # 原"管理集"
└── composition/              # 组合根：数据库服务/服务集/指令集/管理集 的装配
```

### 上下文内部结构（以 military 为例）

```
contexts/military/
├── index.ts            # 上下文唯一公共出口（re-export domain+application+infrastructure）
├── domain/             # 领域层（纯逻辑）
│   ├── types/          # 领域类型
│   ├── battle/         # 战斗结算子域（骰子/伤害/撤退/战报/结束/单场/入口/恢复/统计）
│   └── workflow/       # 军队工作流子域（组建/解散/命名/装备/兵力/进军/命令/任命）
├── application/        # 应用层（战斗调度 cron）
└── infrastructure/     # 数据表（军队表/战斗表/军衔表）
```

## 二、路径别名（tsconfig paths + package.json imports 双轨）

| 别名 | 指向 | 用途 |
|---|---|---|
| `#/xxx` | `src/xxx` | config/infrastructure/composition/interfaces |
| `#ctx/xxx` | `src/contexts/xxx` | 限界上下文（推荐只用根：`#ctx/military`） |
| `#shared/xxx` | `src/shared/xxx` | 共享内核 |

## 三、边界规则（.fallowrc.json boundaries，用 fallow 守护）

1. **上下文间只准 import 对方根 barrel**（`#ctx/<name>`），禁止深入 `#ctx/<name>/domain/...`
2. interfaces（指令层）→ 只准 ctx 根 + shared + config/infrastructure
3. contexts → 允许其他 ctx 根 + shared + config；**禁止 ctx 深层互访**
   - 例外：`ctx-beacon` 允许深读各上下文（beacon 是支撑上下文，需读领域查询；用根 barrel 会造成循环，见"遗留项"）
4. shared / config 处于最底层：只允许 config；对 ctx 仅 `allowTypeOnly`（类型依赖豁免）
5. composition 装配层：允许一切 ctx 深层 + interfaces

验证命令：`npx fallow dead-code`（boundary_violations 应为 2，见遗留项）。

## 四、本次拆分的 godfile

| 原文件 | 拆分结果 |
|---|---|
| 战斗结算.ts (25KB) | military/domain/battle/ 9 个子模块 |
| 军队工作流.ts (16KB) | military/domain/workflow/ 9 个子模块 |
| 查询指令.ts (14.5KB) | interfaces/commands/military/查询/ 5 个文件 |
| 地图生成/index.ts (13.7KB) | world/application/mapgen/ 6 个子模块 + barrel |
| 加入联军.ts (13KB) | 邀请加入联军.ts + 同意加入联军.ts + 共享.ts |
| 军事生产.ts (12.9KB) | + 军事生产物品库.ts + 军事生产结算.ts |
| 修建.ts (10.6KB) | + 修建建筑库.ts + 修建结算.ts |
| 组建联军.ts (10.4KB) | + 组建联军校验.ts + 组建联军写入.ts |
| 全服统计.ts (8.7KB) | 保持（单一用例，已有辅助函数拆分） |

## 五、验证基线（全部通过）

```
npx tsc --noEmit          # 0 错误
npx biome check src       # 全绿
npx fallow dead-code      # total 4：boundary 2（遗留）+ circular 0 + unused type 1（遗留）
npx fallow dupes          # 4.20%（基线 6.67%）
```

## 六、遗留项（下次会话可处理）

1. **shared/target 反向依赖上下文（2 个 boundary violation）**
   `shared/target/玩家.ts` → `#ctx/player`、`shared/target/联军.ts` → `#ctx/coalition`（值引用）。
   目标解析本质是接口层关注点，建议整体迁到 `src/interfaces/commands/common/target/`，并同步更新 ~16 个引用文件。迁移后 boundary violations 归零。

2. **beacon 深读各上下文的豁免**
   `ctx-beacon` 规则放行了深层互访（否则 beacon↔coalition 经根 barrel 成环）。
   更优解法是依赖倒置：coalition 统计完成时发出领域事件（shared/events 已有 EventEmitter），beacon 订阅并发通知，即可收回该豁免。

3. **unused type：`联军邀请记录`**（interfaces/commands/coalition/生命周期/共享.ts）
   该类型有 2 处出现但仅文件内使用，可直接去掉 export 关键字。

4. **war/ 指令目录与 17 个未接线模块**：在 .fallowrc.json `dynamicallyLoaded` 中保留（用户指示暂不处理）。

## 七、其他说明

- 迁移用一次性脚本完成（已清理），git 历史里 `5e7f0cd` 是迁移中间态提交，其后还有一次 godfile 拆分与边界治理的未提交改动（本次成果）。
- Windows 下 git 索引与磁盘目录大小写不一致的历史问题（Models/Services 大写）已随迁移消除。
- NodeNext 要求：相对导入必须带 `.js`；上下文内部互访建议直接深路径（如 `#ctx/military/domain/battle/骰子结算`），跨上下文一律根 barrel。
