import { Context } from "koishi";
import { 联军政体 } from "../../types";
import { 按政体动态分配权限 } from "../../utils";

async function 执行联军权力动态检测(ctx: Context): Promise<void> {
    const 联军列表 = await ctx.database.get("马列联军表", {});

    for (const 联军资料 of 联军列表) {
        if (
            联军资料.联军政治体制 !== 联军政体.民主制 &&
            联军资料.联军政治体制 !== 联军政体.威权制
        ) {
            continue;
        }

        const 权限列表更新 = 按政体动态分配权限(联军资料);

        await ctx.database.set(
            "马列联军表",
            { 联军编号: 联军资料.联军编号 },
            权限列表更新
        );
    }
}

export function 每小时联军权力检测(ctx: Context) {
    ctx.cron("0 * * * *", () => {
        执行联军权力动态检测(ctx);
    });
}
