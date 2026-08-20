// 组织度恢复（详见 军事系统.prompt.md 第 8 章）
import type { Context } from "koishi";
import { 友方领土恢复倍率, 组织度恢复速率 } from "#ctx/military/domain/types/常量";

import { 军队状态 } from "#ctx/military/domain/types/枚举";

/** 组织度恢复（第 8 章：脱战军队每轮 +0.05，本国领土 ×2，可调） */
export async function 恢复组织度(ctx: Context): Promise<void> {
    const 驻扎军队 = await ctx.database.get("征战军队表", {
        状态: 军队状态.驻扎,
    });

    await Promise.all(
        驻扎军队.map(async (军队) => {
            let 恢复速率 = 组织度恢复速率;
            const [地区] = await ctx.database.get("征战地区表", {
                地区编号: 军队.所在地区编号,
            });
            if (地区?.控制国家 === 军队.所属联军编号) {
                恢复速率 *= 友方领土恢复倍率;
            }

            const 更新: Record<string, unknown> = {};
            if (军队.当前组织度比例 < 1) {
                更新["当前组织度比例"] = Math.min(1, 军队.当前组织度比例 + 恢复速率);
            }
            // 驻扎中重整残余兵力，HP 比例回满（永久损失已在战斗中结算）
            if (军队.当前HP比例 < 1) {
                更新["当前HP比例"] = 1;
            }
            if (Object.keys(更新).length > 0) {
                await ctx.database.set("征战军队表", { id: 军队.id }, 更新);
            }
        }),
    );
}
