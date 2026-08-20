// 下达命令工作流（撤退 / 死守 / 取消死守）
import type { Context } from "koishi";
import type { Army } from "#ctx/military/domain/types/数据类型";

import type { 军队命令 } from "#ctx/military/domain/types/枚举";
import { 军队状态 } from "#ctx/military/domain/types/枚举";

import { 校验指挥与命令覆盖 } from "#ctx/military/domain/指挥权限";

export async function 下达命令工作流(
    ctx: Context,
    军队: Army,
    命令: 军队命令,
    操作者UID: string,
): Promise<void> {
    if (军队.状态 !== 军队状态.战斗中) {
        throw new Error("只有战斗中的军队才能下达战斗命令");
    }

    const { 操作者军衔 } = await 校验指挥与命令覆盖(ctx, 军队, 操作者UID);

    await ctx.database.set(
        "征战军队表",
        { id: 军队.id },
        {
            当前命令: 命令,
            命令下达者军衔: 操作者军衔,
        },
    );
}
