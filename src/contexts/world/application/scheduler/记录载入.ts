import type { Context } from "koishi";
import { 确保服务记录 } from "#/infrastructure";
import type { 服务记录初始化结果 } from "#ctx/world/application/scheduler/types";

import { 获取今天日期 } from "#shared/events";

export async function 初始化服务记录(ctx: Context): Promise<服务记录初始化结果> {
    const 今天 = 获取今天日期();
    const [服务记录] = await ctx.database.get("征战服务表", { id: "service" });

    if (服务记录) {
        return { created: false, 今天 };
    }

    await 确保服务记录(ctx, {
        上次重置签到日期: 今天,
        上次全服统计日期: 今天,
    });

    return { created: true, 今天 };
}
