import type { Context } from "koishi";
import { 执行每日全服统计 } from "#ctx/world/application/stats/全服统计";

export function 每日全服数据统计(ctx: Context) {
    ctx.cron("*/5 * * * *", () => {
        执行每日全服统计(ctx).catch((error) => {
            ctx.logger("全服数据统计").error(error);
        });
    });
}
