import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import type { CoalitionPermission } from "#ctx/coalition/domain/types/联军权限类型";
import type { CoalitionArmy } from "#ctx/coalition/domain/types/联军数据类型";
import type { Army, Battle, CoalitionRank } from "#ctx/military/domain/types/数据类型";
import type { Player } from "#ctx/player/domain/types/基本类型";
import type { PlayerConfig } from "#ctx/player/domain/types/配置类型";
import type { PlayerWarData } from "#ctx/player/domain/types/战争类型";
import type { RegionTerra } from "#ctx/region/domain/types/地貌类型";
import type { RegionConfig } from "#ctx/region/domain/types/配置类型";
import type { Region } from "#ctx/region/domain/types/数据类型";
import type { RegionStrategy } from "#ctx/region/domain/types/战略类型";
import type { RegionShufflePool, RegionState } from "#ctx/region/domain/types/状态类型";
import type { GlobalData } from "#ctx/world/domain/types/全球数据";
import type { Service } from "#shared/kernel/服务类型";
import { 加载全球数据表 } from "#ctx/world/infrastructure/全球数据表";
import { 加载军事相关表 } from "#ctx/military/infrastructure";
import { 加载地形相关表 } from "#ctx/region/infrastructure";
import { 加载服务表 } from "#ctx/world/infrastructure/服务表";
import { 加载玩家相关表 } from "#ctx/player/infrastructure";
import { 加载联军相关表 } from "#ctx/coalition/infrastructure";

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
