import { Context } from "koishi";

import { 批量加载插件 } from "../utils/插件加载器";

import {
    CoalitionArmy,
    GlobalData,
    Player,
    PlayerConfig,
    Region,
    RegionConfig,
    RegionTerra,
    RegionState,
    RegionShufflePool,
    Service,
} from "../types/index";

import { 加载联军表 } from "./联军数据表";
import { 加载全球数据表 } from "./全球数据表";
import { 加载玩家配置表 } from "./玩家配置表";
import { 加载玩家表 } from "./玩家数据表";
import { 加载地形相关表 } from "./地区相关";
import { 加载服务表 } from "./服务表";


// 扩展 Koishi 数据表类型定义
declare module "koishi" {
    interface Tables {
        马列联军表: CoalitionArmy;

        马列全球数据表: GlobalData;

        马列玩家表: Player;
        马列玩家配置表: PlayerConfig;

        马列地区表: Region;
        马列地区配置表: RegionConfig;
        马列地区地形表: RegionTerra;
        马列地区状态机: RegionState;
        马列地区洗牌池: RegionShufflePool;

        马列服务表: Service;
    }
}

// 按顺序注册数据库模型插件
const 数据库插件列表 = [
    加载联军表,
    加载全球数据表,
    加载玩家配置表,
    加载玩家表,
    加载服务表,
    ...加载地形相关表,
];

// 统一挂载所有数据库相关服务
export function 数据库服务(ctx: Context) {
    批量加载插件(ctx, 数据库插件列表, "数据库服务模块");
}
