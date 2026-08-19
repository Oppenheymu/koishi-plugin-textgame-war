import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 军事指令 } from "#/interfaces/commands/military";
import { 地区指令 } from "#/interfaces/commands/region";
import { 基础指令 } from "#/interfaces/commands/common";
import { 生产指令 } from "#/interfaces/commands/player";
import { 联军指令 } from "#/interfaces/commands/coalition";

const 生产插件列表 = [基础指令, 联军指令, 生产指令, 地区指令, 军事指令];

export function 文游指令集(ctx: Context) {
    批量加载插件(ctx, 生产插件列表, "文游指令集模块");
}
