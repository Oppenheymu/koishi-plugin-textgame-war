import type { Context } from "koishi";
import { 批量加载插件 } from "#/infrastructure";
import { 任命指挥官, 我的军衔, 授衔, 褫夺军衔 } from "./军衔指令.js";
import { 军队命名 } from "./军队命名.js";
import { 军队列表, 军队详情, 查看军队, 查看战斗 } from "./查询指令.js";
import { 组建军队, 解散军队 } from "./组建军队.js";
import { 取消死守, 撤退, 死守, 进军 } from "./行动指令.js";
import { 分配装备, 发枪, 扩军, 裁军 } from "./补给指令.js";

const 军事插件列表 = [
    组建军队,
    解散军队,
    军队命名,
    授衔,
    褫夺军衔,
    我的军衔,
    任命指挥官,
    分配装备,
    发枪,
    扩军,
    裁军,
    进军,
    撤退,
    死守,
    取消死守,
    查看军队,
    军队列表,
    军队详情,
    查看战斗,
];

export function 军事指令(ctx: Context) {
    批量加载插件(ctx, 军事插件列表, "军事指令模块");
}
