import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 改名相关指令 } from "./改名相关/index.js";
import { ViewMap } from "./查看地图.js";
import { 查看版本日志 } from "./版本日志.js";
import { 跨端相关指令 } from "./跨端相关/index.js";

const 基础指令列表 = [查看版本日志, ViewMap, ...改名相关指令, ...跨端相关指令];

export function 基础指令(ctx: Context) {
    批量加载插件(ctx, 基础指令列表, "基础指令模块");
}
