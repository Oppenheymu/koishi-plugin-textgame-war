import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 地区建筑指令 } from "#/interfaces/commands/region/建筑";
import { 我的驻扎 } from "#/interfaces/commands/region/我的驻扎";
import { 地区战略指令 } from "#/interfaces/commands/region/战略";
import { 地区权限相关指令 } from "#/interfaces/commands/region/权限";
import { 查询相关指令 } from "#/interfaces/commands/region/查询";
import { 地区资源指令 } from "#/interfaces/commands/region/资源";
import { 驻扎 } from "#/interfaces/commands/region/驻扎";

const 地区指令列表 = [
    ...查询相关指令,
    ...地区战略指令,
    ...地区资源指令,
    ...地区建筑指令,
    ...地区权限相关指令,
    驻扎,
    我的驻扎,
];

export function 地区指令(ctx: Context) {
    批量加载插件(ctx, 地区指令列表, "地区指令模块");
}
