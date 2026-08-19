import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 分配指令 } from "#/interfaces/commands/coalition/分配";
import { 权限指令 } from "#/interfaces/commands/coalition/权限";
import { 查询指令 } from "#/interfaces/commands/coalition/查询";
import { 联军生命周期 } from "#/interfaces/commands/coalition/生命周期";
import { 设置税率 } from "#/interfaces/commands/coalition/设置税率";

const 联军插件列表 = [设置税率, ...联军生命周期, ...查询指令, ...权限指令, ...分配指令];

export function 联军指令(ctx: Context) {
    批量加载插件(ctx, 联军插件列表, "联军指令模块");
}
