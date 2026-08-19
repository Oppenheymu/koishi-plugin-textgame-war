import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 改名指令 } from "#/interfaces/commands/common/改名";
import { ViewMap } from "#/interfaces/commands/common/查看地图";
import { 查看版本日志 } from "#/interfaces/commands/common/版本日志";
import { 跨端指令 } from "#/interfaces/commands/common/跨端";

const 基础指令列表 = [查看版本日志, ViewMap, ...改名指令, ...跨端指令];

export function 基础指令(ctx: Context) {
    批量加载插件(ctx, 基础指令列表, "基础指令模块");
}
