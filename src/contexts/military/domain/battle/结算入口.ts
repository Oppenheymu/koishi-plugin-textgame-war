// 战斗结算入口（每 5 分钟一轮，详见 军事系统.prompt.md 第 6 章）
import type { Context } from "koishi";
import { 战斗状态 } from "#ctx/military/domain/types/枚举";

import { 结算单场战斗 } from "./单场结算.js";

/** 结算所有进行中战斗的一轮 */
export async function 结算所有战斗(ctx: Context): Promise<void> {
    const 进行中战斗 = await ctx.database.get("征战战斗表", {
        状态: 战斗状态.进行中,
    });
    for (const 战斗 of 进行中战斗) {
        try {
            await 结算单场战斗(ctx, 战斗);
        } catch (error) {
            ctx.logger("战斗结算").error(
                `战斗 #${战斗.id} 结算失败：${error instanceof Error ? error.message : error}`,
            );
        }
    }
}
