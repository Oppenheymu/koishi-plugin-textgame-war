import {
    Context
} from "koishi";
import {
    Player
} from "@/types";

async function 执行生产次数增加(ctx: Context): Promise < void > {
    const logger = ctx.logger("文游服务");
    const 玩家 = await ctx.database.get("马列玩家表", {});

    for (const 更新的玩家 of 玩家) {
        const 更新: Partial < Player > = {
            小时是否生产: false
        };
        const 旧次数 = 更新的玩家.生产次数 ?? 0;

        if (旧次数 < 8) {
            更新.生产次数 = 旧次数 + 1;
        }

        await ctx.database.set("马列玩家表", {
            uid: 更新的玩家.uid
        }, 更新);
    }

    logger.info("生产次数已重置");
}

export function 每小时重置生产(ctx: Context) {
    ctx.cron("0 * * * *", () => {
        执行生产次数增加(ctx);
    });
}
