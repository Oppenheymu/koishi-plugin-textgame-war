// 解散军队工作流（装备与士兵回收，详见 军事系统.prompt.md 第 7 章指令的业务部分）
import type { Context } from "koishi";
import type { Army } from "#ctx/military/domain/types/数据类型";

import { 军队状态 } from "#ctx/military/domain/types/枚举";

import type { Player, PlayerWarData } from "#ctx/player";
import { 更新玩家资料 } from "#ctx/player";
import type { 军队操作者 } from "./军队操作者.js";

export async function 解散军队工作流(ctx: Context, 军队: Army, 操作者: 军队操作者): Promise<void> {
    if (军队.状态 !== 军队状态.驻扎) {
        throw new Error("只有驻扎状态的军队才能解散");
    }

    // 装备与士兵回收：优先返还指挥官，无主军队由操作者回收（政治接管，可调）
    const 回收者UID = 军队.指挥官UID ?? 操作者.uid;
    const [回收者配置] = await ctx.database.get("征战玩家配置表", {
        uid: 回收者UID,
    });
    if (!回收者配置) {
        throw new Error("回收者账号数据异常，无法解散");
    }

    const [[战争档案], [玩家档案]] = await Promise.all([
        ctx.database.get("征战玩家战争表", { id: 回收者配置.id }),
        ctx.database.get("征战玩家表", { id: 回收者配置.id }),
    ]);

    const 回收更新: Record<string, number> = {};
    for (const 键 of 军队装备列名单) {
        const 数量 = 军队[键] as number;
        if (数量 > 0) {
            回收更新[键] = (Number(战争档案?.[键 as keyof PlayerWarData]) || 0) + 数量;
        }
    }
    if (军队.士兵数量 > 0) {
        回收更新["工人"] = (玩家档案?.工人 ?? 0) + 军队.士兵数量;
    }

    await 更新玩家资料(ctx, 回收者配置.id, 回收更新 as Partial<Player & PlayerWarData>);
    await ctx.database.remove("征战军队表", { id: 军队.id });
}

/** 军队表装备数量列（解散回收用，含空军/弹药占位列） */
const 军队装备列名单 = [
    "步兵装备",
    "卡车",
    "两栖坦克",
    "轻型坦克",
    "中型坦克",
    "重型坦克",
    "现代坦克",
    "装甲运兵车",
    "两栖装甲运兵车",
    "坦克歼击车",
    "自行防空车",
    "野战炮",
    "火炮",
    "火箭炮",
    "列车炮",
    "侦察机",
    "战斗机",
    "预警机",
    "战术轰炸机",
    "战略轰炸机",
    "隐形轰炸机",
    "大型运输机",
    "小型运输机",
    "火箭弹",
    "防空弹药",
    "轻型航弹",
    "重型航弹",
] as const;
