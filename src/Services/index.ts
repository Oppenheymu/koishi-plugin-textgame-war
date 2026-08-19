import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 军事服务列表 } from "./军事相关/index.js";
import { GenerateMap, 地图生成服务列表 } from "./地图生成/index.js";
import { 生产统计服务列表 } from "./生产统计/index.js";
import { 联军服务列表 } from "./联军相关/index.js";
import { 初始化服务记录, 重置调度服务列表 } from "./重置调度/index.js";

export * from "./军事相关/index.js";
export * from "./地图生成/index.js";
export * from "./生产统计/index.js";
export * from "./联军相关/index.js";
export * from "./重置调度/index.js";

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
