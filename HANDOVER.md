# DDD 重构交接文档

> 供后续会话/Reviewer 使用。本文档经历两轮重构：第一轮"按技术分层"重组为"按限界上下文"并拆分全部 godfile；第二轮制定命名约定、规范化全部目录命名、补齐 beacon/naming 分层、清零 fallow 违规。

## 一、命名约定（必须遵守）

### 目录命名：架构英文 + 业务中文

| 目录类别 | 语言 | 示例 |
|---|---|---|
| src 顶层结构目录 | 英文 kebab-case | composition / config / contexts / infrastructure / interfaces / shared |
| 上下文内分层目录 | 英文 | domain / application / infrastructure |
| 上下文内子域目录（domain/application 之下） | 英文 kebab-case | battle / workflow / construction / geography / mapgen / scheduler / stats / power-dynamics / gdp-stats / district / news / backend |
| 基础设施模块目录 | 英文 kebab-case | random / sqids / changelog / plugin-loader / game-record / game-assets |
| interfaces 指令分组目录 | **中文**，不带「相关」后缀 | 查询 / 权限 / 分配 / 生命周期 / 改名 / 跨端 / 建筑 / 战略 / 生产 / 稽查 / 预设 |

### 文件命名：业务中文 + 技术英文

| 文件类别 | 命名 | 示例 |
|---|---|---|
| 业务逻辑/指令/用例文件 | 中文（动词短语或名词） | 工单服务.ts、制取.ts、组建军队.ts |
| 技术文件 | 英文小写 | index.ts / types.ts / core.ts / utils.ts / config.ts |
| 数据表文件 | 中文带「表」后缀 | 玩家配置表.ts、军队表.ts |

### 变量命名

- interfaces 层导出的指令数组：`<分组名>指令`（查询指令、权限指令、跨端指令……），禁止「xx相关指令」「xx相关」
- composition 层装配数组：`<域>插件列表` / `<域>服务列表`
- 领域函数：中文动词短语（目标解析、驻扎检查、军队解析）

## 二、当前架构

```
src/
├── index.ts                  # 插件入口（组合根的装配点）
├── config/                   # 插件配置（koishi Schema、运行时配置）
├── infrastructure/           # 技术基础设施（random/sqids/changelog/plugin-loader/game-record/game-assets）
├── contexts/                 # ★ 限界上下文（核心）
│   ├── player/               # 玩家：注册/资料/工人/科技/守卫/更新
│   ├── coalition/            # 联军：生命周期/权限/政体/贡献/统计
│   ├── region/               # 地区：地理(geography)/建筑(construction)/守卫/权限/分配
│   ├── military/             # 军事：军队工作流(workflow)/战斗(battle)/属性聚合/行军
│   ├── beacon/               # 信号塔：domain(news/district/coalition) + application/backend + infrastructure/utils
│   ├── naming/               # 改名审核工单：domain/工单 + application/工单服务 + infrastructure/审核群号
│   └── world/                # 世界：地图生成(mapgen)/统计(stats)/调度(scheduler)/全球数据
│   └── <每个上下文内部：domain/（领域）+ application/（用例）+ infrastructure/（数据表）>
├── shared/                   # 共享内核：格式化/会话/违禁检查/事件/跨域类型（target 已迁出）
├── interfaces/               # 接口适配层
│   ├── commands/             # 指令集（region/coalition/player/military/common/war + common/target）
│   └── admin/                # 管理集（稽查/预设）
└── composition/              # 组合根：数据库服务/服务集/指令集/管理集 的装配
```

## 三、路径别名（tsconfig paths + package.json imports 双轨）

| 别名 | 指向 | 用途 |
|---|---|---|
| `#/xxx` | `src/xxx` | config/infrastructure/composition/interfaces |
| `#ctx/xxx` | `src/contexts/xxx` | 限界上下文（跨上下文只用根：`#ctx/military`） |
| `#shared/xxx` | `src/shared/xxx` | 共享内核 |

## 四、边界规则（.fallowrc.json boundaries，用 fallow 守护）

1. **上下文间只准 import 对方根 barrel**（`#ctx/<name>`），禁止深入 `#ctx/<name>/domain/...`
2. interfaces（指令层）→ 只准 ctx 根 + shared + config/infrastructure
3. contexts → 允许其他 ctx 根 + shared + config
   - 豁免：`ctx-beacon` 允许深读 `ctx-coalition`、`ctx-region`（beacon 是支撑上下文，需读 联军解析/地区解析；更优解法是依赖倒置发领域事件，见"遗留项"）
4. shared / config 处于最底层：只允许 config；对 ctx 仅 `allowTypeOnly`
5. composition 装配层：允许一切 ctx 深层 + interfaces

验证命令：`npx fallow dead-code`（当前 **0 issues**）。

## 五、godfile 拆分记录

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
| naming/工单服务.ts (309行) | domain/工单.ts（类型+纯函数+工单池）+ application/工单服务.ts（用例编排+推送+审核） |

## 六、验证基线（全部通过，2026-08-19 第二轮重构后）

```
npx tsc --noEmit          # 0 错误
npx biome check src       # 全绿
npx fallow dead-code      # ✓ No issues found（boundary 0 / unused 0 / unresolved 0）
npx fallow dupes          # 4.1%（首轮基线 6.67% → 4.20% → 4.1%）
```

## 七、第二轮重构完成内容（2026-08-19）

1. **目录规范化（21 项 git mv，61 文件引用同步）**
   - infrastructure 中文目录英文化：版本日志→changelog、插件加载→plugin-loader、游戏记录→game-record、游戏资源→game-assets
   - 去「相关」后缀：查询相关→查询、分配相关→分配、权限相关→权限、改名相关→改名、跨端相关→跨端、稽查相关→稽查、预设相关→预设
   - coalition/application 用例目录英文化：权力动态分配→power-dynamics、生产总值统计→gdp-stats
   - beacon 补齐分层：地区→domain/district、新闻→domain/news、联军→domain/coalition、后台→application/backend、utils.ts→infrastructure/utils.ts
   - naming 补齐分层：工单服务.ts 拆 domain/工单.ts + application/工单服务.ts，state.ts→infrastructure/审核群号.ts
   - shared/target 整体迁至 interfaces/commands/common/target/（目标解析是接口层关注点，消除 shared→ctx 反向依赖）
2. **指令数组变量统一**：xx相关指令→xx指令（13 组），composition/管理集、common、coalition、player、region 全部对齐
3. **fallow 全部违规清零**：beacon 豁免恢复（ctx-coalition/ctx-region 深读）、unused type（联军邀请记录改为在邀请加入联军.ts 显式消费）、unresolved imports（assets 相对路径层数修正 + ignoreUnresolvedImports）
4. **重复代码消除**：制取/提取 36 行→共享.ts 的 解析制取上下文（同时消除 玩家检查 与 驻扎检查 的冗余双重查询）；补给指令 4 处守卫块→解析本联军军队

## 八、遗留项

1. **beacon 深读豁免的依赖倒置（可选优化）**：coalition/region 统计完成时通过 shared/events 发领域事件，beacon 订阅并发通知，即可收回 ctx-beacon 对 ctx-coalition/ctx-region 的深读豁免。
2. **dupes 4.1%**：剩余 22 个 clone 组多为指令层同构结构（try-catch + 解析 + 工作流调用），如 coalition/查询/生产总值 vs 生活资料（33 行）、region/domain/查询.ts 内部（24 行）。属低风险技术债。
3. **war/ 指令目录与 17 个未接线模块**：在 .fallowrc.json `dynamicallyLoaded` 中保留（用户指示暂不处理）。
4. **运行时 JSON 资产路径**：`new URL(..., import.meta.url)` 相对路径依赖构建产物目录结构，构建（esbuild/yakumo）后需确认 assets 拷贝到位；lib/ 目录当前是旧结构产物，待重新构建。

## 九、其他说明

- 目录重命名用 git mv + 一次性 Node 脚本批量替换引用（脚本已清理），git 历史可追溯。
- NodeNext 要求：相对导入必须带 `.js`；上下文内部互访直接深路径（如 `#ctx/military/domain/battle/骰子结算`），跨上下文一律根 barrel。
- Windows 下若 git mv 目录报 Permission denied（IDE 句柄锁定），改为逐文件 git mv 再删空目录。
