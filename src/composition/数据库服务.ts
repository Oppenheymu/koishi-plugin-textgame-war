import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import type { CoalitionArmy, CoalitionPermission } from "#ctx/coalition";
import { 加载联军相关表 } from "#ctx/coalition";
import type { Army, Battle, CoalitionRank } from "#ctx/military";
import { 加载军事相关表 } from "#ctx/military";
import type { Player, PlayerConfig, PlayerWarData } from "#ctx/player";
import { 加载玩家相关表 } from "#ctx/player";
import type {
    Region,
    RegionConfig,
    RegionShufflePool,
    RegionState,
    RegionStrategy,
    RegionTerra,
} from "#ctx/region";
import { 加载地形相关表 } from "#ctx/region";
import type { GlobalData } from "#ctx/world";
import { 加载全球数据表, 加载服务表 } from "#ctx/world";
import type { Service } from "#shared/kernel/服务类型";

// 扩展 Koishi 数据表类型定义

declare module "koishi" {
    interface Tables {
        马列联军表: CoalitionArmy;
        马列联军权限表: CoalitionPermission;

        马列全球数据表: GlobalData;

        马列玩家表: Player;
        马列玩家战争表: PlayerWarData;
        马列玩家配置表: PlayerConfig;

        马列地区表: Region;
        马列地区配置表: RegionConfig;
        马列地区地形表: RegionTerra;
        马列地区状态机: RegionState;
        马列地区战略表: RegionStrategy;
        马列地区洗牌池: RegionShufflePool;

        马列联军军衔表: CoalitionRank;
        马列军队表: Army;
        马列战斗表: Battle;

        马列服务表: Service;
    }
}

// 按顺序注册数据库模型插件
const 数据库插件列表 = [
    加载全球数据表,
    加载服务表,
    ...加载玩家相关表,
    ...加载联军相关表,
    ...加载地形相关表,
    ...加载军事相关表,
];

// 统一挂载所有数据库相关服务
export function 数据库服务(ctx: Context) {
    批量加载插件(ctx, 数据库插件列表, "数据库服务模块");
}
