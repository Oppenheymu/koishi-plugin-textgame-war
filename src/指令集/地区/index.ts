import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 地区建筑指令 } from "./建筑/index.js";
import { 我的驻扎 } from "./我的驻扎.js";
import { 地区战略指令 } from "./战略/index.js";
import { 地区权限相关指令 } from "./权限/index.js";
import { 查询相关指令 } from "./查询/index.js";
import { 地区资源指令 } from "./资源/index.js";
import { 驻扎 } from "./驻扎.js";

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
