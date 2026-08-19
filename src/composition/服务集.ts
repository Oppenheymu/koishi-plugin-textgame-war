import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 军事服务列表 } from "#ctx/military/application";
import { GenerateMap, 地图生成服务列表 } from "#ctx/world/application/mapgen";
import { 生产统计服务列表 } from "#ctx/world/application/stats";
import { 联军服务列表 } from "#ctx/coalition/application";
import { 初始化服务记录, 重置调度服务列表 } from "#ctx/world/application/scheduler";

export * from "#ctx/military/application";
export * from "#ctx/world/application/mapgen";
export * from "#ctx/world/application/stats";
export * from "#ctx/coalition/application";
export * from "#ctx/world/application/scheduler";

export { GenerateMap, 初始化服务记录 };

const 服务插件列表 = [
    ...重置调度服务列表,
    ...生产统计服务列表,
    ...联军服务列表,
    ...军事服务列表,
    ...地图生成服务列表,
];

export function 文游服务集(ctx: Context) {
    批量加载插件(ctx, 服务插件列表, "文游服务集模块");
}
