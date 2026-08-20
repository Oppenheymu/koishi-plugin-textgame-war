// 分配装备工作流（正数=库存拨给军队；负数=军队返还库存）
import type { Context } from "koishi";
import type { Army } from "#ctx/military/domain/types/数据类型";

import { 军队状态 } from "#ctx/military/domain/types/枚举";

import type { 装备名 } from "#ctx/military/domain/types/装备属性表";

import { 是否有效装备名 } from "#ctx/military/domain/types/装备属性表";

import type { Player, PlayerWarData } from "#ctx/player";
import { 更新玩家资料 } from "#ctx/player";
import type { 军队操作者 } from "./军队操作者.js";

export async function 分配装备工作流(
    ctx: Context,
    军队: Army,
    操作者: 军队操作者,
    装备名: string,
    数量: number,
): Promise<{ 实际数量: number }> {
    if (军队.指挥官UID !== 操作者.uid) {
        throw new Error("只有指挥官本人才能为军队分配装备");
    }
    if (军队.状态 !== 军队状态.驻扎) {
        throw new Error("战场上无法补给：只有驻扎状态的军队才能调整装备");
    }
    if (!是否有效装备名(装备名)) {
        throw new Error(`未知装备：${装备名}`);
    }
    if (!Number.isInteger(数量) || 数量 === 0) {
        throw new Error("请输入非零整数数量（正数拨出，负数回收）");
    }

    const 键 = 装备名 as 装备名;
    const 军队持有 = Number(军队[键]) || 0;
    const 玩家持有 = Number(操作者.用户资料[键]) || 0;

    if (数量 > 0) {
        const 实际数量 = Math.min(数量, 玩家持有);
        if (实际数量 <= 0) {
            throw new Error(`你的库存中没有【${装备名}】可分配`);
        }
        await Promise.all([
            更新玩家资料(ctx, 操作者.id, {
                [键]: 玩家持有 - 实际数量,
            } as Partial<Player & PlayerWarData>),
            ctx.database.set(
                "征战军队表",
                { id: 军队.id },
                {
                    [键]: 军队持有 + 实际数量,
                },
            ),
        ]);
        return { 实际数量 };
    }

    const 回收数量 = Math.min(-数量, 军队持有);
    if (回收数量 <= 0) {
        throw new Error(`军队中没有【${装备名}】可回收`);
    }
    await Promise.all([
        更新玩家资料(ctx, 操作者.id, {
            [键]: 玩家持有 + 回收数量,
        } as Partial<Player & PlayerWarData>),
        ctx.database.set(
            "征战军队表",
            { id: 军队.id },
            {
                [键]: 军队持有 - 回收数量,
            },
        ),
    ]);
    return { 实际数量: -回收数量 };
}
