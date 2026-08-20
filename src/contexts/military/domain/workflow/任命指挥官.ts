// 任命指挥官工作流（政治权限在指令层校验，此处只做军事校验）
import type { Context } from "koishi";
import { 军衔权益表 } from "#ctx/military/domain/types/常量";

import type { Army } from "#ctx/military/domain/types/数据类型";

import { 获取玩家军队列表, 获取联军军衔记录 } from "#ctx/military/domain/军队解析";

export async function 任命指挥官工作流(
    ctx: Context,
    军队: Army,
    目标UID: string,
    目标名称: string,
): Promise<void> {
    if (军队.指挥官UID) {
        throw new Error("该军队已有指挥官，无需任命（如需更换请先褫夺其军衔）");
    }

    // 被任命者需持有军衔且通过建军数量校验
    const 军衔记录 = await 获取联军军衔记录(ctx, 军队.所属联军编号, 目标UID);
    if (!军衔记录) {
        throw new Error(`${目标名称} 没有军衔，无法担任指挥官`);
    }

    const 权益 = 军衔权益表[军衔记录.军衔];
    const 已有军队 = await 获取玩家军队列表(ctx, 军队.所属联军编号, 目标UID);
    if (已有军队.length >= 权益.可建军数量) {
        throw new Error(`${目标名称} 的军队数量已达其军衔上限（${权益.可建军数量} 支）`);
    }

    await ctx.database.set(
        "征战军队表",
        { id: 军队.id },
        {
            指挥官UID: 目标UID,
        },
    );
}
