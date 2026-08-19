import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 分配相关指令 } from "./分配相关";
import { 权限相关指令 } from "./权限相关";
import { 查询相关指令 } from "./查询相关";
import { 联军生命周期 } from "./生命周期";
import { 设置税率 } from "./设置税率";

const 联军插件列表 = [设置税率, ...联军生命周期, ...查询相关指令, ...权限相关指令, ...分配相关指令];

export function 联军指令(ctx: Context) {
    批量加载插件(ctx, 联军插件列表, "联军指令模块");
}
