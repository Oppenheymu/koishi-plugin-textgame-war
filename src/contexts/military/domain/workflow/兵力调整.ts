// 扩军 / 裁军工作流（直接扣/还指挥官自己的工人）
import type { Context } from "koishi";
import { 军衔权益表 } from "#ctx/military/domain/types/常量";

import type { Army } from "#ctx/military/domain/types/数据类型";

import { 军队状态 } from "#ctx/military/domain/types/枚举";

import { 获取联军军衔记录 } from "#ctx/military/domain/军队解析";

import { 更新玩家资料 } from "#ctx/player";
import type { 军队操作者 } from "./军队操作者.js";

export async function 扩军工作流(
    ctx: Context,
    军队: Army,
    操作者: 军队操作者,
    人力: number,
): Promise<void> {
    if (军队.指挥官UID !== 操作者.uid) {
        throw new Error("只有指挥官本人才能扩军");
    }
    if (军队.状态 !== 军队状态.驻扎) {
        throw new Error("战场上无法补充人力：只有驻扎状态的军队才能扩军");
    }
    if (!Number.isInteger(人力) || 人力 <= 0) {
        throw new Error("请输入正整数人力");
    }

    // 单军兵力上限（按指挥官军衔）
    const 军衔记录 = await 获取联军军衔记录(ctx, 军队.所属联军编号, 操作者.uid);
    const 上限 = 军衔记录 ? 军衔权益表[军衔记录.军衔].单军兵力上限 : 0;
    if (军队.士兵数量 + 人力 > 上限) {
        throw new Error(
            `超出单军兵力上限（${上限}）：当前 ${军队.士兵数量}，最多再扩 ${Math.max(0, 上限 - 军队.士兵数量)}`,
        );
    }

    if (操作者.用户资料.工人 < 人力) {
        throw new Error(`工人不足：需要 ${人力}，现有 ${操作者.用户资料.工人}`);
    }

    await Promise.all([
        更新玩家资料(ctx, 操作者.id, {
            工人: 操作者.用户资料.工人 - 人力,
        }),
        ctx.database.set(
            "马列军队表",
            { id: 军队.id },
            {
                士兵数量: 军队.士兵数量 + 人力,
            },
        ),
    ]);
}

export async function 裁军工作流(
    ctx: Context,
    军队: Army,
    操作者: 军队操作者,
    人力: number,
): Promise<{ 实际裁减: number }> {
    if (军队.指挥官UID !== 操作者.uid) {
        throw new Error("只有指挥官本人才能裁军");
    }
    if (军队.状态 !== 军队状态.驻扎) {
        throw new Error("只有驻扎状态的军队才能裁军");
    }
    if (!Number.isInteger(人力) || 人力 <= 0) {
        throw new Error("请输入正整数人力");
    }

    const 实际裁减 = Math.min(人力, 军队.士兵数量);
    if (实际裁减 <= 0) {
        throw new Error("该军队没有士兵可裁减");
    }

    await Promise.all([
        更新玩家资料(ctx, 操作者.id, {
            工人: 操作者.用户资料.工人 + 实际裁减,
        }),
        ctx.database.set(
            "马列军队表",
            { id: 军队.id },
            {
                士兵数量: 军队.士兵数量 - 实际裁减,
            },
        ),
    ]);
    return { 实际裁减 };
}
