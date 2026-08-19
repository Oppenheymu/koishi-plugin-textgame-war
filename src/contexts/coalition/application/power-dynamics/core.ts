import type { Context } from "koishi";
import type { 联军权力检测结果 } from "#ctx/coalition/application/power-dynamics/types";

import { 联军政体 } from "#ctx/coalition/domain/types/联军数据类型";

import { 按政体动态分配权限 } from "#ctx/coalition/domain/政体策略";

async function 执行联军权力动态检测(ctx: Context): Promise<联军权力检测结果> {
    const 联军列表 = await ctx.database.get("马列联军表", {});
    let 更新联军数量 = 0;

    for (const 联军资料 of 联军列表) {
        if (
            联军资料.联军政治体制 !== 联军政体.民主制 &&
            联军资料.联军政治体制 !== 联军政体.威权制
        ) {
            continue;
        }

        const 权限列表更新 = 按政体动态分配权限(联军资料);
        await ctx.database.set("马列联军表", { 联军编号: 联军资料.联军编号 }, 权限列表更新);
        更新联军数量 += 1;
    }

    return {
        检测联军数量: 联军列表.length,
        更新联军数量,
    };
}

export function 每小时联军权力检测(ctx: Context) {
    ctx.cron("0 * * * *", () => {
        执行联军权力动态检测(ctx).catch((error) => {
            ctx.logger("联军权力动态分配").error(error);
        });
    });
}
