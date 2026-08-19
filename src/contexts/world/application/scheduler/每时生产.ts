import type { Context } from "koishi";
import type { Player } from "#ctx/player/domain/types/基本类型";
import { 服务事件中心 } from "#shared/events";
import type { 每时生产重置结果 } from "#ctx/world/application/scheduler/types";

export async function 执行每时生产重置(ctx: Context): Promise<每时生产重置结果> {
    const logger = ctx.logger("文游服务");
    const 玩家列表 = await ctx.database.get("马列玩家表", {});

    for (const 更新的玩家 of 玩家列表) {
        const 更新: Partial<Player> = { 小时是否生产: false };
        const 旧次数 = 更新的玩家.生产次数 ?? 0;

        if (旧次数 < 8) {
            更新.生产次数 = 旧次数 + 1;
        }

        await ctx.database.set("马列玩家表", { uid: 更新的玩家.uid }, 更新);
    }

    logger.info("生产次数已重置");

    服务事件中心.emit("重置与调度:每时生产重置完成", {
        重置玩家数量: 玩家列表.length,
    });

    return {
        重置玩家数量: 玩家列表.length,
    };
}
