import type { Context } from 'koishi';
import type {
    CoalitionArmy,
    CoalitionPermission,
    GlobalData,
    PendingRailwayBuild,
    Player,
    PlayerConfig,
    PlayerWarData,
    Region,
    RegionConfig,
    RegionShufflePool,
    RegionState,
    RegionStrategy,
    RegionTerra,
    Service,
} from '@/types';
import { 批量加载插件 } from '@/infrastructure';
import { 加载全球数据表 } from './全球数据表';
import { 加载地形相关表 } from './地区相关';
import { 加载服务表 } from './服务表';
import { 加载玩家相关表 } from './玩家相关';
import { 加载联军相关表 } from './联军相关';

// 扩展 Koishi 数据表类型定义

declare module 'koishi' {
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
        马列铁路修建申请表: PendingRailwayBuild;

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
];

// 统一挂载所有数据库相关服务
export function 数据库服务(ctx: Context) {
    批量加载插件(ctx, 数据库插件列表, '数据库服务模块');
}
