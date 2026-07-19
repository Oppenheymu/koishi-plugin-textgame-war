import type { Context } from "koishi";
import type { CoalitionArmy } from "#/types";
import { 获取联军展示名称 } from "./名称";

export async function 联军解析(
    ctx: Context,
    目标联军编号: string,
): Promise<{
    联军编号: string;
    联军资料: CoalitionArmy;
    展示联军名称: string;
}> {
    const 联军编号 = 目标联军编号?.trim();
    if (!联军编号) {
        throw new Error("请指定联军编号，例如：A12345");
    }

    const [联军资料] = await ctx.database.get("马列联军表", { 联军编号 });
    if (!联军资料) {
        throw new Error(`未找到联军：${联军编号}`);
    }

    return {
        联军编号,
        联军资料,
        展示联军名称: 获取联军展示名称(联军资料),
    };
}
