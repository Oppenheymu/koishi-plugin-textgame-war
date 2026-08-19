import type { Context, Session } from "koishi";
import type { CoalitionArmy } from "#ctx/coalition";
import { 获取联军展示名称 } from "#ctx/coalition";
import type { Player } from "#ctx/player";
import { 目标解析 } from "#shared/target/玩家";

export async function 目标联军解析(
    ctx: Context,
    session: Session | undefined,
    目标: string,
): Promise<{
    目标用户ID: number;
    目标用户名: string;
    目标用户资料: Player;
    联军编号: string;
    联军资料: CoalitionArmy;
    展示联军名称: string;
}> {
    const 目标结果 = await 目标解析(ctx, session, 目标);

    const 联军编号 = 目标结果.目标用户资料.所在联军;
    if (!联军编号) {
        throw new Error(`${目标结果.目标用户名} 同志目前不在任何联军中`);
    }

    const [联军资料] = await ctx.database.get("马列联军表", { 联军编号 });
    if (!联军资料) {
        throw new Error("数据异常：已记录所在联军但未找到联军档案，请联系管理员");
    }

    return {
        ...目标结果,
        联军编号,
        联军资料,
        展示联军名称: 获取联军展示名称(联军资料),
    };
}
