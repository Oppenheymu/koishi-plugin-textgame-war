import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 联军服务列表 } from "#ctx/coalition";
import { 军事服务列表 } from "#ctx/military";
import { 地图生成服务列表, 生产统计服务列表, 重置调度服务列表 } from "#ctx/world";

export * from "#ctx/coalition";
export * from "#ctx/military";
export * from "#ctx/world";

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
